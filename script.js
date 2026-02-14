const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const highScoreElement = document.getElementById('high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const customizeScreen = document.getElementById('customize-screen');
const gameOverTitle = document.querySelector('#game-over-screen .danger-text');
const finalScoreElement = document.getElementById('final-score'); // Keeping for compatibility if needed elsewhere, but updating new items
const summaryScore = document.getElementById('summary-score');
const summaryLevel = document.getElementById('summary-level');
const summaryLength = document.getElementById('summary-length');
const summaryOccupancy = document.getElementById('summary-occupancy');
const summaryMode = document.getElementById('summary-mode');
const summaryBestOccupancy = document.getElementById('summary-best-occupancy');

const pauseScreen = document.getElementById('pause-screen');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const pauseMainMenuBtn = document.getElementById('pause-main-menu-btn');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
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

// Game Constants
const TILE_SIZE = 20;
let TILE_COUNT = canvas.width / TILE_SIZE;
const GAME_SPEED_START = 100;
const SPEED_DECREMENT = 2;

// Game State
let score = 0;
let level = 1;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let snake = [];
let food = { x: 0, y: 0 };
let obstacles = [];
let dx = 0;
let dy = 0;
let gameMode = 'RANKED'; // 'RANKED' or 'ZEN'
let bestOccupancy = localStorage.getItem('snakeBestOccupancy') || 0;
let currentSkin = 'neon';
let currentTheme = 'default';
let currentSpeed = GAME_SPEED_START;
let gameDifficulty = 'NORMAL'; // 'NORMAL', 'HARD'
let isPlaying = false;
let isPaused = false;
let lastObstacleMoveTime = 0;
const OBSTACLE_MOVE_INTERVAL = 600; // ms
let zenShowObstacles = false;
let arenaExpanded = false;
const MAX_ARENA_SIZE = 600;
const DEFAULT_GAME_OVER_TITLE = 'GAME OVER';

// Initialize High Score Display
highScoreElement.textContent = highScore;

// Event Listeners
document.addEventListener('keydown', changeDirection);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', resumeGame);
mainMenuBtn.addEventListener('click', goToMainMenu);
pauseMainMenuBtn.addEventListener('click', goToMainMenu);
mainHomeBtn.addEventListener('click', goToMainMenu);
customizeBtn.addEventListener('click', showCustomization);
backToMenuBtn.addEventListener('click', hideCustomization);

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameMode = btn.dataset.mode;

        if (gameMode === 'RANKED') {
            modeDesc.textContent = "Traditional Snake. Walls are deadly.";
        } else {
            modeDesc.textContent = "Relaxed mode. Walls wrap around.";
        }
    });
});

skinOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        skinOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        currentSkin = opt.dataset.skin;
    });
});

themeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        themeOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        currentTheme = opt.dataset.theme;
        document.body.setAttribute('data-theme', currentTheme);
    });
});

zenObstaclesToggle.addEventListener('change', (e) => {
    zenShowObstacles = e.target.checked;
});

diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameDifficulty = btn.dataset.diff;
    });
});

function showCustomization() {
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    customizeScreen.classList.remove('hidden');
    customizeScreen.classList.add('active');
}

function hideCustomization() {
    customizeScreen.classList.remove('active');
    customizeScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    startScreen.classList.add('active');
}

function startGame() {
    resetGameOverTitle();
    resetGame();
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.remove('active');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.remove('active');
    pauseScreen.classList.add('hidden');
    isPlaying = true;
    isPaused = false;
    gameLoop();
}

function togglePause() {
    if (!isPlaying) return;
    isPaused = !isPaused;

    if (isPaused) {
        populateSummary('pause');
        pauseScreen.classList.remove('hidden');
        pauseScreen.classList.add('active');
    } else {
        resumeGame();
    }
}

function resumeGame() {
    isPaused = false;
    pauseScreen.classList.remove('active');
    pauseScreen.classList.add('hidden');
    gameLoop(); // Restart the loop after unpausing
}

