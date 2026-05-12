'use strict';
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { isValidWord, checkGuess, getRandomWord } = require('./words');
const { getNextWord } = require('./aiwords');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// ─── State ─────────────────────────────────────────────────────────
const rooms = {};          // roomId → room
const socketToRoom = {};   // socketId → roomId
const waitingPlayers = [];
const MAX_GUESSES = 6;
const ROUND_TIME  = 120;

// ─── Leaderboard (file-backed persistent) ────────────────────────
const LB_FILE = path.join(__dirname, 'leaderboard.json');
let leaderboard = {}; // starts empty — real players only

try {
  if (fs.existsSync(LB_FILE)) {
    leaderboard = JSON.parse(fs.readFileSync(LB_FILE, 'utf8'));
    console.log('[LB] Loaded leaderboard from file');
  }
} catch(e) { console.error('[LB] Load error:', e.message); }

function saveLB() {
  fs.writeFile(LB_FILE, JSON.stringify(leaderboard, null, 2), () => {});
}

function updateLeaderboard(name, won) {
  if (!leaderboard[name]) leaderboard[name] = { name, wins: 0, losses: 0, elo: 1200 };
  if (won) { leaderboard[name].wins++; leaderboard[name].elo += 25; }
  else     { leaderboard[name].losses++; leaderboard[name].elo = Math.max(1000, leaderboard[name].elo - 15); }
  saveLB();
}

// ─── Room helpers ─────────────────────────────────────────────────

function createRoom(id, word) {
  return {
    id, word,
    players: [],
    guesses: {},
    finished: {},
    cheaters: new Set(),
    roundActive: false,
    startTime: null,
    globalTimer: null,
    chatHistory: [],
  };
}

function endRound(room, winnerId) {
  if (!room.roundActive) return;
  room.roundActive = false;
  clearTimeout(room.globalTimer);

  room.players.forEach(p => updateLeaderboard(p.name, p.id === winnerId));

  const results = room.players.map(p => ({
    id: p.id, name: p.name, color: p.color,
    result: room.finished[p.id],
    guesses: room.guesses[p.id],
    cheated: room.cheaters.has(p.id),
  }));

  io.to(room.id).emit('round_end', { word: room.word, winner: winnerId, results });

  // Clean up after 2 minutes (give time for rematch flow)
  setTimeout(() => {
    room.players.forEach(p => delete socketToRoom[p.id]);
    delete rooms[room.id];
  }, 120_000);
}

function startRoom(room) {
  room.roundActive = true;
  room.startTime = Date.now();
  io.to(room.id).emit('round_start', {
    roomId: room.id,
    players: room.players,
    timeLimit: ROUND_TIME,
    startTime: room.startTime,
  });
  room.globalTimer = setTimeout(() => endRound(room, null), ROUND_TIME * 1000);
}

function handleForfeit(socket, room) {
  if (room.finished[socket.id] === null)
    room.finished[socket.id] = { won: false, forfeit: true, guessCount: room.guesses[socket.id]?.length || 0 };

  const oppId = room.players.find(p => p.id !== socket.id)?.id;
  if (oppId) {
    if (room.finished[oppId] === null)
      room.finished[oppId] = { won: true, walkover: true, guessCount: room.guesses[oppId]?.length || 0 };
    io.to(oppId).emit('opponent_disconnected', { name: room.players.find(p => p.id === socket.id)?.name });
  }
  endRound(room, oppId || null);
}

