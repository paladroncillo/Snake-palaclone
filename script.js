const GRID = 18;
const CELL = 20;
const START_SPEED = 150;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const speedEl = document.getElementById('speed');
const restartBtn = document.getElementById('restart');
const pauseBtn = document.getElementById('pause');

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const overlayBtn = document.getElementById('overlayBtn');

let snake;
let dir;
let nextDir;
let food;
let score;
let best;
let paused;
let gameOver;
let tickMs;
let loopId;

function rand(max) {
  return Math.floor(Math.random() * max);
}

function getBest() {
  return Number(localStorage.getItem('snake_best') || 0);
}

function setBest(value) {
  localStorage.setItem('snake_best', String(value));
}

function makeFood() {
  while (true) {
    const candidate = { x: rand(GRID), y: rand(GRID) };
    if (!snake.some((s) => s.x === candidate.x && s.y === candidate.y)) return candidate;
  }
}

function reset() {
  snake = [
    { x: 8, y: 9 },
    { x: 7, y: 9 },
    { x: 6, y: 9 }
  ];
  dir = { x: 1, y: 0 };
  nextDir = { ...dir };
  score = 0;
  tickMs = START_SPEED;
  paused = false;
  gameOver = false;
  food = makeFood();
  best = getBest();
  hideOverlay();
  renderStats();
  draw();
  startLoop();
}

function renderStats() {
  scoreEl.textContent = score;
  bestEl.textContent = best;
  speedEl.textContent = `${Math.round((START_SPEED / tickMs) * 10) / 10}x`;
}

function drawCell(x, y, fill, stroke = 'rgba(255,255,255,.1)') {
  ctx.fillStyle = fill;
  ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
  ctx.strokeStyle = stroke;
  ctx.strokeRect(x * CELL + .5, y * CELL + .5, CELL - 1, CELL - 1);
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(255,255,255,.04)';
  for (let i = 1; i < GRID; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL + .5, 0);
    ctx.lineTo(i * CELL + .5, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * CELL + .5);
    ctx.lineTo(canvas.width, i * CELL + .5);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawCell(food.x, food.y, '#ff5969', 'rgba(255,255,255,.2)');

  snake.forEach((part, i) => {
    drawCell(part.x, part.y, i === 0 ? '#6bff8c' : '#2ec458');
  });

  drawGrid();
}

function step() {
  if (paused || gameOver) return;

  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID) {
    endGame('💥 Game Over', 'Chocaste con la pared');
    return;
  }

  if (snake.some((part) => part.x === head.x && part.y === head.y)) {
    endGame('💀 Game Over', 'Te mordiste a ti mismo');
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    if (score > best) {
      best = score;
      setBest(best);
    }
    tickMs = Math.max(70, tickMs - 3);
    food = makeFood();
    renderStats();
  } else {
    snake.pop();
  }

  draw();
}

function startLoop() {
  clearInterval(loopId);
  loopId = setInterval(step, tickMs);
}

function endGame(title, text) {
  gameOver = true;
  clearInterval(loopId);
  showOverlay(title, `${text}. Puntaje: ${score}`);
  overlayBtn.textContent = 'Jugar otra vez';
}

function showOverlay(title, text) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
  overlayBtn.textContent = 'Continuar';
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (paused) {
    clearInterval(loopId);
    showOverlay('⏸ Pausa', 'Pulsa continuar para seguir');
    pauseBtn.textContent = 'Continuar';
  } else {
    hideOverlay();
    startLoop();
    pauseBtn.textContent = 'Pausar';
  }
}

function setDirection(x, y) {
  if (x !== 0 && dir.x !== 0) return;
  if (y !== 0 && dir.y !== 0) return;
  nextDir = { x, y };
}

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (key === 'p') {
    togglePause();
    return;
  }
  if (key === 'r') {
    reset();
    return;
  }

  const map = {
    arrowup: [0, -1],
    w: [0, -1],
    arrowdown: [0, 1],
    s: [0, 1],
    arrowleft: [-1, 0],
    a: [-1, 0],
    arrowright: [1, 0],
    d: [1, 0]
  };

  if (map[key]) {
    e.preventDefault();
    const [x, y] = map[key];
    setDirection(x, y);
  }
});

restartBtn.addEventListener('click', reset);
pauseBtn.addEventListener('click', togglePause);
overlayBtn.addEventListener('click', () => {
  if (gameOver) reset();
  else togglePause();
});

document.querySelectorAll('.touch button').forEach((btn) => {
  const action = btn.dataset.action;
  const run = (ev) => {
    ev.preventDefault();
    if (action === 'up') setDirection(0, -1);
    if (action === 'down') setDirection(0, 1);
    if (action === 'left') setDirection(-1, 0);
    if (action === 'right') setDirection(1, 0);
    if (action === 'pause') togglePause();
  };

  btn.addEventListener('touchstart', run, { passive: false });
  btn.addEventListener('click', run);
});

reset();
