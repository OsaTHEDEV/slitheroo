// ============================================================
// SLITHEROO — Enhanced script.js
// Features: power-ups, food types, ghost mode, timed mode,
//   achievements, stats, daily challenge, streaks, screen shake,
//   particles, Web Audio SFX, animated food, combo display,
//   share-as-image, challenge link
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const canvasWrapper = document.getElementById('canvas-wrapper');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const highScoreElement = document.getElementById('high-score');
const streakElement = document.getElementById('streak');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const customizeScreen = document.getElementById('customize-screen');
const pauseScreen = document.getElementById('pause-screen');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const pauseMainMenuBtn = document.getElementById('pause-main-menu-btn');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const continueBtn = document.getElementById('continue-btn');
const continueStatus = document.getElementById('continue-status');
const hasContinueUI = Boolean(continueBtn);
const mainMenuBtn = document.getElementById('main-menu-btn');
const mainHomeBtn = document.getElementById('main-home-btn');
const customizeBtn = document.getElementById('customize-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const modeDesc = document.getElementById('mode-desc');
const skinOptions = document.querySelectorAll('#skins-grid .option');
const themeOptions = document.querySelectorAll('#themes-grid .option');
const zenObstaclesToggle = document.getElementById('zen-obstacles-toggle');
const diffBtns = document.querySelectorAll('.diff-btn');
const splashScreen = document.getElementById('splash-screen');
const splashTitle = document.getElementById('splash-title');
const splashSubtitle = document.getElementById('splash-subtitle');
const nicknameInput = document.getElementById('nickname-input');
const saveNicknameBtn = document.getElementById('save-nickname-btn');
const changeNicknameBtn = document.getElementById('change-nickname-btn');
const nicknameError = document.getElementById('nickname-error');
const currentNicknameElement = document.getElementById('current-nickname');
const leaderboardStatus = document.getElementById('leaderboard-status');
const dailyLeaderboardList = document.getElementById('daily-leaderboard-list');
const alltimeLeaderboardList = document.getElementById('alltime-leaderboard-list');
const dailyTabBtn = document.getElementById('lb-tab-daily');
const alltimeTabBtn = document.getElementById('lb-tab-alltime');
const submitStatus = document.getElementById('submit-status');
const retrySubmitBtn = document.getElementById('retry-submit-btn');
const pregameBestScore = document.getElementById('pregame-best-score');
const pregameDailyRank = document.getElementById('pregame-daily-rank');
const newHighScoreBadge = document.getElementById('new-high-score-badge');

// ── Constants ────────────────────────────────────────────────
const TILE_SIZE = 20, DEFAULT_TILES = 20, EXPANDED_TILES = 30;
const GAME_SPEED_START = 100, SPEED_DECREMENT = 2;
const OBSTACLE_MOVE_INTERVAL = 600, SWIPE_THRESHOLD = 24, COMBO_WINDOW_MS = 2500;
const MAX_SAFE_SCORE = 1000000, SCORE_SUBMIT_COOLDOWN_MS = 3000;
const NICKNAME_KEY = 'slitherooNickname', NICKNAME_SESSION_KEY = 'slitherooSessionNicknameConfirmed';
const CONTINUE_DATE_KEY = 'slitherooContinueDateUtc', CONTINUE_COUNT_KEY = 'slitherooContinueCount';
const STATS_KEY = 'slitherooStats', ACHIEVEMENTS_KEY = 'slitherooAchievements';
const STREAK_KEY = 'slitherooPlayStreak', STREAK_DATE_KEY = 'slitherooLastPlayDate';
const DAILY_SEED_KEY = 'slitherooDailySeed', DAILY_SCORE_KEY = 'slitherooDailyScore';
const SUPABASE_CONFIG = window.SLITHEROO_CONFIG || { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' };
const MAX_CONTINUES_PER_DAY = Number.isInteger(SUPABASE_CONFIG.MAX_CONTINUES_PER_DAY) ? SUPABASE_CONFIG.MAX_CONTINUES_PER_DAY : 1;
window.onGameOver = window.onGameOver || function () {};

// ── Food types ───────────────────────────────────────────────
const FOOD_TYPES = {
  normal:  { points: 10,  color: '#ff0055', glow: '#ff0055', radius: 0.45, spawnWeight: 70 },
  bonus:   { points: 25,  color: '#ffcc00', glow: '#ffaa00', radius: 0.42, spawnWeight: 22 },
  mega:    { points: 50,  color: '#00eeff', glow: '#00ccff', radius: 0.48, spawnWeight: 8  }
};

// ── Power-up types ───────────────────────────────────────────
const POWERUP_TYPES = {
  shield:     { color: '#7c3aed', glow: '#a78bfa', icon: '🛡', duration: 8000,  label: 'Shield'      },
  multiplier: { color: '#f59e0b', glow: '#fcd34d', icon: '✕', duration: 7000,  label: '2× Score'    },
  slowmo:     { color: '#0ea5e9', glow: '#38bdf8', icon: '⏷', duration: 6000,  label: 'Slow Motion' },
  ghost:      { color: '#10b981', glow: '#6ee7b7', icon: '👻', duration: 5000, label: 'Ghost'       }
};

// ── Achievement definitions ──────────────────────────────────
const ACHIEVEMENT_DEFS = [
  { id: 'first_blood',   label: 'First Run',        desc: 'Complete your first game',             icon: '🎮', check: (s,g) => g.gamesPlayed >= 1 },
  { id: 'hungry',        label: 'Hungry',           desc: 'Eat 50 food in one run',               icon: '🍎', check: (s,g) => g.foodThisRun >= 50 },
  { id: 'centurion',     label: 'Centurion',        desc: 'Score 100 points',                     icon: '💯', check: (s,g) => s >= 100 },
  { id: 'high_roller',   label: 'High Roller',      desc: 'Score 500 points',                     icon: '🎰', check: (s,g) => s >= 500 },
  { id: 'legend',        label: 'Legend',           desc: 'Score 1000 points',                    icon: '👑', check: (s,g) => s >= 1000 },
  { id: 'survivor',      label: 'Survivor',         desc: 'Reach level 5',                        icon: '🏆', check: (s,g) => g.levelReached >= 5 },
  { id: 'power_hungry',  label: 'Power Hungry',     desc: 'Collect 10 power-ups total',           icon: '⚡', check: (s,g) => g.totalPowerups >= 10 },
  { id: 'speed_demon',   label: 'Speed Demon',      desc: 'Reach level 8',                        icon: '💨', check: (s,g) => g.levelReached >= 8 },
  { id: 'ghost_rider',   label: 'Ghost Rider',      desc: 'Use Ghost power-up',                   icon: '👻', check: (s,g) => g.usedGhost },
  { id: 'daily_devotee', label: 'Daily Devotee',    desc: 'Play 3 days in a row',                 icon: '📅', check: (s,g) => g.dayStreak >= 3 },
  { id: 'week_warrior',  label: 'Week Warrior',     desc: 'Play 7 days in a row',                 icon: '🔥', check: (s,g) => g.dayStreak >= 7 },
  { id: 'combo_king',    label: 'Combo King',       desc: 'Reach a x10 streak',                   icon: '🔗', check: (s,g) => g.maxStreak >= 10 }
];

// ── State ────────────────────────────────────────────────────
let boardTiles = DEFAULT_TILES, score = 0, level = 1, displayScore = 0;
let highScore = Number(localStorage.getItem('snakeHighScore') || 0);
let bestOccupancy = Number(localStorage.getItem('snakeBestOccupancy') || 0);
let snake = [], food = { x: 0, y: 0, type: 'normal' }, obstacles = [];
let dx = 1, dy = 0, pendingDirection = null;
let gameMode = 'RANKED', currentSkin = 'neon', currentTheme = 'default';
let gameDifficulty = 'NORMAL', currentSpeed = GAME_SPEED_START;
let isPlaying = false, isPaused = false, arenaExpanded = false;
let zenShowObstacles = false, lastObstacleMoveTime = 0;
let rafId = 0, lastFrameTs = 0, accumulator = 0, scoreAnimId = 0;
let lastFoodAt = 0, streakCount = 0, splashTimerId = null;
let awaitingContinue = false, continuedThisRun = false, isFinalized = false;
let graceSteps = 0, lastSafeSnapshot = null;
let playerNickname = '', supabaseClient = null;
let hasPendingScoreSubmission = false, lastSubmitTs = 0;
let pendingScorePayload = null, dailyRankLabel = 'Unranked';
let swipeStart = null;

// Power-up state
let activePowerups = {}; // { type: { expiresAt, timerId } }
let spawnedPowerup = null; // { x, y, type, spawnedAt }
let powerupSpawnTimer = null;
let ghostActive = false;

// Particle state
let particles = [];

// Screen shake
let shakeFrames = 0, shakeIntensity = 0;

// Timed mode
let timedModeSeconds = 60, timedModeRemaining = 60, timedModeTimerId = null;

// Food animation
let foodPulse = 0;

// Run-level stats for achievements
let runStats = {
  foodThisRun: 0, levelReached: 1, totalPowerups: 0,
  usedGhost: false, maxStreak: 0
};

// Persistent stats
let globalStats = loadStats();
let unlockedAchievements = loadAchievements();
let newAchievementsThisRun = [];

// Day streak
let dayStreak = 0;

let renderState = {
  dpr: Math.max(1, window.devicePixelRatio || 1),
  cssSize: 400, tileDrawSize: 20,
  snakeColor: '#00ff88', snakeHead: '#ccffdd', foodColor: '#ff0055'
};

// ── Seeded RNG (for daily challenge) ─────────────────────────
function seededRng(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
let rng = Math.random; // overridden in daily mode

// ── Web Audio ────────────────────────────────────────────────
let audioCtx = null;
let soundEnabled = true;

function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
  }
  return audioCtx;
}

function playTone(freq, type, duration, volume = 0.18, attack = 0.005, decay = 0.12) {
  if (!soundEnabled) return;
  const ac = getAudioCtx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ac.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration + 0.01);
  } catch (_) {}
}

