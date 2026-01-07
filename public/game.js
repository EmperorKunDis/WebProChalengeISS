const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const currentScoreEl = document.getElementById('current-score');
const modal = document.getElementById('game-over-modal');
const finalScoreEl = document.getElementById('final-score');
const scoreForm = document.getElementById('score-form');
const playerNameInput = document.getElementById('player-name');
const playAgainBtn = document.getElementById('play-again-btn');
const leaderboardList = document.getElementById('leaderboard-list');

const GRID_SIZE = 20;
const CELL_SIZE = canvas.width / GRID_SIZE;
const GITHUB_OWNER = 'EmperorKunDis';
const GITHUB_REPO = 'WebProChalengeISS';

let snake = [];
let food = { x: 0, y: 0 };
let direction = { x: 0, y: -1 }; // Start moving up
let nextDirection = { x: 0, y: -1 };
let score = 0;
let gameRunning = false;
let gameLoop = null;

// Smooth movement
let snakePositions = []; // Actual pixel positions
let moveProgress = 0;
const MOVE_SPEED = 0.15; // How fast snake moves between cells

// Scrolling camera
let cameraY = 0;
const SCROLL_SPEED = 0.3; // How fast screen scrolls up

function init() {
    // Start in middle, facing up
    snake = [
        { x: 10, y: 15 },
        { x: 10, y: 16 },
        { x: 10, y: 17 }
    ];
    // Initialize smooth positions
    snakePositions = snake.map(s => ({ x: s.x * CELL_SIZE, y: s.y * CELL_SIZE }));

    direction = { x: 0, y: -1 };
    nextDirection = { x: 0, y: -1 };
    score = 0;
    cameraY = 0;
    moveProgress = 0;
    updateScore();
    spawnFood();
}

function spawnFood() {
    // Spawn food ahead of the snake (above current camera view)
    const minY = Math.floor(cameraY / CELL_SIZE) - GRID_SIZE;
    const maxY = Math.floor(cameraY / CELL_SIZE) - 2;

    do {
        food.x = Math.floor(Math.random() * GRID_SIZE);
        food.y = minY + Math.floor(Math.random() * (maxY - minY));
    } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function update() {
    // Scroll camera up
    cameraY -= SCROLL_SPEED;

    // Move snake smoothly
    moveProgress += MOVE_SPEED;

    if (moveProgress >= 1) {
        moveProgress = 0;
        direction = { ...nextDirection };

        const head = {
            x: snake[0].x + direction.x,
            y: snake[0].y + direction.y
        };

        // Wall collision (left/right only, top is infinite)
        if (head.x < 0 || head.x >= GRID_SIZE) {
            gameOver();
            return;
        }

        // Self collision
        if (snake.some(s => s.x === head.x && s.y === head.y)) {
            gameOver();
            return;
        }

        // Fell off bottom of screen
        const bottomEdge = (cameraY / CELL_SIZE) + GRID_SIZE + 1;
        if (head.y > bottomEdge) {
            gameOver();
            return;
        }

        snake.unshift(head);
        snakePositions.unshift({ x: head.x * CELL_SIZE, y: head.y * CELL_SIZE });

        if (head.x === food.x && head.y === food.y) {
            score += 10;
            updateScore();
            spawnFood();
        } else {
            snake.pop();
            snakePositions.pop();
        }
    }

    // Interpolate positions for smooth movement
    for (let i = 0; i < snake.length; i++) {
        const targetX = snake[i].x * CELL_SIZE;
        const targetY = snake[i].y * CELL_SIZE;
        snakePositions[i].x += (targetX - snakePositions[i].x) * 0.3;
        snakePositions[i].y += (targetY - snakePositions[i].y) * 0.3;
    }
}

function draw() {
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid (relative to camera)
    ctx.strokeStyle = '#1a1a1a';
    const offsetY = cameraY % CELL_SIZE;

    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= GRID_SIZE + 1; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE + offsetY);
        ctx.lineTo(canvas.width, i * CELL_SIZE + offsetY);
        ctx.stroke();
    }

    // Draw danger zone at bottom
    const dangerHeight = 40;
    const gradient = ctx.createLinearGradient(0, canvas.height - dangerHeight, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.5)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - dangerHeight, canvas.width, dangerHeight);

    // Draw snake (with camera offset)
    snakePositions.forEach((pos, i) => {
        const screenY = pos.y - cameraY;

        // Only draw if on screen
        if (screenY > -CELL_SIZE && screenY < canvas.height + CELL_SIZE) {
            ctx.fillStyle = i === 0 ? '#6ee7b7' : '#4ade80';
            ctx.beginPath();
            ctx.roundRect(pos.x + 1, screenY + 1, CELL_SIZE - 2, CELL_SIZE - 2, 4);
            ctx.fill();
        }
    });

    // Draw food (with camera offset)
    const foodScreenY = food.y * CELL_SIZE - cameraY;
    if (foodScreenY > -CELL_SIZE && foodScreenY < canvas.height + CELL_SIZE) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(
            food.x * CELL_SIZE + CELL_SIZE / 2,
            foodScreenY + CELL_SIZE / 2,
            CELL_SIZE / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

function updateScore() { currentScoreEl.textContent = score; }

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(gameLoop);
    finalScoreEl.textContent = score;
    modal.classList.remove('hidden');
    startBtn.textContent = 'Hrat znovu';
    startBtn.disabled = false;
}

