const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : {};
if (tg.ready) tg.ready();
if (tg.expand) tg.expand();
const userName = (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name) || "Ангелина";

const ATTEMPTS = { 4:{easy:8,medium:6,hard:5}, 5:{easy:10,medium:8,hard:5}, 6:{easy:10,medium:8,hard:5} };
const KB_ROWS = [
  ["Й","Ц","У","К","Е","Н","Г","Ш","Щ","З","Х"],
  ["Ф","Ы","В","А","П","Р","О","Л","Д","Ж","Э"],
  ["ВВОД","Я","Ч","С","М","И","Т","Ь","Б","Ю","⌫"]
];

let wordLen = 5, diff = 'medium', secret = '', maxRows = 8, curRow = 0, curGuess = '', gameOver = false;
let winStreak = Number(localStorage.getItem('w_win') || 0);
let lossStreak = Number(localStorage.getItem('w_loss') || 0);
let lastShareText = '';

function selectLen(l, el) {
  wordLen = l;
  document.querySelectorAll('#len-group .opt-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}
function selectDiff(d, el) {
  diff = d;
  document.querySelectorAll('#diff-group .opt-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}
function backToMenu() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('setup-screen').style.display = 'block';
}

function startGame() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'flex';
  const pool = (typeof WORDS !== 'undefined' && (WORDS[wordLen] || WORDS[String(wordLen)])) || ["ЧАШКА","ОКЕАН","РАДУГА"];
  secret = pool[Math.floor(Math.random() * pool.length)];
  maxRows = ATTEMPTS[wordLen][diff];
  curRow = 0; curGuess = ''; gameOver = false;

  const dNames = {easy:'Лёгкий', medium:'Средний', hard:'Сложный'};
  document.getElementById('info-label').innerText = `${wordLen} букв • ${dNames[diff]} (${maxRows} поп.)`;

  const board = document.getElementById('board');
  board.innerHTML = '';
  const size = maxRows > 8 ? 38 : 44;
  for (let r = 0; r < maxRows; r++) {
    const row = document.createElement('div');
    row.className = 'row';
    for (let c = 0; c < wordLen; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.style.width = size + 'px';
      tile.style.height = size + 'px';
      tile.id = `t-${r}-${c}`;
      row.appendChild(tile);
    }
    board.appendChild(row);
  }
  renderKeyboard();
}

function renderKeyboard() {
  const kb = document.getElementById('keyboard');
  kb.innerHTML = '';
  KB_ROWS.forEach(r => {
    const row = document.createElement('div');
    row.className = 'kb-row';
    r.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'key' + (k.length > 1 ? ' wide' : '');
      btn.innerText = k;
      btn.id = 'key-' + k;
      btn.onclick = () => handleKey(k);
      row.appendChild(btn);
    });
    kb.appendChild(row);
  });
}

function handleKey(k) {
  if (gameOver) return;
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
  if (k === '⌫') {
    curGuess = curGuess.slice(0, -1);
    updateRow();
  } else if (k === 'ВВОД') {
    if (curGuess.length === wordLen) submitGuess();
  } else if (curGuess.length < wordLen) {
    curGuess += k;
    updateRow();
  }
}

function updateRow() {
  for (let c = 0; c < wordLen; c++) {
    const tile = document.getElementById(`t-${curRow}-${c}`);
    tile.innerText = curGuess[c] || '';
    tile.classList.toggle('filled', !!curGuess[c]);
  }
}