function resetGame() {
    score = 0;
    level = 1;
    currentSpeed = GAME_SPEED_START;
    obstacles = [];
    lastObstacleMoveTime = 0;

    // Reset arena before food generation so spawn uses the current board size.
    canvas.width = 400;
    canvas.height = 400;
    TILE_COUNT = canvas.width / TILE_SIZE;
    arenaExpanded = false;

    scoreElement.textContent = score;
    levelElement.textContent = level;
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    dx = 1;
    dy = 0;
    generateFood();
    isPaused = false;
}

function gameLoop() {
    if (!isPlaying || isPaused) return;

    setTimeout(gameLoop, currentSpeed);

    if (didGameEnd()) {
        endGame();
        return;
    }

    clearCanvas();
    moveSnake();
    drawFood();
    if (gameMode === 'RANKED' || (gameMode === 'ZEN' && zenShowObstacles)) {
        drawObstacles();
        const now = Date.now();
        if (level >= 10 && now - lastObstacleMoveTime > OBSTACLE_MOVE_INTERVAL) {
            moveObstacles();
            lastObstacleMoveTime = now;
        }
    }
    drawSnake();
    checkArenaExpansion();
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function moveSnake() {
    let headX = snake[0].x + dx;
    let headY = snake[0].y + dy;

    if (gameMode === 'ZEN') {
        if (headX < 0) headX = TILE_COUNT - 1;
        if (headX >= TILE_COUNT) headX = 0;
        if (headY < 0) headY = TILE_COUNT - 1;
        if (headY >= TILE_COUNT) headY = 0;
    }

    const head = { x: headX, y: headY };
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        checkLevelUp();
        generateFood();
    } else {
        snake.pop();
    }
}

function moveObstacles() {
    obstacles.forEach(obs => {
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const [mx, my] = dirs[Math.floor(Math.random() * dirs.length)];
        const nextX = (obs.x + mx + TILE_COUNT) % TILE_COUNT;
        const nextY = (obs.y + my + TILE_COUNT) % TILE_COUNT;

        const occupied = snake.some(p => p.x === nextX && p.y === nextY) ||
            (food.x === nextX && food.y === nextY) ||
            obstacles.some(o => o !== obs && o.x === nextX && o.y === nextY);

        if (!occupied) {
            obs.x = nextX;
            obs.y = nextY;
        }
    });
}

function generateFood() {
    const isFoodPositionValid = (x, y) => {
        const isCollision = (obj) => obj.x === x && obj.y === y;
        let adjacentObstacles = 0;
        const neighbors = [
            { x: x + 1, y: y },
            { x: x - 1, y: y },
            { x: x, y: y + 1 },
            { x: x, y: y - 1 }
        ];

        neighbors.forEach(n => {
            // Treat walls in RANKED as obstacles
            if (gameMode === 'RANKED') {
                if (n.x < 0 || n.x >= TILE_COUNT || n.y < 0 || n.y >= TILE_COUNT) {
                    adjacentObstacles++;
                    return;
                }
            }
            // Check for actual obstacles
            if (obstacles.some(obs => obs.x === n.x && obs.y === n.y)) {
                adjacentObstacles++;
            }
        });

        const isTrapped = adjacentObstacles >= 3;
        return !(
            snake.some(isCollision) ||
            ((gameMode === 'RANKED' || (gameMode === 'ZEN' && zenShowObstacles)) && obstacles.some(isCollision)) ||
            isTrapped
        );
    };

    const maxAttempts = TILE_COUNT * TILE_COUNT * 2;

    for (let attempts = 0; attempts < maxAttempts; attempts++) {
        const candidateX = Math.floor(Math.random() * TILE_COUNT);
        const candidateY = Math.floor(Math.random() * TILE_COUNT);
        if (isFoodPositionValid(candidateX, candidateY)) {
            food.x = candidateX;
            food.y = candidateY;
            return true;
        }
    }

    // Deterministic fallback if random attempts fail in dense boards.
    for (let y = 0; y < TILE_COUNT; y++) {
        for (let x = 0; x < TILE_COUNT; x++) {
            if (isFoodPositionValid(x, y)) {
                food.x = x;
                food.y = y;
                return true;
            }
        }
    }

    // No valid tile remains: end as a win state instead of hanging.
    if (isPlaying) victory();
    return false;
}

