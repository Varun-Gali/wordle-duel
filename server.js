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

function getRank(elo) {
  if (elo >= 1600) return 'DIAMOND';
  if (elo >= 1400) return 'PLATINUM';
  if (elo >= 1200) return 'GOLD';
  if (elo >= 1000) return 'SILVER';
  return 'BRONZE';
}

function updateLeaderboard(name, won, matchRecord) {
  if (!leaderboard[name]) leaderboard[name] = { name, wins: 0, losses: 0, elo: 1000, streak: 0, wurlds: 10000, themes: ['default'], activeTheme: 'default', history: [] };
  
  if (leaderboard[name].wurlds === undefined) leaderboard[name].wurlds = 10000;
  if (!leaderboard[name].themes) leaderboard[name].themes = ['default'];
  if (!leaderboard[name].history) leaderboard[name].history = [];
  if (!leaderboard[name].activeTheme) leaderboard[name].activeTheme = 'default';

  const oldRank = getRank(leaderboard[name].elo);

  if (won) { 
    leaderboard[name].wins++; 
    leaderboard[name].elo += 25; 
    leaderboard[name].streak = (leaderboard[name].streak || 0) + 1; 
    leaderboard[name].wurlds += 50; 
  } else { 
    leaderboard[name].losses++; 
    leaderboard[name].elo = Math.max(800, leaderboard[name].elo - 15); 
    leaderboard[name].streak = 0; 
    leaderboard[name].wurlds += 10;
  }

  const newRank = getRank(leaderboard[name].elo);
  const rankUp = (oldRank !== newRank && leaderboard[name].elo > 1000 && won);

  if (matchRecord) {
     leaderboard[name].history.unshift(matchRecord);
     if (leaderboard[name].history.length > 10) leaderboard[name].history.pop();
  }
  
  saveLB();
  return { rankUp, newRank, oldRank, elo: leaderboard[name].elo, wurlds: leaderboard[name].wurlds };
}

// ─── Room helpers ─────────────────────────────────────────────────