const SFX = {
  eat()       { playTone(440, 'sine', 0.08, 0.14); playTone(660, 'sine', 0.06, 0.10); },
  eatBonus()  { playTone(520, 'triangle', 0.12, 0.18); playTone(780, 'triangle', 0.10, 0.14); },
  eatMega()   { [440,550,660,880].forEach((f,i) => setTimeout(() => playTone(f,'sine',0.1,0.22),i*40)); },
  die()       { playTone(220,'sawtooth',0.25,0.22); playTone(150,'sawtooth',0.20,0.30); },
  levelUp()   { [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f,'sine',0.15,0.18),i*60)); },
  powerup()   { playTone(800,'square',0.08,0.12); playTone(1200,'square',0.06,0.10); },
  powerEnd()  { playTone(300,'sawtooth',0.1,0.15); },
  comboHit()  { playTone(880,'sine',0.05,0.08); },
  shareClick(){ playTone(1000,'sine',0.06,0.08); }
};

// ── Persistent data helpers ──────────────────────────────────
function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; } catch { return {}; }
}
function saveStats() {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(globalStats)); } catch {}
}
function loadAchievements() {
  try { return JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY)) || []; } catch { return []; }
}
function saveAchievements() {
  try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlockedAchievements)); } catch {}
}

function updateDayStreak() {
  const today = todayUtc();
  const last = localStorage.getItem(STREAK_DATE_KEY);
  let streak = Number(localStorage.getItem(STREAK_KEY) || 0);
  if (last === today) { dayStreak = streak; return; }
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  if (last === yStr) { streak += 1; } else { streak = 1; }
  localStorage.setItem(STREAK_KEY, String(streak));
  localStorage.setItem(STREAK_DATE_KEY, today);
  dayStreak = streak;
}

function checkAchievements() {
  const context = { ...runStats, gamesPlayed: globalStats.gamesPlayed || 0, dayStreak };
  let newOnes = [];
  for (const def of ACHIEVEMENT_DEFS) {
    if (!unlockedAchievements.includes(def.id) && def.check(score, context)) {
      unlockedAchievements.push(def.id);
      newOnes.push(def);
    }
  }
  if (newOnes.length) { saveAchievements(); }
  newAchievementsThisRun = newOnes;
  return newOnes;
}