function startGame() {
    if (gameRunning) return;
    init();
    gameRunning = true;
    startBtn.disabled = true;
    modal.classList.add('hidden');

    function tick() {
        if (!gameRunning) return;
        update();
        draw();
        gameLoop = requestAnimationFrame(tick);
    }
    tick();
}

document.addEventListener('keydown', e => {
    if (!gameRunning) {
        if (e.key === ' ' || e.key === 'Enter') startGame();
        return;
    }
    const key = e.key.toLowerCase();
    if ((key === 'arrowup' || key === 'w') && direction.y !== 1) nextDirection = { x: 0, y: -1 };
    if ((key === 'arrowdown' || key === 's') && direction.y !== -1) nextDirection = { x: 0, y: 1 };
    if ((key === 'arrowleft' || key === 'a') && direction.x !== 1) nextDirection = { x: -1, y: 0 };
    if ((key === 'arrowright' || key === 'd') && direction.x !== -1) nextDirection = { x: 1, y: 0 };
});

// === LEADERBOARD ===

async function loadLeaderboard() {
    try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/scores`);
        if (!res.ok) throw new Error();
        const files = await res.json();
        const jsonFiles = files.filter(f => f.name.endsWith('.json'));

        const scores = [];
        for (const file of jsonFiles) {
            try {
                const r = await fetch(file.download_url);
                const data = await r.json();
                scores.push(data);
            } catch {}
        }

        scores.sort((a, b) => b.score - a.score);
        const top10 = scores.slice(0, 10);

        if (top10.length > 0) {
            renderLeaderboard(top10);
        } else {
            leaderboardList.innerHTML = '<p class="loading">Zadne skore zatim</p>';
        }
    } catch {
        leaderboardList.innerHTML = '<p class="loading">Zadne skore zatim</p>';
    }
}

function renderLeaderboard(scores) {
    leaderboardList.innerHTML = scores.map((e, i) => `
        <div class="leaderboard-item">
            <span class="rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">#${i+1}</span>
            <span class="name">${e.name}</span>
            <span class="score">${e.score}</span>
        </div>
    `).join('');
}

async function submitScore(name, playerScore) {
    try {
        await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.substring(0, 20), score: playerScore })
        });
        setTimeout(loadLeaderboard, 2000);
    } catch (err) {
        console.error(err);
    }
}

scoreForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = playerNameInput.value.trim();
    if (name && score > 0) {
        const btn = scoreForm.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Ukladam...';
        await submitScore(name, score);
        btn.disabled = false;
        btn.textContent = 'Ulozit skore';
        modal.classList.add('hidden');
        playerNameInput.value = '';
    }
});

playAgainBtn.addEventListener('click', () => { modal.classList.add('hidden'); startGame(); });
startBtn.addEventListener('click', startGame);

init();
draw();
loadLeaderboard();
