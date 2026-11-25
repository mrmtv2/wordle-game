const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : {};
if (tg.ready) tg.ready();
if (tg.expand) tg.expand();
const userName = (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name) || "Ангелина";

const GREETINGS = [
  "Мяу, привет, " + userName + "! Прокачаем мозги? 🧠✨",
  "Привет! Я по тебе скучал, " + userName + ", ну что, поиграем? 💖",
  "О, " + userName + " заглянула! Устроим разминку для ума? 🎯",
  "Привет, " + userName + "! Я тут поправил очки и загадал отличное слово! 🔥",
  "С возвращением, " + userName + "! Проверим твою интуицию сегодня? 🌟",
  "Привет-привет, " + userName + "! Самое время отвлечься и поиграть ☕️🎮",
  "Ура, " + userName + " здесь! Покажем этим словам, кто тут главный? 👑",
  "Привет, " + userName + "! Загадаем слово посложнее или начнём с разминки? 😉",
  "Рад тебя видеть, " + userName + "! Погнали бить новые рекорды? 🚀",
  "Мур-привет, " + userName + "! У меня припасено кое-что интересное для тебя 🎁"
];

const BANNER_REACTIONS = {
  easy: { title: "🟢 Разминочный!", sub: "Разогреваемся, " + userName + " — у тебя куча попыток!" },
  medium: { title: "🟡 Ммм, не дурно!", sub: "Золотая середина, " + userName + " — я в тебя верю!" },
  hard: { title: "🔴 Ты что, профи?!", sub: "Ого, " + userName + ", всего 5 попыток — погнали!" }
};

const DIFF_SHORT = { easy: "Лёгкий", medium: "Средний", hard: "Сложный" };
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
let fwTimer = null, fwAnimId = null, bannerTimeout = null;

document.getElementById('welcome-msg').innerText = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

function updateStreakBadge() {
  document.getElementById('streak-info').innerText = "🔥 Серия побед: " + winStreak;
}
updateStreakBadge();

function openSetup() {
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('setup-screen').style.display = 'block';
}
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

function showCatBanner(diffKey) {
  const banner = document.getElementById('cat-banner');
  const react = BANNER_REACTIONS[diffKey];
  document.getElementById('banner-title').innerText = react.title;
  document.getElementById('banner-sub').innerText = react.sub;
  if (bannerTimeout) clearTimeout(bannerTimeout);
  banner.classList.add('show');
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
  bannerTimeout = setTimeout(() => { banner.classList.remove('show'); }, 2100);
}

function stopFireworks() {
  if (fwTimer) { clearInterval(fwTimer); fwTimer = null; }
  if (fwAnimId) { cancelAnimationFrame(fwAnimId); fwAnimId = null; }
  const canvas = document.getElementById('fw-canvas');
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function backToMenu() {
  stopFireworks();
  document.getElementById('modal').style.display = 'none';
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('setup-screen').style.display = 'block';
}
function startGame() {
  stopFireworks();
  document.getElementById('modal').style.display = 'none';
  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'flex';
  const pool = (typeof WORDS !== 'undefined' && (WORDS[wordLen] || WORDS[String(wordLen)])) || ["ЧАШКА","ОКЕАН","РАДУГА"];
  secret = pool[Math.floor(Math.random() * pool.length)];
  maxRows = ATTEMPTS[wordLen][diff];
  curRow = 0; curGuess = ''; gameOver = false;

  document.getElementById('info-label').innerText = wordLen + " букв • " + DIFF_SHORT[diff] + " (" + maxRows + " поп.)";

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
      tile.id = 't-' + r + '-' + c;
      row.appendChild(tile);
    }
    board.appendChild(row);
  }
  renderKeyboard();
  showCatBanner(diff);
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
  if (k === '⌫') { curGuess = curGuess.slice(0, -1); updateRow(); }
  else if (k === 'ВВОД') { if (curGuess.length === wordLen) submitGuess(); }
  else if (curGuess.length < wordLen) { curGuess += k; updateRow(); }
}

function updateRow() {
  for (let c = 0; c < wordLen; c++) {
    const tile = document.getElementById('t-' + curRow + '-' + c);
    tile.innerText = curGuess[c] || '';
    tile.classList.toggle('filled', !!curGuess[c]);
  }
}