// ── Utility ──────────────────────────────────────────────────
function todayUtc() { return new Date().toISOString().slice(0, 10); }
function debounce(fn, wait) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); }; }
function tryFullscreen() {
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

// ── Canvas / render helpers ──────────────────────────────────
function refreshThemeCache() {
  const s = getComputedStyle(document.documentElement);
  renderState.snakeColor = s.getPropertyValue('--snake-color').trim() || '#00ff88';
  renderState.snakeHead = s.getPropertyValue('--snake-head').trim() || '#ccffdd';
  renderState.foodColor = s.getPropertyValue('--food-color').trim() || '#ff0055';
}
function resizeCanvas() {
  const r = canvasWrapper.getBoundingClientRect();
  const css = Math.floor(Math.max(240, Math.min(r.width, r.height)));
  renderState.cssSize = css;
  renderState.dpr = Math.max(1, window.devicePixelRatio || 1);
  renderState.tileDrawSize = css / boardTiles;
  canvas.style.width = `${css}px`;
  canvas.style.height = `${css}px`;
  canvas.width = Math.floor(css * renderState.dpr);
  canvas.height = Math.floor(css * renderState.dpr);
  ctx.setTransform(renderState.dpr, 0, 0, renderState.dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  refreshThemeCache();
  renderFrame();
}
function px(tile) { return tile * renderState.tileDrawSize; }

// ── Screen shake ─────────────────────────────────────────────
function triggerShake(intensity = 6, frames = 12) {
  shakeIntensity = intensity;
  shakeFrames = frames;
}

// ── Particles ────────────────────────────────────────────────
function spawnParticles(tx, ty, color, count = 10) {
  const cx = px(tx) + renderState.tileDrawSize / 2;
  const cy = px(ty) + renderState.tileDrawSize / 2;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 1.5 + Math.random() * 2.5;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * 2,
      color,
      alpha: 1,
      life: 0.85 + Math.random() * 0.3
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.alpha -= 0.03;
    if (p.alpha <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Drawing ──────────────────────────────────────────────────
function clearCanvas() {
  ctx.clearRect(0, 0, renderState.cssSize, renderState.cssSize);
  const t = renderState.tileDrawSize;
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-line').trim() || '#1e293b';
  for (let i = 0; i <= boardTiles; i++) {
    const p = i * t;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, renderState.cssSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(renderState.cssSize, p); ctx.stroke();
  }
}

function drawFood() {
  const t = renderState.tileDrawSize;
  const ft = FOOD_TYPES[food.type] || FOOD_TYPES.normal;
  const pulse = 1 + Math.sin(foodPulse) * 0.12;
  const r = (t * ft.radius) * pulse;
  ctx.fillStyle = ft.color;
  ctx.shadowBlur = 14;
  ctx.shadowColor = ft.glow;
  ctx.beginPath();
  ctx.arc(px(food.x) + t / 2, px(food.y) + t / 2, r, 0, Math.PI * 2);
  ctx.fill();
  // Inner highlight
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(px(food.x) + t / 2 - r * 0.25, px(food.y) + t / 2 - r * 0.25, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawPowerupItem() {
  if (!spawnedPowerup) return;
  const t = renderState.tileDrawSize;
  const pt = POWERUP_TYPES[spawnedPowerup.type];
  const pulse = 1 + Math.sin(foodPulse * 1.5) * 0.15;
  const r = t * 0.44 * pulse;
  ctx.fillStyle = pt.color;
  ctx.shadowBlur = 18;
  ctx.shadowColor = pt.glow;
  ctx.beginPath();
  ctx.arc(px(spawnedPowerup.x) + t / 2, px(spawnedPowerup.y) + t / 2, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Icon
  ctx.font = `${Math.round(t * 0.52)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pt.icon, px(spawnedPowerup.x) + t / 2, px(spawnedPowerup.y) + t / 2);
}

function drawObstacles() {
  const t = renderState.tileDrawSize;
  ctx.fillStyle = '#ff3366';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#ff3366';
  for (const o of obstacles) { ctx.fillRect(px(o.x), px(o.y), t - 2, t - 2); }
  ctx.shadowBlur = 0;
}

function drawSnake() {
  const t = renderState.tileDrawSize;
  const isGhost = activePowerups.ghost;
  for (let i = 0; i < snake.length; i++) {
    const p = snake[i];
    ctx.fillStyle = i === 0 ? renderState.snakeHead : renderState.snakeColor;
    ctx.shadowBlur = currentSkin === 'glow' ? 24 : 12;
    ctx.shadowColor = renderState.snakeColor;
    if (isGhost) ctx.globalAlpha = 0.55;
    if (activePowerups.shield && i === 0) {
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#a78bfa';
      ctx.shadowBlur = 20;
      ctx.strokeRect(px(p.x) - 1, px(p.y) - 1, t, t);
    }
    if (currentSkin === 'striped' && i % 2 === 0 && i !== 0) ctx.globalAlpha = isGhost ? 0.35 : 0.72;
    else if (currentSkin === 'gradient') ctx.globalAlpha = (isGhost ? 0.55 : 1) - (i / snake.length) * 0.5;
    ctx.fillRect(px(p.x), px(p.y), t - 2, t - 2);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
  }
}

function drawPowerupHUD() {
  const now = Date.now();
  let xOff = 4;
  for (const [type, state] of Object.entries(activePowerups)) {
    const pt = POWERUP_TYPES[type];
    if (!pt) continue;
    const remaining = Math.max(0, state.expiresAt - now);
    const total = pt.duration;
    const frac = remaining / total;
    const barW = 48, barH = 6;
    const x = xOff, y = renderState.cssSize - 22;
    // background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x, y - 14, barW + 2, 20, 4);
    ctx.fill();
    // bar fill
    ctx.fillStyle = pt.glow;
    ctx.shadowBlur = 6;
    ctx.shadowColor = pt.glow;
    ctx.fillRect(x + 1, y - 8, (barW - 2) * frac, barH);
    ctx.shadowBlur = 0;
    // label
    ctx.font = '9px Outfit, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(pt.icon + ' ' + pt.label, x + 1, y - 2);
    xOff += barW + 8;
  }
}

function drawTimerHUD() {
  if (gameMode !== 'TIMED') return;
  const t = timedModeRemaining;
  const color = t <= 10 ? '#ff3366' : t <= 20 ? '#ffcc00' : '#00ff88';
  ctx.font = 'bold 16px Outfit, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.shadowBlur = 8;
  ctx.shadowColor = color;
  ctx.fillText(`⏱ ${t}s`, renderState.cssSize - 6, 6);
  ctx.shadowBlur = 0;
}

function renderFrame() {
  // Apply screen shake
  ctx.save();
  if (shakeFrames > 0) {
    const sx = (Math.random() - 0.5) * shakeIntensity;
    const sy = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(sx, sy);
    shakeFrames--;
    if (shakeFrames <= 0) shakeIntensity = 0;
  }
  clearCanvas();
  drawFood();
  drawPowerupItem();
  if (gameMode === 'RANKED' || (gameMode === 'ZEN' && zenShowObstacles)) drawObstacles();
  drawSnake();
  drawParticles();
  drawPowerupHUD();
  drawTimerHUD();
  ctx.restore();
  foodPulse += 0.08;
  updateParticles();
}

// ── Direction ────────────────────────────────────────────────
function queueDirection(nx, ny) {
  if (!isPlaying || isPaused) return;
  if (nx === -dx && ny === -dy) return;
  pendingDirection = { x: nx, y: ny };
}
function consumeDirection() {
  if (!pendingDirection) return;
  if (pendingDirection.x === -dx && pendingDirection.y === -dy) { pendingDirection = null; return; }
  dx = pendingDirection.x; dy = pendingDirection.y; pendingDirection = null;
}

// ── Score animation ──────────────────────────────────────────
function animateScore(from, to) {
  cancelAnimationFrame(scoreAnimId);
  const start = performance.now(), dur = 220;
  function tick(ts) {
    const p = Math.min(1, (ts - start) / dur);
    displayScore = Math.round(from + (to - from) * p);
    scoreElement.textContent = String(displayScore);
    if (p < 1) scoreAnimId = requestAnimationFrame(tick);
  }
  scoreAnimId = requestAnimationFrame(tick);
}

// ── Streak / combo ───────────────────────────────────────────
function updateStreak() {
  const n = Date.now();
  streakCount = (n - lastFoodAt <= COMBO_WINDOW_MS) ? streakCount + 1 : 1;
  lastFoodAt = n;
  if (streakCount > runStats.maxStreak) runStats.maxStreak = streakCount;
  streakElement.textContent = `x${streakCount}`;
  if (streakCount >= 3) SFX.comboHit();
  showComboPopup(streakCount);
}

function showComboPopup(count) {
  if (count < 3) return;
  const el = document.createElement('div');
  el.className = 'combo-popup';
  el.textContent = `x${count} COMBO!`;
  canvasWrapper.appendChild(el);
  setTimeout(() => el.classList.add('fade-out'), 600);
  setTimeout(() => el.remove(), 1100);
}

// ── Food generation ──────────────────────────────────────────
function pickFoodType() {
  const total = Object.values(FOOD_TYPES).reduce((s, f) => s + f.spawnWeight, 0);
  let r = rng() * total;
  for (const [type, ft] of Object.entries(FOOD_TYPES)) {
    r -= ft.spawnWeight;
    if (r <= 0) return type;
  }
  return 'normal';
}

function isFoodPositionValid(x, y) {
  const hit = o => o.x === x && o.y === y;
  let near = 0;
  const ns = [{ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }];
  for (const n of ns) {
    if (gameMode === 'RANKED' && (n.x < 0 || n.x >= boardTiles || n.y < 0 || n.y >= boardTiles)) { near++; continue; }
    if (obstacles.some(o => o.x === n.x && o.y === n.y)) near++;
  }
  const trapped = near >= 3;
  return !(snake.some(hit) || ((gameMode === 'RANKED' || (gameMode === 'ZEN' && zenShowObstacles)) && obstacles.some(hit)) || trapped);
}

function generateFood() {
  const type = pickFoodType();
  const max = boardTiles * boardTiles * 2;
  for (let i = 0; i < max; i++) {
    const x = Math.floor(rng() * boardTiles), y = Math.floor(rng() * boardTiles);
    if (isFoodPositionValid(x, y)) { food = { x, y, type }; return true; }
  }
  for (let y = 0; y < boardTiles; y++)
    for (let x = 0; x < boardTiles; x++)
      if (isFoodPositionValid(x, y)) { food = { x, y, type }; return true; }
  if (isPlaying) victory();
  return false;
}

// ── Power-up spawning ────────────────────────────────────────
function isPositionFree(x, y) {
  return !snake.some(p => p.x === x && p.y === y) &&
    !(food.x === x && food.y === y) &&
    !obstacles.some(o => o.x === x && o.y === y) &&
    !(spawnedPowerup && spawnedPowerup.x === x && spawnedPowerup.y === y);
}

function spawnPowerup() {
  if (spawnedPowerup) return;
  const types = Object.keys(POWERUP_TYPES);
  const type = types[Math.floor(rng() * types.length)];
  for (let i = 0; i < 200; i++) {
    const x = Math.floor(rng() * boardTiles), y = Math.floor(rng() * boardTiles);
    if (isPositionFree(x, y)) {
      spawnedPowerup = { x, y, type, spawnedAt: Date.now() };
      return;
    }
  }
}

function schedulePowerupSpawn() {
  clearTimeout(powerupSpawnTimer);
  const delay = 8000 + Math.random() * 12000; // 8–20s
  powerupSpawnTimer = setTimeout(() => {
    if (isPlaying && !isPaused) spawnPowerup();
    schedulePowerupSpawn();
  }, delay);
}

function activatePowerup(type) {
  SFX.powerup();
  const pt = POWERUP_TYPES[type];
  if (!pt) return;
  if (activePowerups[type]?.timerId) clearTimeout(activePowerups[type].timerId);
  const timerId = setTimeout(() => {
    delete activePowerups[type];
    SFX.powerEnd();
    showLevelNotice(`${pt.label} expired!`);
  }, pt.duration);
  activePowerups[type] = { expiresAt: Date.now() + pt.duration, timerId };
  if (type === 'ghost') runStats.usedGhost = true;
  runStats.totalPowerups++;
  globalStats.totalPowerups = (globalStats.totalPowerups || 0) + 1;
  showLevelNotice(`${pt.icon} ${pt.label}!`);
}

function clearAllPowerups() {
  for (const state of Object.values(activePowerups)) {
    if (state.timerId) clearTimeout(state.timerId);
  }
  activePowerups = {};
  spawnedPowerup = null;
  clearTimeout(powerupSpawnTimer);
}

// ── Movement ─────────────────────────────────────────────────
function moveSnake() {
  let hx = snake[0].x + dx, hy = snake[0].y + dy;
  if (gameMode === 'ZEN' || gameMode === 'TIMED') {
    if (hx < 0) hx = boardTiles - 1;
    if (hx >= boardTiles) hx = 0;
    if (hy < 0) hy = boardTiles - 1;
    if (hy >= boardTiles) hy = 0;
  }
  const head = { x: hx, y: hy };
  snake.unshift(head);

  // Check powerup pickup
  if (spawnedPowerup && head.x === spawnedPowerup.x && head.y === spawnedPowerup.y) {
    activatePowerup(spawnedPowerup.type);
    spawnParticles(spawnedPowerup.x, spawnedPowerup.y, POWERUP_TYPES[spawnedPowerup.type].glow, 12);
    spawnedPowerup = null;
    snake.pop(); // don't grow on powerup
    return;
  }

  if (head.x === food.x && head.y === food.y) {
    const ft = FOOD_TYPES[food.type] || FOOD_TYPES.normal;
    let pts = ft.points;
    if (activePowerups.multiplier) pts *= 2;
    const prev = score;
    score += pts;
    animateScore(prev, score);
    scoreElement.classList.remove('bump');
    void scoreElement.offsetWidth;
    scoreElement.classList.add('bump');
    checkLevelUp();
    updateStreak();
    spawnParticles(food.x, food.y, ft.color, food.type === 'mega' ? 16 : food.type === 'bonus' ? 12 : 8);
    if (food.type === 'mega') SFX.eatMega();
    else if (food.type === 'bonus') SFX.eatBonus();
    else SFX.eat();
    runStats.foodThisRun++;
    if (score > highScore && newHighScoreBadge) newHighScoreBadge.classList.remove('is-hidden');
    generateFood();
  } else {
    snake.pop();
  }
}

function moveObstacles() {
  for (const obs of obstacles) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const d = dirs[Math.floor(rng() * dirs.length)];
    const nx = (obs.x + d[0] + boardTiles) % boardTiles, ny = (obs.y + d[1] + boardTiles) % boardTiles;
    const occ = snake.some(p => p.x === nx && p.y === ny) ||
      (food.x === nx && food.y === ny) ||
      obstacles.some(o => o !== obs && o.x === nx && o.y === ny);
    if (!occ) { obs.x = nx; obs.y = ny; }
  }
}

function didGameEnd() {
  const h = snake[0];
  if (activePowerups.ghost) return false; // ghost passes through self
  if (activePowerups.shield) {
    // shield absorbs one wall/obstacle hit
    if ((gameMode === 'RANKED') && (h.x < 0 || h.x >= boardTiles || h.y < 0 || h.y >= boardTiles)) {
      delete activePowerups.shield;
      showLevelNotice('🛡 Shield used!');
      return false;
    }
    if (obstacles.some(o => o.x === h.x && o.y === h.y)) {
      delete activePowerups.shield;
      showLevelNotice('🛡 Shield used!');
      return false;
    }
  }
  if (gameMode === 'RANKED') {
    if (h.x < 0 || h.x >= boardTiles || h.y < 0 || h.y >= boardTiles) return true;
  }
  if ((gameMode === 'RANKED' || (gameMode === 'ZEN' && zenShowObstacles)) && obstacles.some(o => o.x === h.x && o.y === h.y)) return true;
  if (!activePowerups.ghost) {
    for (let i = 4; i < snake.length; i++) if (snake[i].x === h.x && snake[i].y === h.y) return true;
  }
  return false;
}

// ── Level / obstacles ────────────────────────────────────────
function generateObstacles() {
  const head = snake[0], near = (x, y) => Math.abs(x - head.x) < 3 && Math.abs(y - head.y) < 3;
  let free = 0;
  for (let y = 0; y < boardTiles; y++)
    for (let x = 0; x < boardTiles; x++) {
      const occ = snake.some(p => p.x === x && p.y === y) || (food.x === x && food.y === y) || obstacles.some(o => o.x === x && o.y === y);
      if (!occ && !near(x, y)) free++;
    }
  const want = Math.min(level - 1, obstacles.length + free);
  let a = 0, max = boardTiles * boardTiles * 3;
  while (obstacles.length < want && a < max) {
    a++;
    const o = { x: Math.floor(rng() * boardTiles), y: Math.floor(rng() * boardTiles) };
    const occ = snake.some(p => p.x === o.x && p.y === o.y) || (food.x === o.x && food.y === o.y) || obstacles.some(e => e.x === o.x && e.y === o.y);
    if (!near(o.x, o.y) && !occ) obstacles.push(o);
  }
}

function checkLevelUp() {
  let threshold = gameDifficulty === 'HARD' ? 100 : 50;
  const nl = Math.floor(score / threshold) + 1;
  if (nl <= level) return;
  level = nl;
  runStats.levelReached = level;
  levelElement.textContent = String(level);
  currentSpeed = Math.max(30, GAME_SPEED_START - ((level - 1) * SPEED_DECREMENT));
  SFX.levelUp();
  showLevelNotice(`LEVEL ${level}`);
  updateLevelTheme();
  if (gameMode === 'RANKED' || (gameMode === 'ZEN' && zenShowObstacles)) generateObstacles();
}

function updateLevelTheme() {
  const themes = ['default', 'cyberpunk', 'classic', 'sunset'];
  currentTheme = themes[(level - 1) % themes.length];
  document.body.setAttribute('data-theme', currentTheme);
  document.documentElement.style.setProperty('--level-hue', `${(level - 1) * 15}deg`);
  refreshThemeCache();
}

function showLevelNotice(text) {
  const n = document.createElement('div');
  n.className = 'level-notice';
  n.textContent = text;
  canvasWrapper.appendChild(n);
  setTimeout(() => n.classList.add('fade-out'), 650);
  setTimeout(() => n.remove(), 1200);
}

function checkArenaExpansion() {
  const occ = snake.length / (boardTiles * boardTiles);
  if (!arenaExpanded && occ > .8) {
    arenaExpanded = true; boardTiles = EXPANDED_TILES;
    resizeCanvas(); showLevelNotice('ARENA EXPANDED!');
  } else if (arenaExpanded && occ > .95) victory();
}

// ── Timed mode ───────────────────────────────────────────────
function startTimedMode() {
  timedModeRemaining = timedModeSeconds;
  clearInterval(timedModeTimerId);
  timedModeTimerId = setInterval(() => {
    if (!isPlaying || isPaused) return;
    timedModeRemaining--;
    if (timedModeRemaining <= 0) {
      clearInterval(timedModeTimerId);
      endGame();
    }
  }, 1000);
}

function stopTimedMode() {
  clearInterval(timedModeTimerId);
  timedModeTimerId = null;
}

// ── Game loop ────────────────────────────────────────────────
function updateStep() {
  consumeDirection();
  lastSafeSnapshot = { snake: snake.map(p => ({ x: p.x, y: p.y })), dx, dy };
  moveSnake();
  if (graceSteps > 0) graceSteps--;
  else if (didGameEnd()) {
    SFX.die();
    triggerShake(8, 14);
    endGame();
    return;
  }
  if (gameMode === 'RANKED' || (gameMode === 'ZEN' && zenShowObstacles)) {
    const now = Date.now();
    if (level >= 10 && now - lastObstacleMoveTime > OBSTACLE_MOVE_INTERVAL) {
      moveObstacles(); lastObstacleMoveTime = now;
    }
  }
  checkArenaExpansion();
}

function frame(ts) {
  if (!isPlaying || isPaused) return;
  if (!lastFrameTs) lastFrameTs = ts;
  const speedMod = activePowerups.slowmo ? 1.8 : 1;
  accumulator += (ts - lastFrameTs) / speedMod;
  lastFrameTs = ts;
  let s = 0;
  while (accumulator >= currentSpeed && s < 5) {
    updateStep();
    if (!isPlaying || isPaused) return;
    accumulator -= currentSpeed;
    s++;
  }
  renderFrame();
  rafId = requestAnimationFrame(frame);
}

function startLoop() { cancelAnimationFrame(rafId); lastFrameTs = 0; accumulator = 0; rafId = requestAnimationFrame(frame); }
function stopLoop() { cancelAnimationFrame(rafId); rafId = 0; }

// ── Continue ─────────────────────────────────────────────────
function canContinueToday() {
  const t = todayUtc(), d = localStorage.getItem(CONTINUE_DATE_KEY);
  if (d !== t) { localStorage.setItem(CONTINUE_DATE_KEY, t); localStorage.setItem(CONTINUE_COUNT_KEY, '0'); return true; }
  return Number(localStorage.getItem(CONTINUE_COUNT_KEY) || 0) < MAX_CONTINUES_PER_DAY;
}
function consumeContinue() {
  const t = todayUtc(), d = localStorage.getItem(CONTINUE_DATE_KEY);
  if (d !== t) { localStorage.setItem(CONTINUE_DATE_KEY, t); localStorage.setItem(CONTINUE_COUNT_KEY, '0'); }
  const c = Number(localStorage.getItem(CONTINUE_COUNT_KEY) || 0) + 1;
  localStorage.setItem(CONTINUE_COUNT_KEY, String(c));
}
async function requestRewardedAdWrapper() {
  if (typeof window.requestRewardedAd === 'function') return Boolean(await window.requestRewardedAd());
  await new Promise(r => setTimeout(r, 150));
  return false;
}

// ── Summary / finalize ───────────────────────────────────────
function populateSummary(prefix) {
  const occ = (snake.length / (boardTiles * boardTiles)) * 100;
  if (occ > bestOccupancy) { bestOccupancy = occ; localStorage.setItem('snakeBestOccupancy', String(bestOccupancy)); }
  const set = (id, val) => { const el = document.getElementById(`${prefix}-${id}`); if (el) el.textContent = val; };
  set('score', String(score));
  set('level', String(level));
  set('length', String(snake.length));
  set('occupancy', `${occ.toFixed(1)}%`);
  set('mode', gameMode);
  set('best-occupancy', `${Number(bestOccupancy).toFixed(1)}%`);
}

function renderAchievementBadges(newOnes) {
  const container = document.getElementById('achievement-badges');
  if (!container) return;
  container.innerHTML = '';
  if (!newOnes.length) { container.style.display = 'none'; return; }
  container.style.display = 'flex';
  newOnes.forEach(a => {
    const el = document.createElement('div');
    el.className = 'achievement-badge';
    el.innerHTML = `<span class="badge-icon">${a.icon}</span><span class="badge-label">${a.label}</span>`;
    container.appendChild(el);
  });
}

function finalizeGameOver() {
  if (isFinalized) return;
  isFinalized = true;
  awaitingContinue = false;
  if (continueBtn) continueBtn.disabled = true;
  if (continueStatus) continueStatus.textContent = 'Continue unavailable.';

  // Update global stats
  globalStats.gamesPlayed = (globalStats.gamesPlayed || 0) + 1;
  globalStats.totalFood = (globalStats.totalFood || 0) + runStats.foodThisRun;
  globalStats.totalScore = (globalStats.totalScore || 0) + score;
  globalStats.bestScore = Math.max(globalStats.bestScore || 0, score);
  globalStats.bestLevel = Math.max(globalStats.bestLevel || 0, level);
  saveStats();

  // Daily challenge score
  if (gameMode === 'DAILY') {
    const prev = Number(localStorage.getItem(DAILY_SCORE_KEY) || 0);
    if (score > prev) localStorage.setItem(DAILY_SCORE_KEY, String(score));
  }

  // Check achievements
  const newOnes = checkAchievements();
  renderAchievementBadges(newOnes);

  submitScoreIfEligible();
  try { window.onGameOver(score, { mode: gameMode, level, highScore, isNewHighScore: score >= highScore, dailyContinueUsed: continuedThisRun, canContinue: canContinueToday() && !continuedThisRun }); } catch { }
}

function reviveGame() {
  if (lastSafeSnapshot) { snake = lastSafeSnapshot.snake.map(p => ({ x: p.x, y: p.y })); dx = lastSafeSnapshot.dx; dy = lastSafeSnapshot.dy; }
  graceSteps = 2;
  gameOverScreen.classList.remove('active');
  gameOverScreen.classList.add('hidden');
  isPlaying = true; isPaused = false;
  document.body.classList.add('is-playing');
  startLoop();
}

function endGame() {
  isPlaying = false; isPaused = false;
  stopLoop();
  stopTimedMode();
  clearAllPowerups();
  document.body.classList.remove('is-playing');
  navigator.vibrate?.(35);
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snakeHighScore', String(highScore));
    highScoreElement.textContent = String(highScore);
  }
  populateSummary('summary');
  renderShareButton();
  gameOverScreen.classList.remove('hidden');
  gameOverScreen.classList.add('active');
  awaitingContinue = hasContinueUI && !continuedThisRun && canContinueToday() && gameMode !== 'DAILY';
  if (continueBtn) continueBtn.disabled = !awaitingContinue;
  if (!awaitingContinue) finalizeGameOver();
  else if (continueStatus) continueStatus.textContent = 'One continue available today.';
}

function victory() {
  isPlaying = false; stopLoop();
  showLevelNotice('ULTIMATE VICTORY!');
  setTimeout(() => {
    endGame();
    if (document.querySelector('#game-over-screen .danger-text')) {
      const t = document.querySelector('#game-over-screen .danger-text');
      t.textContent = 'YOU WON!'; t.style.color = 'var(--snake-color)';
    }
  }, 1000);
}

// ── Reset / start ─────────────────────────────────────────────
function resetGame() {
  score = 0; displayScore = 0; level = 1; currentSpeed = GAME_SPEED_START;
  obstacles = []; boardTiles = DEFAULT_TILES; arenaExpanded = false;
  lastObstacleMoveTime = 0; streakCount = 0; lastFoodAt = 0;
  graceSteps = 0; awaitingContinue = false; continuedThisRun = false; isFinalized = false;
  particles = []; shakeFrames = 0; shakeIntensity = 0;
  runStats = { foodThisRun: 0, levelReached: 1, totalPowerups: 0, usedGhost: false, maxStreak: 0 };
  newAchievementsThisRun = [];
  scoreElement.textContent = '0'; levelElement.textContent = '1'; streakElement.textContent = 'x0';
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dx = 1; dy = 0; pendingDirection = null;
  clearAllPowerups();
  // Daily challenge uses seeded rng
  if (gameMode === 'DAILY') {
    const seed = getDailySeed();
    rng = seededRng(seed);
  } else {
    rng = Math.random;
  }
  generateFood();
  resizeCanvas();
  if (newHighScoreBadge) newHighScoreBadge.classList.add('is-hidden');
}

function getDailySeed() {
  const d = todayUtc().replace(/-/g, '');
  return parseInt(d, 10) % 2147483647;
}

function startGame(showTransition = true) {
  if (!ensureNicknameReady()) return;
  tryFullscreen();
  if (showTransition) {
    showSplash({ title: 'GET READY', subtitle: `${gameMode} mode — ${gameDifficulty}`, duration: 700, onComplete: () => startGame(false) });
    return;
  }
  resetGame();
  updateDayStreak();
  startScreen.classList.remove('active'); startScreen.classList.add('hidden');
  gameOverScreen.classList.remove('active'); gameOverScreen.classList.add('hidden');
  pauseScreen.classList.remove('active'); pauseScreen.classList.add('hidden');
  isPlaying = true; isPaused = false;
  document.body.classList.add('is-playing');
  schedulePowerupSpawn();
  if (gameMode === 'TIMED') startTimedMode();
  startLoop();
}

function togglePause() {
  if (!isPlaying) return;
  isPaused = !isPaused;
  if (isPaused) {
    populateSummary('pause');
    pauseScreen.classList.remove('hidden'); pauseScreen.classList.add('active');
    stopLoop(); stopTimedMode();
  } else resumeGame();
}

function resumeGame() {
  if (!isPlaying) return;
  isPaused = false;
  pauseScreen.classList.remove('active'); pauseScreen.classList.add('hidden');
  if (gameMode === 'TIMED') startTimedMode();
  startLoop();
}

function showCustomization() {
  startScreen.classList.remove('active'); startScreen.classList.add('hidden');
  customizeScreen.classList.remove('hidden'); customizeScreen.classList.add('active');
}
function hideCustomization() {
  customizeScreen.classList.remove('active'); customizeScreen.classList.add('hidden');
  startScreen.classList.remove('hidden'); startScreen.classList.add('active');
}

function showSplash(o = {}) {
  const title = o.title || 'SLITHEROO', subtitle = o.subtitle || 'Enter the neon arena.', duration = typeof o.duration === 'number' ? o.duration : 1300;
  if (!splashScreen || !splashTitle || !splashSubtitle) { if (typeof o.onComplete === 'function') o.onComplete(); return; }
  if (splashTimerId) { clearTimeout(splashTimerId); splashTimerId = null; }
  splashTitle.textContent = title; splashSubtitle.textContent = subtitle;
  splashScreen.classList.remove('hidden'); splashScreen.classList.add('active');
  splashTimerId = setTimeout(() => {
    splashScreen.classList.remove('active'); splashScreen.classList.add('hidden');
    splashTimerId = null;
    if (typeof o.onComplete === 'function') o.onComplete();
  }, duration);
}

function goToMainMenu(showTransition = true) {
  if (awaitingContinue && !isFinalized) finalizeGameOver();
  if (showTransition) {
    showSplash({ title: 'MAIN MENU', subtitle: 'Tune settings and launch another run.', duration: 650, onComplete: () => goToMainMenu(false) });
    return;
  }
  isPlaying = false; isPaused = false;
  stopLoop(); stopTimedMode(); clearAllPowerups();
  document.body.classList.remove('is-playing');
  gameOverScreen.classList.remove('active'); gameOverScreen.classList.add('hidden');
  customizeScreen.classList.remove('active'); customizeScreen.classList.add('hidden');
  pauseScreen.classList.remove('active'); pauseScreen.classList.add('hidden');
  startScreen.classList.remove('hidden'); startScreen.classList.add('active');
  resetGame(); setSubmitStatus(''); loadLeaderboards(); updatePregameStats();
}

// ── Share score ──────────────────────────────────────────────
function renderShareButton() {
  const container = document.getElementById('share-btn-container');
  if (!container) return;
  container.innerHTML = '';
  const btn = document.createElement('button');
  btn.className = 'glass-btn small';
  btn.textContent = '📸 Share Score';
  btn.addEventListener('click', shareScore);
  container.appendChild(btn);
  const linkBtn = document.createElement('button');
  linkBtn.className = 'glass-btn small';
  linkBtn.textContent = '🔗 Challenge Link';
  linkBtn.addEventListener('click', copyChallengeLink);
  container.appendChild(linkBtn);
}

function shareScore() {
  SFX.shareClick();
  const shareCanvas = document.createElement('canvas');
  const W = 600, H = 320;
  shareCanvas.width = W; shareCanvas.height = H;
  const c = shareCanvas.getContext('2d');

  // Background gradient
  const grad = c.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0b1224');
  grad.addColorStop(1, '#1a0a2e');
  c.fillStyle = grad;
  c.fillRect(0, 0, W, H);

  // Neon border
  c.strokeStyle = '#00ff88';
  c.lineWidth = 2;
  c.shadowBlur = 20; c.shadowColor = '#00ff88';
  c.strokeRect(8, 8, W - 16, H - 16);
  c.shadowBlur = 0;

  // Title
  c.fillStyle = '#00ff88';
  c.font = 'bold 36px Outfit, sans-serif';
  c.textAlign = 'center';
  c.shadowBlur = 16; c.shadowColor = '#00ff88';
  c.fillText('SLITHEROO', W / 2, 68);
  c.shadowBlur = 0;

  // Score
  c.fillStyle = '#f8fafc';
  c.font = 'bold 72px Outfit, sans-serif';
  c.shadowBlur = 12; c.shadowColor = '#38bdf8';
  c.fillText(String(score), W / 2, 160);
  c.shadowBlur = 0;

  c.fillStyle = 'rgba(248,250,252,0.55)';
  c.font = '22px Outfit, sans-serif';
  c.fillText(`Level ${level}  •  ${gameMode} mode`, W / 2, 200);

  if (playerNickname) {
    c.fillStyle = 'rgba(248,250,252,0.45)';
    c.font = '18px Outfit, sans-serif';
    c.fillText(`by ${playerNickname}`, W / 2, 232);
  }

  c.fillStyle = '#38bdf8';
  c.font = '16px Outfit, sans-serif';
  c.fillText('slitheroo.online', W / 2, 292);

  shareCanvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `slitheroo-score-${score}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function copyChallengeLink() {
  SFX.shareClick();
  const url = `https://slitheroo.online?challenge=${encodeURIComponent(playerNickname)}&score=${score}`;
  navigator.clipboard?.writeText(url).then(() => showLevelNotice('Link copied!')).catch(() => {
    prompt('Copy this challenge link:', url);
  });
}

// ── Controls ─────────────────────────────────────────────────
function changeDirection(event) {
  const key = event.key, n = typeof key === 'string' ? key.toLowerCase() : '';
  if (key === 'Escape' || n === 'p') { togglePause(); return; }
  if (n === 'm') { soundEnabled = !soundEnabled; showLevelNotice(soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'); return; }
  const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1] };
  const v = d[key] || d[n];
  if (!v) return;
  queueDirection(v[0], v[1]);
}

// ── Nickname ─────────────────────────────────────────────────
function normalizeNickname(input) { return String(input || '').trim().replace(/\s+/g, ' '); }
function validateNickname(raw) {
  const n = normalizeNickname(raw);
  if (!n) return { valid: false, nickname: n, message: 'Nickname is required.' };
  if (n.length < 3 || n.length > 16) return { valid: false, nickname: n, message: 'Nickname must be 3–16 characters.' };
  if (!/^[A-Za-z0-9 _-]+$/.test(n)) return { valid: false, nickname: n, message: 'Use letters, numbers, spaces, underscore, or hyphen only.' };
  if (n.toLowerCase() === 'anonymous') return { valid: false, nickname: n, message: 'This nickname is reserved.' };
  return { valid: true, nickname: n, message: '' };
}
function setNicknameError(message) {
  if (!nicknameError) return;
  if (message) { nicknameError.textContent = message; nicknameError.classList.remove('is-hidden'); }
  else { nicknameError.textContent = ''; nicknameError.classList.add('is-hidden'); }
}
function updateNicknameUI() {
  if (currentNicknameElement) currentNicknameElement.textContent = playerNickname || 'Not set';
  if (startBtn) { startBtn.disabled = !playerNickname; startBtn.style.opacity = playerNickname ? '1' : '0.55'; startBtn.style.cursor = playerNickname ? 'pointer' : 'not-allowed'; }
  updatePregameStats();
}
function onSaveNickname() {
  const r = validateNickname(nicknameInput.value);
  if (!r.valid) { setNicknameError(r.message); return; }
  playerNickname = r.nickname;
  localStorage.setItem(NICKNAME_KEY, playerNickname);
  sessionStorage.setItem(NICKNAME_SESSION_KEY, '1');
  nicknameInput.value = playerNickname;
  setNicknameError(''); updateNicknameUI(); loadLeaderboards();
}
function onChangeNickname() { sessionStorage.removeItem(NICKNAME_SESSION_KEY); nicknameInput.focus(); nicknameInput.select(); }
function ensureNicknameReady() {
  const ok = sessionStorage.getItem(NICKNAME_SESSION_KEY) === '1';
  if (playerNickname && ok) return true;
  const r = validateNickname(nicknameInput.value || playerNickname);
  if (!r.valid) { setNicknameError(r.message); nicknameInput.focus(); return false; }
  playerNickname = r.nickname;
  localStorage.setItem(NICKNAME_KEY, playerNickname);
  sessionStorage.setItem(NICKNAME_SESSION_KEY, '1');
  updateNicknameUI(); return true;
}

// ── Backend ──────────────────────────────────────────────────
function initializeBackend() {
  if (!window.supabase || !window.supabase.createClient) return;
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = SUPABASE_CONFIG;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
function isScoreValid(v) { return Number.isInteger(v) && v >= 0 && v <= MAX_SAFE_SCORE; }
function setSubmitStatus(message, success = true) {
  if (!submitStatus) return;
  submitStatus.textContent = message || '';
  submitStatus.style.opacity = message ? '0.85' : '0';
  submitStatus.style.color = success ? '' : '#fb7185';
}
async function submitScoreIfEligible() {
  if (hasPendingScoreSubmission) return;
  if (!supabaseClient) { setSubmitStatus('Leaderboard offline: Supabase is not configured.', false); return; }
  if (!playerNickname) { setSubmitStatus('Set a nickname to submit scores.', false); return; }
  if (!isScoreValid(score)) { setSubmitStatus('Score rejected: invalid value.', false); return; }
  const now = Date.now();
  if (now - lastSubmitTs < SCORE_SUBMIT_COOLDOWN_MS) { setSubmitStatus('Please wait a moment before submitting another score.', false); return; }
  const payload = { nickname: playerNickname, score, mode: gameMode === 'DAILY' ? 'RANKED' : gameMode, score_date_utc: todayUtc() };
  pendingScorePayload = payload; hasPendingScoreSubmission = true;
  setSubmitStatus('Submitting score…', true);
  retrySubmitBtn.classList.add('is-hidden');
  try {
    const { error } = await supabaseClient.from('scores').insert(payload);
    if (error) throw error;
    lastSubmitTs = Date.now();
    setSubmitStatus('Score submitted to leaderboard.', true);
    await loadLeaderboards();
  } catch (err) {
    setSubmitStatus(`Submit failed: ${err && err.message ? err.message : 'Unable to submit score.'}`, false);
    retrySubmitBtn.classList.remove('is-hidden');
  } finally { hasPendingScoreSubmission = false; }
}
async function retryLastSubmission() {
  if (!pendingScorePayload || !supabaseClient || hasPendingScoreSubmission) return;
  hasPendingScoreSubmission = true;
  setSubmitStatus('Retrying score submit…', true);
  retrySubmitBtn.classList.add('is-hidden');
  try {
    const { error } = await supabaseClient.from('scores').insert(pendingScorePayload);
    if (error) throw error;
    lastSubmitTs = Date.now();
    setSubmitStatus('Score submitted to leaderboard.', true);
    await loadLeaderboards();
  } catch (err) {
    setSubmitStatus(`Submit failed: ${err && err.message ? err.message : 'Retry failed.'}`, false);
    retrySubmitBtn.classList.remove('is-hidden');
  } finally { hasPendingScoreSubmission = false; }
}

function renderLeaderboard(list, entries) {
  list.innerHTML = '';
  if (!entries || entries.length === 0) {
    const e = document.createElement('li'); e.textContent = 'No scores yet.'; e.className = 'leaderboard-empty'; list.appendChild(e); return;
  }
  entries.forEach((entry, i) => {
    const li = document.createElement('li');
    const rank = entry.rank || i + 1, name = entry.nickname || 'Unknown', s = Number.isFinite(entry.score) ? entry.score : 0;
    li.innerHTML = `<span>#${rank} ${name}</span><strong>${s}</strong>`;
    if (playerNickname && name.toLowerCase() === playerNickname.toLowerCase()) li.classList.add('current-player');
    list.appendChild(li);
  });
}
function switchLeaderboardTab(tab) {
  const daily = tab === 'daily';
  dailyTabBtn.classList.toggle('active', daily); alltimeTabBtn.classList.toggle('active', !daily);
  dailyLeaderboardList.classList.toggle('is-hidden', !daily);
  alltimeLeaderboardList.classList.toggle('is-hidden', daily);
}
function updatePregameStats() {
  pregameBestScore.textContent = String(highScore);
  pregameDailyRank.textContent = dailyRankLabel;
  // Show streak
  const streakEl = document.getElementById('pregame-streak');
  if (streakEl) streakEl.textContent = dayStreak > 0 ? `🔥 ${dayStreak} day streak` : '—';
}
async function loadLeaderboards() {
  if (!leaderboardStatus) return;
  if (!supabaseClient) {
    leaderboardStatus.textContent = 'Set Supabase config to enable leaderboards.';
    renderLeaderboard(dailyLeaderboardList, []); renderLeaderboard(alltimeLeaderboardList, []);
    dailyRankLabel = 'Unranked'; updatePregameStats(); return;
  }
  leaderboardStatus.textContent = 'Loading leaderboard…';
  try {
    const [d, a] = await Promise.all([
      supabaseClient.from('daily_leaderboard').select('*').eq('score_date_utc', todayUtc()).order('rank', { ascending: true }).limit(10),
      supabaseClient.from('all_time_leaderboard').select('*').order('rank', { ascending: true }).limit(50)
    ]);
    if (d.error) throw d.error; if (a.error) throw a.error;
    renderLeaderboard(dailyLeaderboardList, d.data || []);
    renderLeaderboard(alltimeLeaderboardList, a.data || []);
    if (playerNickname) {
      const f = (d.data || []).find(x => String(x.nickname || '').toLowerCase() === playerNickname.toLowerCase());
      dailyRankLabel = f ? `#${f.rank}` : 'Unranked';
    } else dailyRankLabel = 'Unranked';
    leaderboardStatus.textContent = 'Leaderboard updated.'; updatePregameStats();
  } catch (err) {
    leaderboardStatus.textContent = navigator.onLine === false ? 'Offline mode: leaderboard unavailable.' : `Leaderboard error: ${err && err.message ? err.message : 'Unable to load leaderboard.'}`;
    renderLeaderboard(dailyLeaderboardList, []); renderLeaderboard(alltimeLeaderboardList, []);
    dailyRankLabel = 'Unranked'; updatePregameStats();
  }
}

// ── Touch controls ───────────────────────────────────────────
function setupTouchControls() {
  const clearSwipe = () => { swipeStart = null; };
  canvasWrapper.addEventListener('pointerdown', e => { if (!e.isPrimary) return; swipeStart = { x: e.clientX, y: e.clientY, pid: e.pointerId }; });
  canvasWrapper.addEventListener('pointerup', e => {
    if (!e.isPrimary || !swipeStart || swipeStart.pid !== e.pointerId || !isPlaying || isPaused) { clearSwipe(); return; }
    const dxp = e.clientX - swipeStart.x, dyp = e.clientY - swipeStart.y; clearSwipe();
    if (Math.abs(dxp) < SWIPE_THRESHOLD && Math.abs(dyp) < SWIPE_THRESHOLD) return;
    if (Math.abs(dxp) >= Math.abs(dyp)) queueDirection(dxp > 0 ? 1 : -1, 0);
    else queueDirection(0, dyp > 0 ? 1 : -1);
  });
  canvasWrapper.addEventListener('pointercancel', clearSwipe);
  canvasWrapper.addEventListener('pointerleave', e => { if (!swipeStart || swipeStart.pid !== e.pointerId) return; clearSwipe(); });
  window.addEventListener('blur', clearSwipe);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearSwipe(); });
  canvasWrapper.addEventListener('touchmove', e => { if (isPlaying) e.preventDefault(); }, { passive: false });
}

// ── Challenge link on load ───────────────────────────────────
function handleChallengeParam() {
  const params = new URLSearchParams(window.location.search);
  const rival = params.get('challenge');
  const challengeScore = params.get('score');
  if (rival && challengeScore) {
    const banner = document.createElement('div');
    banner.className = 'challenge-banner';
    banner.innerHTML = `<span>⚔️ <strong>${rival}</strong> challenges you to beat <strong>${challengeScore}</strong>!</span>`;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);
  }
}

// ── Event listeners ──────────────────────────────────────────
startBtn?.addEventListener('click', () => startGame(true));
restartBtn?.addEventListener('click', () => { if (awaitingContinue && !isFinalized) finalizeGameOver(); startGame(false); });
continueBtn?.addEventListener('click', async () => {
  if (!awaitingContinue || continueBtn.disabled) return;
  continueBtn.disabled = true;
  if (continueStatus) continueStatus.textContent = 'Loading rewarded ad…';
  const ok = await requestRewardedAdWrapper();
  if (!ok) { if (continueStatus) continueStatus.textContent = 'Ad unavailable. Try again.'; continueBtn.disabled = false; return; }
  consumeContinue(); awaitingContinue = false; continuedThisRun = true; isFinalized = false;
  reviveGame();
  if (continueStatus) continueStatus.textContent = 'Continue consumed. Good luck.';
});
pauseBtn?.addEventListener('click', togglePause);
resumeBtn?.addEventListener('click', resumeGame);
mainMenuBtn?.addEventListener('click', () => goToMainMenu(true));
pauseMainMenuBtn?.addEventListener('click', () => goToMainMenu(true));
mainHomeBtn?.addEventListener('click', () => goToMainMenu(true));
customizeBtn?.addEventListener('click', showCustomization);
backToMenuBtn?.addEventListener('click', hideCustomization);
document.addEventListener('keydown', changeDirection);
gameOverScreen?.addEventListener('click', e => { if (e.target === gameOverScreen) { if (awaitingContinue && !isFinalized) finalizeGameOver(); startGame(false); } });
saveNicknameBtn?.addEventListener('click', onSaveNickname);
changeNicknameBtn?.addEventListener('click', onChangeNickname);
nicknameInput?.addEventListener('keydown', e => { if (e.key === 'Enter') onSaveNickname(); });
dailyTabBtn?.addEventListener('click', () => switchLeaderboardTab('daily'));
alltimeTabBtn?.addEventListener('click', () => switchLeaderboardTab('alltime'));
retrySubmitBtn?.addEventListener('click', retryLastSubmission);

modeBtns.forEach(btn => btn.addEventListener('click', () => {
  modeBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  gameMode = btn.dataset.mode;
  const descs = {
    RANKED: 'Traditional Snake. Walls are deadly.',
    ZEN: 'Relaxed mode. Walls wrap around.',
    TIMED: `Score as much as you can in ${timedModeSeconds}s!`,
    DAILY: 'Same board for everyone. One shot per day.'
  };
  if (modeDesc) modeDesc.textContent = descs[gameMode] || '';
}));

skinOptions.forEach(opt => opt.addEventListener('click', () => { skinOptions.forEach(o => o.classList.remove('selected')); opt.classList.add('selected'); currentSkin = opt.dataset.skin; }));
themeOptions.forEach(opt => opt.addEventListener('click', () => { themeOptions.forEach(o => o.classList.remove('selected')); opt.classList.add('selected'); currentTheme = opt.dataset.theme; document.body.setAttribute('data-theme', currentTheme); refreshThemeCache(); renderFrame(); }));
zenObstaclesToggle?.addEventListener('change', e => { zenShowObstacles = e.target.checked; });
diffBtns.forEach(btn => btn.addEventListener('click', () => { diffBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active'); gameDifficulty = btn.dataset.diff; }));

// Sound toggle button
document.getElementById('sound-toggle-btn')?.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('sound-toggle-btn');
  if (btn) btn.textContent = soundEnabled ? '🔊' : '🔇';
});

window.addEventListener('resize', debounce(resizeCanvas, 120));
window.addEventListener('orientationchange', debounce(resizeCanvas, 120));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./service-worker.js').catch(() => {}); });
}

// ── Init ─────────────────────────────────────────────────────
try {
  initializeBackend();
  updateDayStreak();
  playerNickname = normalizeNickname(localStorage.getItem(NICKNAME_KEY) || '');
  if (playerNickname && nicknameInput) nicknameInput.value = playerNickname;
  setNicknameError(''); updateNicknameUI();
  switchLeaderboardTab('daily');
  setupTouchControls();
  loadLeaderboards();
  handleChallengeParam();
  if (startScreen) { startScreen.classList.remove('active'); startScreen.classList.add('hidden'); }
  showSplash({
    title: 'SLITHEROO', subtitle: 'Ranked, Zen, Timed & Daily action.',
    duration: 1300, onComplete: () => {
      if (startScreen) { startScreen.classList.remove('hidden'); startScreen.classList.add('active'); }
      resizeCanvas();
    }
  });
} catch (_e) {
  if (splashScreen) { splashScreen.classList.remove('active'); splashScreen.classList.add('hidden'); }
  if (startScreen) { startScreen.classList.remove('hidden'); startScreen.classList.add('active'); }
}
