'use strict';

const S = {
  socket: null,
  name: localStorage.getItem('wd_name') || '',
  email: localStorage.getItem('wd_email') || '',
  picture: localStorage.getItem('wd_picture') || '',
  elo: parseInt(localStorage.getItem('wd_elo') || '1200'),
  mode: '',
  roomId: null,
  players: [],
  myId: null,
  myGuesses: [],
  oppGuesses: [],
  currentInput: '',
  gameOver: false,
  timerInterval: null,
  startTime: null,
  timeLimit: 120,
  scores: { me: 0, opp: 0 },
  countdownInterval: null,
  screenshot: { blocked: false },
};

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','BKSP'],
];
const MAX_GUESSES = 6;
const WORD_LEN = 5;

const $ = id => document.getElementById(id);
const show = id => { const el=$(id); if(el){el.classList.remove('hidden')} };
const hide = id => { const el=$(id); if(el){el.classList.add('hidden')} };

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = $(id);
  if (el) {
    el.offsetHeight;
    el.classList.add('active');
  }
}

function initSocket() {
  S.socket = io({ transports: ['websocket'] });

  S.socket.on('connect', () => { S.myId = S.socket.id; console.log('Connected'); });
  
  S.socket.on('in_queue', () => {
    showScreen('screen-lobby');
    $('lobby-id-title').textContent = 'QUICK MATCH';
    $('lobby-type').textContent = 'Searching for opponent...';
    hide('lobby-code-row');
    $('lobby-opp-card').classList.add('waiting-card');
    $('lobby-opp-card').innerHTML = '<div class="waiting-icon">+</div><div class="waiting-text">Waiting for opponent...</div>';
  });

  S.socket.on('private_room_created', ({ roomId, code }) => {
    S.roomId = roomId;
    showScreen('screen-lobby');
    $('lobby-id-title').textContent = `LOBBY #${code}`;
    $('lobby-type').textContent = 'Competitive 1v1 Arena · Private Room';
    $('lobby-code-display').textContent = code;
    show('lobby-code-row');
    $('lobby-opp-card').className = 'lobby-player-card waiting-card';
    $('lobby-opp-card').innerHTML = '<div class="waiting-icon">+</div><div class="waiting-text">Share the code — waiting for opponent...</div>';
  });

  S.socket.on('match_found', ({ roomId, players, countdown }) => {
    S.roomId = roomId;
    S.players = players;
    const opp = players.find(p => p.id !== S.myId);
    if (opp) {
      $('lobby-opp-card').className = 'lobby-player-card';
      $('lobby-opp-card').innerHTML = `
        <div class="lobby-player-avatar" style="background:${opp.color}">${opp.name[0].toUpperCase()}</div>
        <div class="lobby-player-name">${opp.name}</div>
        <div class="lobby-player-elo">ELO ???</div>
      `;
      hide('lobby-code-row');
      addChatMsg('System', `${opp.name} joined the lobby!`, true);
    }
    setTimeout(() => startCountdown(players, countdown), 1000);
  });

  S.socket.on('round_start', ({ players, timeLimit, startTime }) => {
    S.players = players;
    S.startTime = startTime;
    S.timeLimit = timeLimit;
    S.myGuesses = [];
    S.oppGuesses = [];
    S.currentInput = '';
    S.gameOver = false;
    initGameScreen();
    showScreen('screen-game');
    startTimer();
  });

  S.socket.on('guess_result', ({ guess, guessCount, won, lost }) => {
    addMyGuess(guess);
    S.currentInput = '';
    renderCurrentInput();
    if (won) handleWon();
    else if (lost) handleLost();
  });

  S.socket.on('guess_error', ({ message }) => {
    shakeCurrentRow();
    flashBoardMsg('my-board-msg', message);
  });

  S.socket.on('opponent_guess', ({ result, guessIndex }) => {
    S.oppGuesses[guessIndex] = { result };
    renderOppGuess(guessIndex, result);
    $('ghost-status').textContent = 'Opponent is typing fast...';
    setTimeout(() => { $('ghost-status').textContent = 'Watching...'; }, 2000);
  });

  S.socket.on('opponent_finished', ({ won }) => {
    flashBoardMsg('ghost-status', won ? 'Opponent solved it!' : 'Opponent failed!');
  });

  S.socket.on('round_end', data => {
    stopTimer();
    const me = data.results.find(r => r.id === S.myId);
    if (data.winner === S.myId) {
      S.elo += 25;
    } else if (data.winner) {
      S.elo = Math.max(0, S.elo - 15);
    }
    localStorage.setItem('wd_elo', S.elo);
    updateNavAvatar();
    setTimeout(() => showResultModal(data), 1000);
  });

  S.socket.on('cheating_detected', ({ reason }) => {
    S.screenshot.blocked = true;
    S.gameOver = true;
    stopTimer();
    activateBlackout();
    setTimeout(() => {
      deactivateBlackout();
      $('cheat-desc').textContent = reason || 'Screen capture was detected.';
      $('cheat-modal').classList.remove('hidden');
    }, 2500);
  });

  S.socket.on('opponent_cheated', ({ name }) => {
    flashBoardMsg('ghost-status', `${name} tried to cheat!`);
    $('ghost-status').style.color = 'var(--error)';
  });

  S.socket.on('opponent_disconnected', ({ name }) => {
    flashBoardMsg('ghost-status', `${name} disconnected`);
  });

  S.socket.on('error_msg', ({ message }) => {
    const errEl = $('join-error');
    if (errEl) { errEl.textContent = message; errEl.classList.remove('hidden'); }
  });

  S.socket.on('chat_message', ({ name, text, color }) => {
    const isMine = name === S.name;
    addChatMsg(name, text, false, isMine, color);
  });

  S.socket.on('left_queue', () => {
    showScreen('screen-home');
  });
}