function tryMatchmake() {
  while (waitingPlayers.length >= 2) {
    const p1 = waitingPlayers.shift();
    const p2 = waitingPlayers.shift();
    const s1 = io.sockets.sockets.get(p1.socketId);
    const s2 = io.sockets.sockets.get(p2.socketId);
    if (!s1 || !s2) {
      if (s1) waitingPlayers.unshift(p1);
      if (s2) waitingPlayers.unshift(p2);
      continue;
    }

    (async () => {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const word   = await getNextWord().catch(() => getRandomWord());
      const room   = createRoom(roomId, word);
      const colors = ['#8b5cf6', '#06b6d4'];

      room.players.push({ id: p1.socketId, name: p1.name, color: colors[0] });
      room.players.push({ id: p2.socketId, name: p2.name, color: colors[1] });
      room.guesses[p1.socketId]  = []; room.finished[p1.socketId] = null;
      room.guesses[p2.socketId]  = []; room.finished[p2.socketId] = null;
      rooms[roomId] = room;
      socketToRoom[p1.socketId] = roomId;
      socketToRoom[p2.socketId] = roomId;
      s1.join(roomId); s2.join(roomId);
      io.to(roomId).emit('match_found', { roomId, players: room.players, countdown: 3 });
      setTimeout(() => startRoom(room), 3500);
    })();
  }
}