function checkLevelUp() {
    let threshold = 50;
    if (gameDifficulty === 'HARD') threshold = 100;

    const newLevel = Math.floor(score / threshold) + 1;
    if (newLevel > level) {
        level = newLevel;
        levelElement.textContent = level;

        // Linear speed increase
        currentSpeed = Math.max(30, GAME_SPEED_START - ((level - 1) * SPEED_DECREMENT));

        // Level Up Notification
        showLevelNotice(`LEVEL ${level}`);

        // Dynamic Theme/Color progression
        updateLevelTheme();

        if (gameMode === 'RANKED' || (gameMode === 'ZEN' && zenShowObstacles)) generateObstacles();
    }
}

function updateLevelTheme() {
    const themes = ['default', 'cyberpunk', 'classic', 'sunset'];
    const themeIndex = (level - 1) % themes.length;
    currentTheme = themes[themeIndex];
    document.body.setAttribute('data-theme', currentTheme);

    // Also shift hue slightly within each theme for extra variety
    const hueRotate = (level - 1) * 15; // 15 degrees per level
    document.documentElement.style.setProperty('--level-hue', `${hueRotate}deg`);
    document.body.setAttribute('data-level', level);
}

function showLevelNotice(text) {
    const notice = document.createElement('div');
    notice.className = 'level-notice';
    notice.textContent = text;
    document.querySelector('.canvas-wrapper').appendChild(notice);

    setTimeout(() => notice.classList.add('fade-out'), 800);
    setTimeout(() => notice.remove(), 1200);
}

function generateObstacles() {
    const head = snake[0];
    const isTooCloseToHead = (x, y) => Math.abs(x - head.x) < 3 && Math.abs(y - head.y) < 3;
    let safeFreeCells = 0;

    for (let y = 0; y < TILE_COUNT; y++) {
        for (let x = 0; x < TILE_COUNT; x++) {
            const occupied = snake.some(p => p.x === x && p.y === y) ||
                (food.x === x && food.y === y) ||
                obstacles.some(o => o.x === x && o.y === y);

            if (!occupied && !isTooCloseToHead(x, y)) {
                safeFreeCells++;
            }
        }
    }

    const desiredObstacleCount = Math.min(level - 1, obstacles.length + safeFreeCells);
    const maxAttempts = TILE_COUNT * TILE_COUNT * 3;
    let attempts = 0;

    while (obstacles.length < desiredObstacleCount && attempts < maxAttempts) {
        attempts++;
        const obstacle = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT)
        };

        const occupied = snake.some(p => p.x === obstacle.x && p.y === obstacle.y) ||
            (food.x === obstacle.x && food.y === obstacle.y) ||
            obstacles.some(o => o.x === obstacle.x && o.y === obstacle.y);

        if (!isTooCloseToHead(obstacle.x, obstacle.y) && !occupied) {
            obstacles.push(obstacle);
        }
    }
}

function drawObstacles() {
    ctx.fillStyle = '#ff3366';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff3366';
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x * TILE_SIZE, obs.y * TILE_SIZE, TILE_SIZE - 2, TILE_SIZE - 2);
    });
    ctx.shadowBlur = 0;
}

function drawSnake() {
    snake.forEach((part, index) => {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--snake-color').trim() || '#00ff88';
        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.fillStyle;

        if (index === 0) {
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--snake-head').trim() || '#ccffdd';
        }

        // Apply Skins
        if (currentSkin === 'striped' && index % 2 === 0 && index !== 0) {
            ctx.globalAlpha = 0.7;
        } else if (currentSkin === 'glow') {
            ctx.shadowBlur = 25;
        } else if (currentSkin === 'gradient') {
            ctx.globalAlpha = 1 - (index / snake.length) * 0.5;
        }

        ctx.fillRect(part.x * TILE_SIZE, part.y * TILE_SIZE, TILE_SIZE - 2, TILE_SIZE - 2);
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    });
}