function initHomeListeners() {
  $('quick-match-btn').onclick = () => { S.mode = 'quick'; goNameScreen(); };
  $('create-room-btn').onclick = () => { S.mode = 'create'; goNameScreen(); };

  document.querySelectorAll('[data-section="duel"]').forEach(el => el.addEventListener('click', () => showScreen('screen-home')));
  
  // Rankings and Vault tab support
  document.querySelectorAll('.nav-link').forEach(link => {
    link.onclick = (e) => {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const sec = link.dataset.section;
      if (sec === 'duel') {
        showScreen('screen-home');
      } else if (sec === 'rankings') {
        showScreen('screen-home');
        // Smooth scroll to leaderboard
        document.querySelector('.home-leaderboard').scrollIntoView({ behavior: 'smooth' });
      } else if (sec === 'vault') {
        alert('Vault features are coming soon in Season 4!');
      }
    };
  });

  // ── Real Google Sign-In ──────────────────────────────────────────
  const GOOGLE_CLIENT_ID = '237185810756-mpegrdbmaa32oedh1eiqt7puj3m7510a.apps.googleusercontent.com';

  // Called by Google after successful auth
  window.handleGoogleCredential = function(response) {
    try {
      // Decode the JWT id_token (no library needed — just base64 decode the payload)
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const name    = payload.name  || payload.email.split('@')[0];
      const email   = payload.email || '';
      const picture = payload.picture || '';

      S.name    = name;
      S.email   = email;
      S.picture = picture;
      localStorage.setItem('wd_name',    name);
      localStorage.setItem('wd_email',   email);
      localStorage.setItem('wd_picture', picture);

      updateNavAvatar();

      // Proceed based on which mode the player pressed
      if (S.mode === 'quick')  { S.socket.emit('join_queue', { name }); }
      if (S.mode === 'create') { S.socket.emit('create_private', { name }); }
      if (S.mode === 'join') {
        showScreen('screen-join');
        $('join-code-input').focus();
      }
    } catch(err) {
      console.error('Google auth decode error:', err);
      // Fallback: still let them in via name screen
      showScreen('screen-name');
    }
  };

  function initGoogleSignIn() {
    if (!window.google) {
      // GSI not loaded yet — retry
      setTimeout(initGoogleSignIn, 300);
      return;
    }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: window.handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  }

  const gBtn = $('google-login-btn');
  if (gBtn) {
    gBtn.onclick = () => {
      if (!window.google) {
        alert('Google Sign-In is loading, please try again in a moment.');
        return;
      }
      google.accounts.id.prompt((notification) => {
        // If One Tap is suppressed (e.g. user dismissed it before), use popup flow
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          google.accounts.id.renderButton(
            Object.assign(document.createElement('div'), { style: 'display:none' }),
            { theme: 'filled_black', size: 'large' }
          );
          // Trigger popup directly
          google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'profile email openid',
            callback: () => {},
          });
          // Fallback: show name input so user isn't stuck
          showScreen('screen-name');
          $('name-input').focus();
        }
      });
    };
  }

  // Init Google Sign-In on load
  initGoogleSignIn();

  $('name-confirm-btn').onclick = confirmName;
  $('name-input').addEventListener('keydown', e => { if (e.key === 'Enter') confirmName(); });
  $('name-back-btn').onclick = () => showScreen('screen-home');

  $('join-confirm-btn').onclick = confirmJoin;
  $('join-code-input').addEventListener('keydown', e => { if (e.key === 'Enter') confirmJoin(); });
  $('join-back-btn').onclick = () => showScreen('screen-home');

  $('cheat-ok-btn').onclick = () => { $('cheat-modal').classList.add('hidden'); showScreen('screen-home'); };
  $('rematch-btn').onclick = () => { $('result-modal').classList.add('hidden'); startRematch(); };
  $('lobby-btn').onclick = () => { $('result-modal').classList.add('hidden'); showScreen('screen-home'); };
  $('forfeit-btn').onclick = () => { if (confirm('Forfeit this round?')) { S.socket.emit('forfeit'); } };

  // Copy code button
  $('copy-code-btn').onclick = () => {
    const code = $('lobby-code-display').textContent;
    if (!code) return;
    navigator.clipboard.writeText(code).catch(() => {});
    $('copy-code-btn').textContent = 'Copied!';
    setTimeout(() => { $('copy-code-btn').textContent = 'Copy'; }, 2000);
  };

  // Invite / Share button
  $('invite-friend-btn').onclick = () => {
    const code = $('lobby-code-display').textContent;
    if (!code) return;
    const msg = `Join my Wordle Duel! Code: ${code} → ${location.href}`;
    navigator.clipboard.writeText(msg).catch(() => {});
    $('invite-friend-btn').textContent = 'Copied!';
    setTimeout(() => { $('invite-friend-btn').textContent = 'Share'; }, 2000);
  };

  // Rule option toggles
  document.querySelectorAll('.rule-options').forEach(group => {
    group.querySelectorAll('.rule-opt').forEach(btn => {
      btn.onclick = () => {
        group.querySelectorAll('.rule-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });
  });

  $('chat-send-btn').onclick = sendChat;
  $('chat-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
}

function goNameScreen() {
  if (S.name) {
    if (S.mode === 'quick')  { S.socket.emit('join_queue',    { name: S.name }); return; }
    if (S.mode === 'create') { S.socket.emit('create_private',{ name: S.name }); return; }
    if (S.mode === 'join')   { showScreen('screen-join'); $('join-code-input').value=''; $('join-code-input').focus(); return; }
  }
  showScreen('screen-name');
  $('name-mode-label').textContent = S.mode === 'join' ? 'Join a Private Lobby' : '';
  $('name-input').focus();
}

function confirmName() {
  const name = $('name-input').value.trim();
  if (!name) { $('name-input').focus(); return; }
  S.name = name;
  localStorage.setItem('wd_name', name);
  updateNavAvatar();
  if (S.mode === 'quick')  { S.socket.emit('join_queue', { name }); }
  if (S.mode === 'create') { S.socket.emit('create_private', { name }); }
  if (S.mode === 'join') {
    showScreen('screen-join');
    $('join-code-input').focus();
  }
}

function confirmJoin() {
  if (!S.name) { showScreen('screen-name'); $('name-mode-label').textContent = 'Join a Private Lobby'; return; }
  const code = $('join-code-input').value.trim().toUpperCase().replace(/^PVT_/i,'');
  if (code.length < 4) { const e=$('join-error'); e.textContent='Enter a valid code (4-6 chars).'; e.classList.remove('hidden'); return; }
  $('join-error').classList.add('hidden');
  S.socket.emit('join_private', { code, name: S.name });
}

function sendChat() {
  const input = $('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  S.socket.emit('chat_message', { text: msg });
}

function addChatMsg(name, text, isSystem, isMine, color) {
  const box = $('chat-messages');
  if (!box) return;
  const div = document.createElement('div');
  div.className = 'chat-msg' + (isSystem ? ' system' : isMine ? ' mine' : '');
  if (isSystem) {
    div.textContent = text;
  } else {
    const dot = color ? `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};margin-right:5px;vertical-align:middle"></span>` : '';
    div.innerHTML = `${dot}<span class="msg-name">${name}:</span> ${text}`;
  }
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function updateNavAvatar() {
  const av = $('nav-avatar');
  if (av) {
    if (S.picture) {
      // Show real Google profile picture
      av.style.backgroundImage = `url('${S.picture}')`;
      av.style.backgroundSize = 'cover';
      av.style.backgroundPosition = 'center';
      av.textContent = '';
    } else if (S.name) {
      av.style.backgroundImage = '';
      av.textContent = S.name[0].toUpperCase();
    }
  }
  const lm = $('lobby-my-name');
  if (lm) lm.textContent = S.name || 'Player';
  const la = $('lobby-my-avatar');
  if (la) la.textContent = (S.name[0] || 'P').toUpperCase();
  const rnk = $('nav-rank');
  if (rnk) rnk.textContent = S.elo > 1500 ? 'PLATINUM' : S.elo > 1300 ? 'GOLD II' : 'GOLD I';
  // Update lobby elo display
  const eloEl = document.querySelector('.lobby-player-elo');
  if (eloEl) eloEl.textContent = `ELO ${S.elo.toLocaleString()}`;
}

function startRematch() {
  if (S.mode === 'quick') S.socket.emit('join_queue', { name: S.name });
  else if (S.roomId) S.socket.emit('join_private', { roomId: S.roomId, name: S.name });
  showScreen('screen-lobby');
}

function startCountdown(players, seconds) {
  showScreen('screen-countdown');
  const myPlayer = players.find(p => p.id === S.myId);
  const oppPlayer = players.find(p => p.id !== S.myId);

  const cdPlayers = $('countdown-players');
  cdPlayers.innerHTML = `
    <div class="cdp-chip">
      <div class="cdp-avatar" style="background:${myPlayer?.color||'#8b5cf6'}">${(myPlayer?.name||'Y')[0].toUpperCase()}</div>
      <span class="cdp-name">${myPlayer?.name||'You'}</span>
    </div>
    <div class="cdp-vs">VS</div>
    <div class="cdp-chip">
      <div class="cdp-avatar" style="background:${oppPlayer?.color||'#06b6d4'}">${(oppPlayer?.name||'O')[0].toUpperCase()}</div>
      <span class="cdp-name">${oppPlayer?.name||'Opponent'}</span>
    </div>`;

  let n = seconds;
  const numEl = $('countdown-num');
  numEl.textContent = n;
  clearInterval(S.countdownInterval);
  S.countdownInterval = setInterval(() => {
    n--;
    if (n <= 0) { clearInterval(S.countdownInterval); return; }
    numEl.textContent = n;
    numEl.style.animation = 'none';
    numEl.offsetHeight;
    numEl.style.animation = 'countPop .4s ease';
  }, 1000);
}

function initGameScreen() {
  const me = S.players.find(p => p.id === S.myId);
  const opp = S.players.find(p => p.id !== S.myId);

  $('ghost-name').textContent = opp?.name || 'Opponent';
  $('ghost-avatar').textContent = (opp?.name || 'O')[0].toUpperCase();
  $('ghost-avatar').style.background = opp?.color || '#06b6d4';

  buildBoard('my-board', false);
  buildBoard('opp-board', true);
  buildKeyboard();

  $('my-board-msg').textContent = '';
  $('ghost-status').textContent = 'Waiting for moves...';
  $('ghost-status').style.color = '';
  $('my-score').textContent = S.scores.me;
  $('opp-score').textContent = S.scores.opp;
}

function buildBoard(boardId, isGhost) {
  const board = $(boardId);
  board.innerHTML = '';
  for (let r = 0; r < MAX_GUESSES; r++) {
    const row = document.createElement('div');
    row.className = 'guess-row';
    row.id = `${boardId}-row-${r}`;
    for (let c = 0; c < WORD_LEN; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.id = `${boardId}-r${r}-c${c}`;
      row.appendChild(tile);
    }
    board.appendChild(row);
  }
}

function buildKeyboard() {
  KEYBOARD_ROWS.forEach((keys, ri) => {
    const row = $(`kb-row-${ri + 1}`);
    row.innerHTML = '';
    keys.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'kb-key' + (k.length > 1 ? ' wide' : '');
      btn.textContent = k;
      btn.dataset.key = k;
      btn.addEventListener('click', () => handleKey(k));
      row.appendChild(btn);
    });
  });
}

function addMyGuess(guess) {
  const rowIdx = S.myGuesses.length;
  S.myGuesses.push(guess);
  guess.result.forEach((state, c) => {
    const tile = $(`my-board-r${rowIdx}-c${c}`);
    if (!tile) return;
    tile.textContent = guess.word[c].toUpperCase();
    setTimeout(() => {
      tile.classList.remove('filled','active');
      tile.classList.add(state);
    }, c * 80);
  });
  setTimeout(() => updateKeyboard(guess), 450);
}

function renderOppGuess(rowIdx, result) {
  result.forEach((state, c) => {
    const tile = $(`opp-board-r${rowIdx}-c${c}`);
    if (!tile) return;
    setTimeout(() => tile.classList.add(state), c * 60);
  });
}

function updateKeyboard(guess) {
  const priority = { correct: 3, present: 2, absent: 1 };
  guess.result.forEach((state, i) => {
    const letter = guess.word[i].toUpperCase();
    document.querySelectorAll(`.kb-key[data-key="${letter}"]`).forEach(btn => {
      const cur = btn.classList.contains('correct') ? 3 : btn.classList.contains('present') ? 2 : btn.classList.contains('absent') ? 1 : 0;
      if ((priority[state] || 0) > cur) {
        btn.classList.remove('correct','present','absent');
        btn.classList.add(state);
      }
    });
  });
}

function renderCurrentInput() {
  const rowIdx = S.myGuesses.length;
  if (rowIdx >= MAX_GUESSES) return;
  for (let c = 0; c < WORD_LEN; c++) {
    const tile = $(`my-board-r${rowIdx}-c${c}`);
    if (!tile) continue;
    const ch = S.currentInput[c] || '';
    tile.textContent = ch.toUpperCase();
    tile.classList.remove('correct','present','absent','shake');
    if (ch) {
      tile.classList.add('filled');
      if (c === S.currentInput.length - 1) {
        tile.classList.add('pop');
        setTimeout(() => tile.classList.remove('pop'), 150);
      }
    } else {
      tile.classList.remove('filled');
    }
    tile.classList.toggle('active', c === S.currentInput.length && c < WORD_LEN);
  }
}

function handleKey(key) {
  if (S.gameOver) return;
  if (key === 'BKSP' || key === 'BACKSPACE') {
    S.currentInput = S.currentInput.slice(0, -1);
    renderCurrentInput();
  } else if (key === 'ENTER') {
    submitGuess();
  } else if (/^[A-Z]$/i.test(key) && S.currentInput.length < WORD_LEN) {
    S.currentInput += key.toUpperCase();
    renderCurrentInput();
  }
}

function submitGuess() {
  if (S.currentInput.length < WORD_LEN) {
    shakeCurrentRow();
    flashBoardMsg('my-board-msg', 'Not enough letters');
    return;
  }
  S.socket.emit('submit_guess', { guess: S.currentInput });
}

function shakeCurrentRow() {
  const rowIdx = S.myGuesses.length;
  for (let c = 0; c < WORD_LEN; c++) {
    const tile = $(`my-board-r${rowIdx}-c${c}`);
    if (tile) { tile.classList.add('shake'); setTimeout(() => tile.classList.remove('shake'), 500); }
  }
}

function flashBoardMsg(elId, msg, duration = 2000) {
  const el = $(elId);
  if (!el) return;
  el.textContent = msg;
  clearTimeout(el._t);
  el._t = setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, duration);
}

function handleWon() {
  S.gameOver = true;
  flashBoardMsg('my-board-msg', 'You got it!', 60000);
  const rowIdx = S.myGuesses.length - 1;
  for (let c = 0; c < WORD_LEN; c++) {
    const tile = $(`my-board-r${rowIdx}-c${c}`);
    if (tile) setTimeout(() => tile.classList.add('victory'), c * 100 + 400);
  }
}

function handleLost() {
  S.gameOver = true;
  flashBoardMsg('my-board-msg', 'Out of guesses...', 60000);
}

function startTimer() {
  stopTimer();
  const fill = $('timer-fill');
  const clock = $('game-timer');
  S.timerInterval = setInterval(() => {
    const elapsed = (Date.now() - S.startTime) / 1000;
    const left = Math.max(0, S.timeLimit - elapsed);
    const pct = (left / S.timeLimit) * 100;
    const mm = String(Math.floor(left / 60)).padStart(2, '0');
    const ss = String(Math.floor(left % 60)).padStart(2, '0');
    clock.textContent = `${mm}:${ss}`;
    fill.style.width = `${pct}%`;
    fill.classList.toggle('warn', pct < 40 && pct >= 20);
    fill.classList.toggle('crit', pct < 20);
    clock.classList.toggle('danger', left <= 15);
    if (left <= 0) stopTimer();
  }, 250);
}

function stopTimer() {
  clearInterval(S.timerInterval);
  S.timerInterval = null;
}

function showResultModal(data) {
  const me = data.results.find(r => r.id === S.myId);
  const opp = data.results.find(r => r.id !== S.myId);
  const won = data.winner === S.myId;
  const tie = !data.winner;

  if (won) S.scores.me++;
  else if (!tie && opp) S.scores.opp++;

  const hl = $('result-headline');
  $('result-outcome-label').textContent = tie ? 'DRAW' : won ? 'VICTORY' : 'DEFEAT';
  hl.textContent = tie ? 'DRAW' : won ? 'VICTORY' : 'DEFEAT';
  hl.className = 'result-headline ' + (won ? 'win' : tie ? '' : 'lose');

  const defLine = $('result-defeated-line');
  if (won && opp) defLine.innerHTML = `You defeated <span>${opp.name}</span>`;
  else if (!won && opp) defLine.innerHTML = `Defeated by <span>${opp.name}</span>`;
  else defLine.textContent = '';

  const wordRow = $('result-word-row');
  wordRow.innerHTML = '';
  (data.word || '').split('').forEach(l => {
    const d = document.createElement('div');
    d.className = 'result-letter';
    d.textContent = l.toUpperCase();
    wordRow.appendChild(d);
  });

  const myResult = me?.result;
  $('stat-accuracy').textContent = myResult?.guessCount
    ? `${Math.round(((WORD_LEN * myResult.guessCount - (myResult.guessCount - 1)) / (WORD_LEN * myResult.guessCount)) * 100)}%`
    : '--';
  $('stat-turns').textContent = myResult?.guessCount ? `${myResult.guessCount} / ${MAX_GUESSES}` : '--';
  $('stat-result').textContent = myResult?.cheated ? 'Forfeit' : won ? 'Win' : 'Loss';

  const boardsEl = $('result-boards');
  boardsEl.innerHTML = '';
  [me, opp].filter(Boolean).forEach(player => {
    const wrap = document.createElement('div');
    wrap.className = 'result-board-wrap';
    const lbl = document.createElement('div');
    lbl.className = 'result-board-label';
    lbl.textContent = player.id === S.myId ? 'YOU' : player.name?.toUpperCase();
    const grid = document.createElement('div');
    grid.className = 'result-mini-grid';
    const guesses = player.guesses || [];
    for (let r = 0; r < MAX_GUESSES; r++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'result-mini-row';
      for (let c = 0; c < WORD_LEN; c++) {
        const t = document.createElement('div');
        t.className = 'result-mini-tile';
        if (guesses[r]) t.classList.add(guesses[r].result[c] || '');
        rowEl.appendChild(t);
      }
      grid.appendChild(rowEl);
    }
    wrap.appendChild(lbl);
    wrap.appendChild(grid);
    boardsEl.appendChild(wrap);
  });

  $('result-modal').classList.remove('hidden');
}

function activateBlackout() { $('blackout-overlay').classList.add('active'); }
function deactivateBlackout() { $('blackout-overlay').classList.remove('active'); }

function reportCheat(reason) {
  if (S.screenshot.blocked || S.gameOver) return;
  const gameActive = document.querySelector('#screen-game.active');
  if (!gameActive) return;
  S.socket.emit('cheat_detected', { reason });
}

function initAntiCheat() {
  window.addEventListener('beforeprint', () => { activateBlackout(); reportCheat('Print/screenshot shortcut detected.'); });
  window.addEventListener('afterprint', deactivateBlackout);

  let visHidden = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { visHidden = true; activateBlackout(); }
    else if (visHidden) {
      visHidden = false;
      setTimeout(() => { deactivateBlackout(); reportCheat('Screen was hidden during active duel.'); }, 800);
    }
  });

  window.addEventListener('keydown', e => {
    const prtSc = e.key === 'PrintScreen';
    const ctrlShiftS = e.ctrlKey && e.shiftKey && e.key === 'S';
    const ctrlP = e.ctrlKey && e.key === 'p';
    if (prtSc || ctrlShiftS || ctrlP) {
      e.preventDefault(); activateBlackout(); reportCheat(`Screenshot key detected: ${e.key}`);
      setTimeout(deactivateBlackout, 2500);
    }
  }, true);

  window.addEventListener('blur', () => {
    if (!document.querySelector('#screen-game.active')) return;
    activateBlackout();
    setTimeout(() => {
      if (!document.hasFocus()) reportCheat('Window focus lost during duel (possible Snipping Tool).');
      deactivateBlackout();
    }, 600);
  });

  // Visibility/focus anti-cheat only active during game
}


function initPhysicalKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || $('chat-input') === document.activeElement || $('name-input') === document.activeElement || $('join-code-input') === document.activeElement) return;
    const k = e.key.toUpperCase();
    if (k === 'ENTER') { handleKey('ENTER'); return; }
    if (k === 'BACKSPACE') { handleKey('BKSP'); return; }
    if (/^[A-Z]$/.test(k)) { handleKey(k); return; }
  });
}

