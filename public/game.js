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
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let gameRunning = false;
let gameLoop = null;
let speed = 150;

function init() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = 150;
    updateScore();
    spawnFood();
}

function spawnFood() {
    do {
        food.x = Math.floor(Math.random() * GRID_SIZE);
        food.y = Math.floor(Math.random() * GRID_SIZE);
    } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function update() {
    direction = { ...nextDirection };
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE ||
        snake.some(s => s.x === head.x && s.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        spawnFood();
        if (speed > 80) speed -= 2;
    } else {
        snake.pop();
    }
}

function draw() {
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1a1a1a';
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }

    snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#6ee7b7' : '#4ade80';
        ctx.fillRect(seg.x * CELL_SIZE + 1, seg.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    });

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(food.x * CELL_SIZE + CELL_SIZE/2, food.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE/2 - 2, 0, Math.PI * 2);
    ctx.fill();
}

function updateScore() { currentScoreEl.textContent = score; }

function gameOver() {
    gameRunning = false;
    clearTimeout(gameLoop);
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
    (function tick() {
        if (!gameRunning) return;
        update();
        draw();
        gameLoop = setTimeout(tick, speed);
    })();
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