function drawFood() {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--food-color').trim() || '#ff0055';
    ctx.shadowBlur = 15;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(food.x * TILE_SIZE + TILE_SIZE / 2, food.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2 - 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function changeDirection(event) {
    // Handle Pause Toggle (P or Escape)
    if (event.keyCode === 80 || event.keyCode === 27) {
        togglePause();
        return;
    }

    const keys = { 37: [-1, 0], 39: [1, 0], 38: [0, -1], 40: [0, 1], 65: [-1, 0], 68: [1, 0], 87: [0, -1], 83: [0, 1] };
    if (!keys[event.keyCode]) return;
    const [newDx, newDy] = keys[event.keyCode];
    if (newDx === -dx && newDy === -dy) return;
    dx = newDx; dy = newDy;
}

function didGameEnd() {
    const head = snake[0];
    if (gameMode === 'RANKED' || (gameMode === 'ZEN' && zenShowObstacles)) {
        if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
            if (gameMode === 'RANKED') return true;
        }
        if (obstacles.some(obs => obs.x === head.x && obs.y === head.y)) return true;
    }
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) return true;
    }
    return false;
}

function endGame() {
    isPlaying = false;

    const gameData = {
        score: score,
        level: level,
        mode: gameMode,
        skin: currentSkin,
        theme: currentTheme,
        timestamp: new Date().toISOString()
    };
    console.log("Game Session Data:", gameData);
    // This object is ready for future leaderboard/API integration

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }

    populateSummary('summary');

    if (finalScoreElement) finalScoreElement.textContent = score; // Fallback

    gameOverScreen.classList.remove('hidden');
    gameOverScreen.classList.add('active');
}

function populateSummary(prefix) {
    const totalTiles = TILE_COUNT * TILE_COUNT;
    const occupancyVal = (snake.length / totalTiles) * 100;
    const occupancyText = occupancyVal.toFixed(1) + '%';

    if (occupancyVal > bestOccupancy) {
        bestOccupancy = occupancyVal;
        localStorage.setItem('snakeBestOccupancy', bestOccupancy);
    }
    const bestOccupancyText = parseFloat(bestOccupancy).toFixed(1) + '%';

    const scoreElem = document.getElementById(`${prefix}-score`);
    const levelElem = document.getElementById(`${prefix}-level`);
    const lengthElem = document.getElementById(`${prefix}-length`);
    const occupancyElem = document.getElementById(`${prefix}-occupancy`);
    const modeElem = document.getElementById(`${prefix}-mode`);
    const bestElem = document.getElementById(`${prefix}-best-occupancy`);

    if (scoreElem) scoreElem.textContent = score;
    if (levelElem) levelElem.textContent = level;
    if (lengthElem) lengthElem.textContent = snake.length;
    if (occupancyElem) occupancyElem.textContent = occupancyText;
    if (modeElem) modeElem.textContent = gameMode;
    if (bestElem) bestElem.textContent = bestOccupancyText;
}

function goToMainMenu() {
    gameOverScreen.classList.remove('active');
    gameOverScreen.classList.add('hidden');
    customizeScreen.classList.remove('active');
    customizeScreen.classList.add('hidden');
    pauseScreen.classList.remove('active');
    pauseScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    startScreen.classList.add('active');
    isPlaying = false;
    isPaused = false;
    resetGame(); // Prepare for next session
}

function checkArenaExpansion() {
    const totalTiles = TILE_COUNT * TILE_COUNT;
    const occupancy = snake.length / totalTiles;

    if (!arenaExpanded && occupancy > 0.8) {
        expandArena();
    } else if (arenaExpanded && occupancy > 0.95) {
        victory();
    }
}

function expandArena() {
    arenaExpanded = true;
    canvas.width = MAX_ARENA_SIZE;
    canvas.height = MAX_ARENA_SIZE;
    TILE_COUNT = canvas.width / TILE_SIZE;
    showLevelNotice("ARENA EXPANDED!");
}

function victory() {
    isPlaying = false;
    showLevelNotice("ULTIMATE VICTORY!");
    setTimeout(() => {
        endGame();
        if (gameOverTitle) {
            gameOverTitle.textContent = "YOU WON!";
            gameOverTitle.style.color = "var(--snake-color)";
        }
    }, 2000);
}

function resetGameOverTitle() {
    if (!gameOverTitle) return;
    gameOverTitle.textContent = DEFAULT_GAME_OVER_TITLE;
    gameOverTitle.style.color = '';
}