function addJoinFromHome() {
  const heroActions = document.querySelector('.hero-cta');
  if (!heroActions || $('join-from-home-btn')) return;
  const joinBtn = document.createElement('button');
  joinBtn.id = 'join-from-home-btn';
  joinBtn.className = 'btn btn-outline btn-hero';
  joinBtn.textContent = 'JOIN WITH CODE';
  joinBtn.onclick = () => {
    S.mode = 'join';
    if (!S.name) {
      $('name-mode-label').textContent = 'Join a Private Lobby';
      showScreen('screen-name');
    } else {
      showScreen('screen-join');
      $('join-code-input').focus();
    }
  };
  heroActions.appendChild(joinBtn);
}

function fetchLeaderboard() {
  fetch('/api/leaderboard')
    .then(r => r.json())
    .then(data => {
      const lb = document.querySelector('.lb-rows');
      if (!lb) return;
      lb.innerHTML = '';
      data.forEach((p, i) => {
        const row = document.createElement('div');
        row.className = 'lb-row';
        const medal = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#444';
        row.innerHTML = `
          <span class="lb-rank" style="color:${medal}">${i + 1}</span>
          <div class="lb-avatar" style="background:#${Math.abs(p.name.split('').reduce((a,c)=>a+c.charCodeAt(0),0)*2654435761)%0xFFFFFF|0 .toString(16).padStart(6,'0')}">${p.name[0].toUpperCase()}</div>
          <div class="lb-info">
            <span class="lb-name">${p.name}</span>
            <span class="lb-sub">W:${p.wins} L:${p.losses}</span>
          </div>
          <span class="lb-elo">${p.elo}<br/><small>ELO</small></span>
        `;
        lb.appendChild(row);
      });
    }).catch(console.error);
}