function createRoom(id, word, wordLength = 5, timeLimit = 60, hardcore = 0, isCustomWord = false, blindfold = 0) {
  return {
    id, word, wordLength, timeLimit, hardcore, isCustomWord, blindfold,
    players: [],
    guesses: {},
    finished: {},
    isProcessing: {},
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

  const matchRecord = {
    date: Date.now(),
    word: room.word,
    p1: { name: room.players[0].name, guesses: room.guesses[room.players[0].id], won: winnerId === room.players[0].id },
    p2: room.players[1] ? { name: room.players[1].name, guesses: room.guesses[room.players[1].id], won: winnerId === room.players[1].id } : null
  };

  const results = room.players.map(p => {
    const lbUpdate = updateLeaderboard(p.name, p.id === winnerId, matchRecord);
    return {
      id: p.id, name: p.name, color: p.color,
      result: room.finished[p.id],
      guesses: room.guesses[p.id],
      cheated: room.cheaters.has(p.id),
      lbUpdate
    };
  });

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
    timeLimit: room.timeLimit,
    startTime: room.startTime,
    wordLength: room.wordLength,
    blindfold: room.blindfold,
  });
  if (room.timeLimit > 0) {
    room.globalTimer = setTimeout(() => endRound(room, null), room.timeLimit * 1000);
  }
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
    const s2 = p2.isBot ? { join: () => {}, emit: () => {} } : io.sockets.sockets.get(p2.socketId);
    if (!s1 || (!s2 && !p2.isBot)) {
      if (s1) waitingPlayers.unshift(p1);
      if (s2) waitingPlayers.unshift(p2);
      continue;
    }

    (async () => {
      const wordLength = p1.length || 5;
      const timeLimit = p1.timeLimit !== undefined ? p1.timeLimit : 60;
      const hardcore = p1.hardcore || 0;
      const blindfold = p1.blindfold || 0;
      const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const word   = await getNextWord(wordLength).catch(() => getRandomWord(wordLength));
      const room   = createRoom(roomId, word, wordLength, timeLimit, hardcore, false, blindfold);
      const colors = ['#8b5cf6', '#06b6d4'];
      const p1Theme = leaderboard[p1.name]?.activeTheme || 'default';
      const p2Theme = leaderboard[p2.name]?.activeTheme || 'default';

      room.players.push({ id: p1.socketId, name: p1.name, color: colors[0], theme: p1Theme });
      room.players.push({ id: p2.socketId, name: p2.name, color: colors[1], theme: p2Theme });
      room.guesses[p1.socketId]  = []; room.finished[p1.socketId] = null;
      room.guesses[p2.socketId]  = []; room.finished[p2.socketId] = null;
      rooms[roomId] = room;
      socketToRoom[p1.socketId] = roomId;
      if (!p2.isBot) socketToRoom[p2.socketId] = roomId;
      s1.join(roomId); if (!p2.isBot) s2.join(roomId);
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
    const playerConf = { socketId: socket.id, name: playerName, length: 5, timeLimit: 60, hardcore: 0, blindfold: 0 };
    waitingPlayers.push(playerConf);
    socket.emit('in_queue', { position: waitingPlayers.length });
    tryMatchmake();
    
    // Auto-fill with bot if waiting too long
    setTimeout(() => {
       const stillInQueue = waitingPlayers.findIndex(p => p.socketId === socket.id);
       if (stillInQueue !== -1 && waitingPlayers.length === 1) {
           waitingPlayers.push({ socketId: 'bot_' + socket.id, name: 'WordBot', length: playerConf.length, timeLimit: playerConf.timeLimit, hardcore: playerConf.hardcore, blindfold: playerConf.blindfold, isBot: true });
           tryMatchmake();
       }
    }, 4000);
  });

  socket.on('update_queue_settings', (settings) => {
    const player = waitingPlayers.find(p => p.socketId === socket.id);
    if (player) {
      if (settings.length) player.length = settings.length;
      if (settings.timer !== undefined) player.timeLimit = settings.timer;
      if (settings.hardcore !== undefined) player.hardcore = settings.hardcore;
      if (settings.blindfold !== undefined) player.blindfold = settings.blindfold;
    }
  });

  socket.on('leave_queue', () => {
    const idx = waitingPlayers.findIndex(p => p.socketId === socket.id);
    if (idx !== -1) waitingPlayers.splice(idx, 1);
    socket.emit('left_queue');
  });

  // ── Private rooms ──
  socket.on('create_private', async ({ name, wordLen, isCustom }) => {
    const playerName = (name || 'Player').slice(0, 16).trim() || 'Player';
    const code   = Math.random().toString(36).slice(2, 8).toUpperCase();
    const roomId = `pvt_${code.toLowerCase()}`;
    const word   = await getNextWord(wordLen).catch(() => getRandomWord(wordLen));
    const room = createRoom(roomId, word, wordLen, 60, 0, isCustom, 0);
    room.isPrivate = true;
    const pTheme = leaderboard[playerName]?.activeTheme || 'default';
    room.players.push({ id: socket.id, name: playerName, color: '#8b5cf6', theme: pTheme });
    room.guesses[socket.id] = [];
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
    const pTheme = leaderboard[playerName]?.activeTheme || 'default';
    room.players.push({ id: socket.id, name: playerName, color: '#06b6d4', theme: pTheme });
    room.guesses[socket.id]  = [];
    room.finished[socket.id] = null;
    socketToRoom[socket.id] = roomId;
    socket.join(roomId);

    io.to(roomId).emit('match_found', { roomId, players: room.players, countdown: 3, private: true });
    setTimeout(() => startRoom(room), 3500);
  });

  socket.on('update_settings', async (settings) => {
    const roomId = socketToRoom[socket.id];
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room || room.players[0].id !== socket.id) return; // Only host can change
    if (room.roundActive) return;

    if (settings.length && !room.isCustomWord) {
       if (room.wordLength !== settings.length) {
           room.wordLength = settings.length;
           room.word = await getNextWord(room.wordLength).catch(() => getRandomWord(room.wordLength));
       }
    }
    if (settings.timer !== undefined) {
       room.timeLimit = settings.timer;
    }
    if (settings.hardcore !== undefined) {
       room.hardcore = settings.hardcore;
    }
    if (settings.blindfold !== undefined) {
       room.blindfold = settings.blindfold;
    }
    
    // Broadcast to other players in the room to update UI
    io.to(roomId).emit('settings_updated', settings);
  });

  // ── Guess ──
  socket.on('submit_guess', async ({ guess }) => {
    const roomId = socketToRoom[socket.id];
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room || !room.roundActive)          return;
    if (room.cheaters.has(socket.id))        return;
    if (room.finished[socket.id] !== null)   return;

    if (room.isProcessing[socket.id])        return;

    room.isProcessing[socket.id] = true;
    try {
      const word = (guess || '').toLowerCase().trim();
      const wLen = room.wordLength || 5;
      if (word.length !== wLen) {
        socket.emit('guess_error', { message: `Word must be ${wLen} letters.` }); return;
      }

      if (room.hardcore === 1) {
        const prevGuesses = room.guesses[socket.id] || [];
        let mustHaveAt = {};
        let mustContain = new Set();
        prevGuesses.forEach(g => {
            g.result.forEach((res, i) => {
                if (res === 'correct') mustHaveAt[i] = g.word[i];
                if (res === 'present') mustContain.add(g.word[i]);
            });
        });
        for (let i in mustHaveAt) {
            if (word[i] !== mustHaveAt[i]) {
                socket.emit('guess_error', { message: `Hardcore: ${mustHaveAt[i].toUpperCase()} must be at pos ${parseInt(i)+1}` }); return;
            }
        }
        for (let c of mustContain) {
            if (!word.includes(c)) {
                socket.emit('guess_error', { message: `Hardcore: Must contain ${c.toUpperCase()}` }); return;
            }
        }
      }

      const isAnswer = word === room.word;
      if (!isAnswer && !isValidWord(word)) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 1500);
          const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, { signal: ctrl.signal });
          clearTimeout(t);
          if (!r.ok) { socket.emit('guess_error', { message: 'Not a valid word.' }); return; }
        } catch { /* timeout or network error — accept the word */ }
      }

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
    } finally {
      room.isProcessing[socket.id] = false;
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

  socket.on('get_profile', ({ name }) => {
    const lb = leaderboard[name];
    if (lb) {
      socket.emit('profile_data', { wurlds: lb.wurlds || 10000, history: lb.history || [], themes: lb.themes || ['default'], activeTheme: lb.activeTheme || 'default' });
    } else {
      socket.emit('profile_data', { wurlds: 10000, history: [], themes: ['default'], activeTheme: 'default' });
    }
  });

  socket.on('buy_theme', ({ themeId, cost, name }) => {
    if (!leaderboard[name]) return;
    if (leaderboard[name].wurlds >= cost && !leaderboard[name].themes.includes(themeId)) {
        leaderboard[name].wurlds -= cost;
        leaderboard[name].themes.push(themeId);
        leaderboard[name].activeTheme = themeId;
        saveLB();
        socket.emit('shop_update', { success: true, wurlds: leaderboard[name].wurlds, themes: leaderboard[name].themes, activeTheme: themeId });
    } else {
        socket.emit('shop_update', { success: false });
    }
  });

  socket.on('set_theme', ({ themeId, name }) => {
    if (!leaderboard[name]) return;
    if (leaderboard[name].themes.includes(themeId)) {
       leaderboard[name].activeTheme = themeId;
       saveLB();
       socket.emit('shop_update', { success: true, wurlds: leaderboard[name].wurlds, themes: leaderboard[name].themes, activeTheme: themeId });
    }
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