function launchFireworks() {
  const canvas = document.getElementById('fw-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const particles = [];
  const colors = ['#ff4d4d','#ffd700','#4dff88','#4da6ff','#ff66ff','#ff944d'];

  for (let b = 0; b < 6; b++) {
    const cx = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
    const cy = Math.random() * canvas.height * 0.45 + canvas.height * 0.1;
    for (let i = 0; i < 45; i++) {
      const angle = (Math.PI * 2 * i) / 45;
      const speed = Math.random() * 4 + 2;
      particles.push({
        x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        alpha: 1, color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.alpha -= 0.015;
      if (p.alpha > 0) {
        alive = true;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
      }
    });
    if (alive) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

function submitGuess() {
  const res = Array(wordLen).fill('gray');
  const secArr = secret.split('');
  for (let i = 0; i < wordLen; i++) {
    if (curGuess[i] === secArr[i]) { res[i] = 'green'; secArr[i] = null; }
  }
  for (let i = 0; i < wordLen; i++) {
    if (res[i] === 'gray' && secArr.includes(curGuess[i])) {
      res[i] = 'yellow'; secArr[secArr.indexOf(curGuess[i])] = null;
    }
  }
  for (let i = 0; i < wordLen; i++) {
    const tile = document.getElementById(`t-${curRow}-${i}`);
    tile.classList.add(res[i]);
    const keyBtn = document.getElementById('key-' + curGuess[i]);
    if (keyBtn) {
      if (res[i] === 'green') { keyBtn.classList.remove('yellow','gray'); keyBtn.classList.add('green'); }
      else if (res[i] === 'yellow' && !keyBtn.classList.contains('green')) { keyBtn.classList.remove('gray'); keyBtn.classList.add('yellow'); }
      else if (res[i] === 'gray' && !keyBtn.classList.contains('green') && !keyBtn.classList.contains('yellow')) { keyBtn.classList.add('gray'); }
    }
  }

  if (curGuess === secret) {
    gameOver = true; winStreak++; lossStreak = 0;
    localStorage.setItem('w_win', winStreak); localStorage.setItem('w_loss', 0);
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    launchFireworks();
    let msg = diff === 'hard'
      ? `👑 Фантастика, ${userName}! Слово <b>${secret}</b> взято на СЛОЖНОМ уровне! Ты настоящий гений! 🔥`
      : `🎉 Браво, ${userName}! Слово <b>${secret}</b> отгадано за ${curRow + 1} поп.! Какая же ты умница! ✨`;
    if (winStreak >= 3) {
      if (diff !== 'hard') msg += `<br><br>🚀 <b>3 победы подряд!</b> Пора повышать сложность!`;
      else if (wordLen < 6) msg += `<br><br>🔥 <b>3 победы подряд на сложном!</b> Пора переходить на ${wordLen + 1} букв!`;
      else msg += `<br><br>💎 <b>3 победы подряд на 6 буквах и сложном уровне!</b> Ты просто настоящая крутышка!`;
    }
    lastShareText = `🏆 ${userName} угадала слово «${secret}» (${wordLen} букв) за ${curRow + 1}/${maxRows} попыток!`;
    showModal('🎆 ПОБЕДА! 🎆', msg);
    return;
  }

  curRow++; curGuess = '';
  if (curRow >= maxRows) {
    gameOver = true; lossStreak++; winStreak = 0;
    localStorage.setItem('w_loss', lossStreak); localStorage.setItem('w_win', 0);
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
    let msg = diff === 'hard'
      ? `💛 Ничего страшного, ${userName}! Это же <b>сложный</b> уровень. Было загадано слово: <b>${secret}</b>.`
      : `🤗 Ничего страшного, ${userName}, в следующий раз точно получится! Слово было: <b>${secret}</b>.`;
    if (lossStreak >= 3) msg += `<br><br>☕️ <b>Уже 3 раза подряд не поддаётся!</b> Отдохни немного и попей вкусный чай с вкусняшкой! 🍰`;
    lastShareText = `🎮 Сыграла в «Угадай слово» (${wordLen} букв), загаданное слово было «${secret}».`;
    showModal('Попытки закончились', msg);
  }
}

function showModal(title, html) {
  document.getElementById('modal-title').innerText = title;
  document.getElementById('modal-text').innerHTML = html;
  document.getElementById('modal').style.display = 'flex';
}
function shareResult() {
  if (tg.sendData) tg.sendData(lastShareText);
  if (tg.close) tg.close();
}