function fetchLiveRooms() {
  fetch('/api/rooms')
    .then(r => r.json())
    .then(({ rooms: liveRooms, queued }) => {
      const box = $('live-matches');
      const countEl = $('live-count');
      const qBtn = $('queue-status-btn');
      if (!box) return;

      // Update queue button text
      if (qBtn) qBtn.textContent = queued > 0 ? `${queued} IN QUEUE — JOIN` : 'FIND A MATCH';

      // Update count badge
      if (countEl) countEl.textContent = liveRooms.length > 0 ? `${liveRooms.length} LIVE` : '';

      if (liveRooms.length === 0) {
        box.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px 12px;font-size:12px;letter-spacing:.05em;">NO ACTIVE DUELS</div>';
        return;
      }

      box.innerHTML = '';
      liveRooms.slice(0, 4).forEach(room => {
        const [p1, p2] = room.players;
        const mm = String(Math.floor(room.elapsed / 60)).padStart(2, '0');
        const ss = String(room.elapsed % 60).padStart(2, '0');
        const div = document.createElement('div');
        div.className = 'live-match';
        div.innerHTML = `
          <div class="live-player">
            <div class="lb-avatar sm" style="background:${p1?.color || '#8b5cf6'}">${(p1?.name||'?')[0].toUpperCase()}</div>
            <span>${(p1?.name||'Player').toUpperCase()}</span>
          </div>
          <div class="live-center">
            <span class="live-badge">LIVE</span>
            <span style="font-size:10px;color:var(--text-muted);letter-spacing:.04em">${mm}:${ss}</span>
          </div>
          <div class="live-player" style="justify-content:flex-end;flex-direction:row-reverse">
            <div class="lb-avatar sm" style="background:${p2?.color || '#06b6d4'}">${(p2?.name||'?')[0].toUpperCase()}</div>
            <span>${(p2?.name||'Player').toUpperCase()}</span>
          </div>
        `;
        box.appendChild(div);
      });
    }).catch(() => {});
}

