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

// JSONBlob - globalni storage (zadna registrace)
const API_URL = 'https://jsonblob.com/api/jsonBlob/019b97ce-5dcb-7445-866b-5cf99d922efd';

let snake = [];
let food = { x: 0, y: 0 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let gameRunning = false;
let gameLoop = null;
let speed = 150;

function init() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = 150;
    updateScore();
    spawnFood();
}

function spawnFood() {
    let valid = false;
    while (!valid) {
        food.x = Math.floor(Math.random() * GRID_SIZE);
        food.y = Math.floor(Math.random() * GRID_SIZE);
        valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
}

function update() {
    direction = { ...nextDirection };

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        gameOver();
        return;
    }

    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        spawnFood();
        if (speed > 80) {
            speed -= 2;
        }
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
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }

    snake.forEach((segment, index) => {
        const gradient = ctx.createRadialGradient(
            segment.x * CELL_SIZE + CELL_SIZE / 2,
            segment.y * CELL_SIZE + CELL_SIZE / 2,
            0,
            segment.x * CELL_SIZE + CELL_SIZE / 2,
            segment.y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 2
        );

        if (index === 0) {
            gradient.addColorStop(0, '#6ee7b7');
            gradient.addColorStop(1, '#22c55e');
        } else {
            gradient.addColorStop(0, '#4ade80');
            gradient.addColorStop(1, '#16a34a');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(
            segment.x * CELL_SIZE + 1,
            segment.y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2,
            4
        );
        ctx.fill();
    });

    const foodGradient = ctx.createRadialGradient(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        0,
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2
    );
    foodGradient.addColorStop(0, '#fca5a5');
    foodGradient.addColorStop(1, '#ef4444');

    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function updateScore() {
    currentScoreEl.textContent = score;
}

function gameOver() {
    gameRunning = false;
    if (gameLoop) {
        clearTimeout(gameLoop);
        gameLoop = null;
    }
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
        gameLoop = setTimeout(tick, speed);
    }

    tick();
}

function handleKeydown(e) {
    if (!gameRunning) {
        if (e.key === ' ' || e.key === 'Enter') {
            startGame();
        }
        return;
    }

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction.y !== 1) {
                nextDirection = { x: 0, y: -1 };
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction.y !== -1) {
                nextDirection = { x: 0, y: 1 };
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction.x !== 1) {
                nextDirection = { x: -1, y: 0 };
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction.x !== -1) {
                nextDirection = { x: 1, y: 0 };
            }
            break;
    }
}

async function loadLeaderboard() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        const scores = data.scores || [];
        if (scores.length > 0) {
            renderLeaderboard(scores);
        } else {
            leaderboardList.innerHTML = '<p class="loading">Zadne skore zatim</p>';
        }
    } catch (error) {
        console.error('Chyba:', error);
        leaderboardList.innerHTML = '<p class="loading">Nelze nacist zebricek</p>';
    }
}

function renderLeaderboard(scores) {
    leaderboardList.innerHTML = scores.map((entry, index) => {
        let rankClass = '';
        if (index === 0) rankClass = 'gold';
        else if (index === 1) rankClass = 'silver';
        else if (index === 2) rankClass = 'bronze';

        return `
            <div class="leaderboard-item">
                <span class="rank ${rankClass}">#${index + 1}</span>
                <span class="name">${escapeHtml(entry.name)}</span>
                <span class="score">${entry.score}</span>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function submitScore(name, playerScore) {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        const scores = data.scores || [];

        scores.push({ name, score: playerScore });
        scores.sort((a, b) => b.score - a.score);
        const top10 = scores.slice(0, 10);

        await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scores: top10 })
        });

        loadLeaderboard();
    } catch (error) {
        console.error('Chyba pri ukladani:', error);
    }
}

scoreForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = playerNameInput.value.trim();
    if (name && score > 0) {
        const submitBtn = scoreForm.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ukladam...';

        await submitScore(name, score);

        submitBtn.disabled = false;
        submitBtn.textContent = 'Ulozit skore';
        modal.classList.add('hidden');
        playerNameInput.value = '';
    }
});

playAgainBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    startGame();
});

startBtn.addEventListener('click', startGame);
document.addEventListener('keydown', handleKeydown);

init();
draw();
loadLeaderboard();