function launchFireworks() {
  stopFireworks();
  const canvas = document.getElementById('fw-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let particles = [];
  const colors = ['#ff4d4d','#ffd700','#34d399','#38bdf8','#f472b6','#fb923c','#a78bfa'];

  function spawnBurst() {
    const cx = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
    const cy = Math.random() * canvas.height * 0.55 + canvas.height * 0.08;
    for (let i = 0; i < 42; i++) {
      const angle = (Math.PI * 2 * i) / 42;
      const speed = Math.random() * 4.5 + 1.8;
      particles.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, alpha: 1, color: colors[Math.floor(Math.random() * colors.length)] });
    }
  }
  spawnBurst(); spawnBurst();
  fwTimer = setInterval(spawnBurst, 650);

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.alpha -= 0.014;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
    });
    fwAnimId = requestAnimationFrame(animate);
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
    if (res[i] === 'gray' && secArr.includes(curGuess[i])) { res[i] = 'yellow'; secArr[secArr.indexOf(curGuess[i])] = null; }
  }
  for (let i = 0; i < wordLen; i++) {
    const tile = document.getElementById('t-' + curRow + '-' + i);
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
    updateStreakBadge();
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    launchFireworks();
    let msg = diff === 'hard'
      ? "👑 Фантастика, " + userName + "! Слово <b>" + secret + "</b> взято на СЛОЖНОМ уровне! Ты настоящий гений! 🔥"
      : "🎉 Браво, " + userName + "! Слово <b>" + secret + "</b> отгадано за " + (curRow + 1) + " поп.! Какая же ты умница! ✨";
    if (winStreak >= 3) {
      if (diff !== 'hard') msg += "<br><br>🚀 <b>3 победы подряд!</b> Котик советует повышать сложность!";
      else if (wordLen < 6) msg += "<br><br>🔥 <b>3 победы подряд на сложном!</b> Пора переходить на " + (wordLen + 1) + " букв!";
      else msg += "<br><br>💎 <b>3 победы подряд на 6 буквах и сложном уровне!</b> Ты просто настоящая крутышка!";
    }
    lastShareText = "🏆 " + userName + " угадала слово «" + secret + "» (" + wordLen + " букв) за " + (curRow + 1) + "/" + maxRows + " попыток!";
    showModal('🎆 ПОБЕДА! 🎆', msg);
    return;
  }

  curRow++; curGuess = '';
  if (curRow >= maxRows) {
    gameOver = true; lossStreak++; winStreak = 0;
    localStorage.setItem('w_loss', lossStreak); localStorage.setItem('w_win', 0);
    updateStreakBadge();
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
    let msg = diff === 'hard'
      ? "💛 Ничего страшного, " + userName + "! Это же <b>сложный</b> уровень. Котик загадал слово: <b>" + secret + "</b>."
      : "🤗 Ничего страшного, " + userName + ", в следующий раз точно получится! Слово было: <b>" + secret + "</b>.";
    if (lossStreak >= 3) msg += "<br><br>☕️ <b>Уже 3 раза подряд не поддаётся!</b> Котик велел отдохнуть и попить вкусный чай с вкусняшкой! 🍰";
    lastShareText = "🎮 Сыграла в «Угадай слово» (" + wordLen + " букв), загаданное слово было «" + secret + "».";
    showModal('Попытки закончились', msg);
  }
}

function showModal(title, html) {
  document.getElementById('modal-title').innerText = title;
  document.getElementById('modal-text').innerHTML = html;
  document.getElementById('modal').style.display = 'flex';
}
function shareResult() {
  stopFireworks();
  if (tg.sendData) tg.sendData(lastShareText);
  if (tg.close) tg.close();
}
const WIZARD_CAT_SVG = '<svg viewBox="0 0 120 120" width="96" height="96"><polygon points="34,54 40,26 56,46" fill="#eab676" stroke="#d49b57" stroke-width="2" stroke-linejoin="round"/><polygon points="86,54 80,26 64,46" fill="#eab676" stroke="#d49b57" stroke-width="2" stroke-linejoin="round"/><polygon points="39,50 43,32 52,45" fill="#f7b2ad"/><polygon points="81,50 77,32 68,45" fill="#f7b2ad"/><ellipse cx="60" cy="88" rx="34" ry="25" fill="#eab676"/><ellipse cx="60" cy="66" rx="29" ry="24" fill="#f3c68f"/><ellipse cx="60" cy="72" rx="14" ry="10" fill="#fff5e6"/><polygon points="60,66 56,70 64,70" fill="#e07a7a"/><path d="M53,74 Q60,79 60,74 Q60,79 67,74" stroke="#5a3a22" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="48" cy="61" r="5" fill="#1e293b"/><circle cx="72" cy="61" r="5" fill="#1e293b"/><circle cx="46" cy="59" r="1.8" fill="#fff"/><circle cx="70" cy="59" r="1.8" fill="#fff"/><circle cx="48" cy="61" r="10.5" stroke="#38bdf8" stroke-width="2.6" fill="rgba(56,189,248,0.12)"/><circle cx="72" cy="61" r="10.5" stroke="#38bdf8" stroke-width="2.6" fill="rgba(56,189,248,0.12)"/><line x1="58.5" y1="61" x2="61.5" y2="61" stroke="#38bdf8" stroke-width="2.6"/><ellipse cx="44" cy="103" rx="11" ry="8" fill="#f3c68f" stroke="#d49b57" stroke-width="1.5"/><ellipse cx="76" cy="103" rx="11" ry="8" fill="#f3c68f" stroke="#d49b57" stroke-width="1.5"/></svg>';
document.querySelectorAll('.cat-art').forEach(el => { el.innerHTML = WIZARD_CAT_SVG; });