function initNavDropdown() {
  const av   = $('nav-avatar');
  const dd   = $('nav-dropdown');
  const wrap = $('nav-avatar-wrap');
  if (!av || !dd) return;

  av.onclick = (e) => {
    e.stopPropagation();
    dd.classList.toggle('hidden');
    if (S.name) {
      $('nav-dd-name').textContent  = S.name;
      $('nav-dd-email').textContent = S.email || '';
    }
  };

  document.addEventListener('click', () => dd.classList.add('hidden'));

  const signOutBtn = $('nav-signout-btn');
  if (signOutBtn) {
    signOutBtn.onclick = () => {
      // Clear all stored auth
      S.name    = '';
      S.email   = '';
      S.picture = '';
      S.elo     = 1200;
      localStorage.removeItem('wd_name');
      localStorage.removeItem('wd_email');
      localStorage.removeItem('wd_picture');
      localStorage.removeItem('wd_elo');
      // Reset avatar
      av.textContent = 'A';
      av.style.backgroundImage = '';
      $('nav-dd-name').textContent = 'Guest';
      $('nav-dd-email').textContent = '';
      dd.classList.add('hidden');
      // Sign out from Google
      if (window.google && google.accounts) {
        google.accounts.id.disableAutoSelect();
      }
      showScreen('screen-home');
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSocket();
  initHomeListeners();
  initPhysicalKeyboard();
  initAntiCheat();
  addJoinFromHome();
  updateNavAvatar();
  initNavDropdown();
  fetchLeaderboard();
  fetchLiveRooms();
  // Poll live rooms every 5s
  setInterval(fetchLiveRooms, 5000);
  // Wire queue button
  const qBtn = $('queue-status-btn');
  if (qBtn) qBtn.onclick = () => { S.mode = 'quick'; goNameScreen(); };
  showScreen('screen-home');
});