// ─── Socket events ────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  // ── Queue ──
  socket.on('join_queue', ({ name }) => {
    const playerName = (name || 'Player').slice(0, 16).trim() || 'Player';
    const idx = waitingPlayers.findIndex(p => p.socketId === socket.id);
    if (idx !== -1) waitingPlayers.splice(idx, 1);
    waitingPlayers.push({ socketId: socket.id, name: playerName });
    socket.emit('in_queue', { position: waitingPlayers.length });
    tryMatchmake();
  });

  socket.on('leave_queue', () => {
    const idx = waitingPlayers.findIndex(p => p.socketId === socket.id);
    if (idx !== -1) waitingPlayers.splice(idx, 1);
    socket.emit('left_queue');
  });

  // ── Private rooms ──
  socket.on('create_private', async ({ name }) => {
    const playerName = (name || 'Player').slice(0, 16).trim() || 'Player';
    const code   = Math.random().toString(36).slice(2, 8).toUpperCase();
    const roomId = `pvt_${code.toLowerCase()}`;
    const word   = await getNextWord().catch(() => getRandomWord());
    const room   = createRoom(roomId, word);
    room.players.push({ id: socket.id, name: playerName, color: '#8b5cf6' });
    room.guesses[socket.id]  = [];
    room.finished[socket.id] = null;
    rooms[roomId] = room;
    socketToRoom[socket.id] = roomId;
    socket.join(roomId);
    socket.emit('private_room_created', { roomId, code, name: playerName });
  });

  socket.on('join_private', async ({ code, name }) => {
    const cleanCode = (code || '').trim().toUpperCase();
    const roomId = `pvt_${cleanCode.toLowerCase()}`;
    const room   = rooms[roomId];

    if (!room)                   { socket.emit('error_msg', { message: 'Room not found. Check the code.' }); return; }
    if (room.players.length >= 2){ socket.emit('error_msg', { message: 'Room is full.' });                   return; }
    if (room.roundActive)        { socket.emit('error_msg', { message: 'Game already in progress.' });        return; }

    const playerName = (name || 'Player').slice(0, 16).trim() || 'Player';
    room.players.push({ id: socket.id, name: playerName, color: '#06b6d4' });
    room.guesses[socket.id]  = [];
    room.finished[socket.id] = null;
    socketToRoom[socket.id] = roomId;
    socket.join(roomId);

    io.to(roomId).emit('match_found', { roomId, players: room.players, countdown: 3, private: true });
    setTimeout(() => startRoom(room), 3500);
  });

  // ── Guess ──
  socket.on('submit_guess', ({ guess }) => {
    const roomId = socketToRoom[socket.id];
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room || !room.roundActive)          return;
    if (room.cheaters.has(socket.id))        return;
    if (room.finished[socket.id] !== null)   return;

    const word = (guess || '').toLowerCase().trim();
    if (word.length !== 5)    { socket.emit('guess_error', { message: 'Word must be 5 letters.' }); return; }
    if (!isValidWord(word))   { socket.emit('guess_error', { message: 'Not in word list.' });        return; }

    const result     = checkGuess(word, room.word);
    const guessObj   = { word, result };
    room.guesses[socket.id].push(guessObj);
    const won        = result.every(r => r === 'correct');
    const guessCount = room.guesses[socket.id].length;

    socket.emit('guess_result', { guess: guessObj, guessCount, won, lost: !won && guessCount >= MAX_GUESSES });

    const oppId = room.players.find(p => p.id !== socket.id)?.id;
    if (oppId) io.to(oppId).emit('opponent_guess', { result, guessIndex: guessCount - 1 });

    if (won || guessCount >= MAX_GUESSES) {
      room.finished[socket.id] = { won, guessCount };
      if (won) {
        socket.emit('you_won');
        if (oppId) io.to(oppId).emit('opponent_finished', { won: true });
      } else {
        if (oppId) io.to(oppId).emit('opponent_finished', { won: false });
      }
      const allDone = room.players.every(p => room.finished[p.id] !== null);
      if (allDone) {
        const winner = room.players.find(p => room.finished[p.id]?.won)?.id || null;
        endRound(room, winner);
      }
    }
  });

  // ── Chat (broadcast to room) ──
  socket.on('chat_message', ({ text }) => {
    const roomId = socketToRoom[socket.id];
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    const name = player?.name || 'Player';
    const msg = { name, text: String(text).slice(0, 200), color: player?.color };
    room.chatHistory.push(msg);
    io.to(roomId).emit('chat_message', msg);
  });

  // ── Cheat detection ──
  socket.on('cheat_detected', ({ reason }) => {
    const roomId = socketToRoom[socket.id];
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room || room.cheaters.has(socket.id)) return;
    room.cheaters.add(socket.id);
    console.log(`[CHEAT] ${socket.id} — ${reason}`);
    if (room.finished[socket.id] === null)
      room.finished[socket.id] = { won: false, cheated: true, guessCount: room.guesses[socket.id]?.length || 0 };
    socket.emit('cheating_detected', { reason });
    const oppId = room.players.find(p => p.id !== socket.id)?.id;
    if (oppId) io.to(oppId).emit('opponent_cheated', { name: room.players.find(p => p.id === socket.id)?.name });
    const allDone = room.players.every(p => room.finished[p.id] !== null);
    if (allDone) endRound(room, room.players.find(p => !room.cheaters.has(p.id))?.id || null);
  });

  // ── Forfeit ──
  socket.on('forfeit', () => {
    const roomId = socketToRoom[socket.id];
    if (roomId && rooms[roomId]) handleForfeit(socket, rooms[roomId]);
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id}`);
    // Remove from queue
    const qi = waitingPlayers.findIndex(p => p.socketId === socket.id);
    if (qi !== -1) waitingPlayers.splice(qi, 1);
    // Forfeit if in a room
    const roomId = socketToRoom[socket.id];
    if (roomId && rooms[roomId]) handleForfeit(socket, rooms[roomId]);
  });
});

// ─── REST ──────────────────────────────────────────────────────────
app.get('/api/leaderboard', (_req, res) => {
  const sorted = Object.values(leaderboard).sort((a, b) => b.elo - a.elo).slice(0, 20);
  res.json(sorted);
});

app.get('/api/rooms', (_req, res) => {
  const active = Object.values(rooms)
    .filter(r => r.roundActive && r.players.length === 2)
    .map(r => ({
      id: r.id,
      players: r.players.map(p => ({ name: p.name, color: p.color })),
      elapsed: r.startTime ? Math.floor((Date.now() - r.startTime) / 1000) : 0,
    }));
  res.json({ rooms: active, queued: waitingPlayers.length });
});

app.get('/api/status', (_req, res) => {
  res.json({
    rooms: Object.keys(rooms).length,
    queued: waitingPlayers.length,
    connected: io.engine.clientsCount,
  });
});

// ─── Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`\n🟩 Wordle Duel → http://localhost:${PORT}\n`));
