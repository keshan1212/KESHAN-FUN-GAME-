
const SIZE = 8;

let grid = [];
let score = 0;
let level = 1;
let best = Number(localStorage.getItem("keshanBest")) || 0;
let currentPieces = [];
let soundOn = true;
let audioContext = null;
let drag = null;

const board = document.getElementById("board");
const pieces = document.getElementById("pieces");

const shapes = [
  [[0,0]],
  [[0,0],[0,1]],
  [[0,0],[1,0]],
  [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[1,0],[1,1]],
  [[0,0],[0,1],[1,1]],
  [[0,0],[1,0],[2,0],[2,1]],
  [[0,0],[0,1],[1,1],[1,2]],
  [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],
  [[0,0],[1,0],[2,0],[1,1]],
  [[0,0],[0,1],[0,2],[1,2]],
  [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[0,2],[0,3]],
  [[0,0],[1,0],[1,1],[2,1]]
];

function init() {
  grid = Array.from(
    {length: SIZE},
    () => Array(SIZE).fill(0)
  );

  board.innerHTML = "";

  for(let r = 0; r < SIZE; r++) {
    for(let c = 0; c < SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.r = r;
      cell.dataset.c = c;
      board.appendChild(cell);
    }
  }

  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag);

  document.getElementById("best").textContent = best;

  restartGame();
}

function randomShape() {
  const shape = shapes[
    Math.floor(Math.random() * shapes.length)
  ];

  return shape.map(p => [...p]);
}

function makePieces() {
  currentPieces = [
    randomShape(),
    randomShape(),
    randomShape()
  ];

  renderPieces();
  checkGameOver();
}

function renderPieces() {
  pieces.innerHTML = "";

  currentPieces.forEach((shape, index) => {
    const slot = document.createElement("div");
    slot.className = "piece-slot";

    if(shape) {
      const maxR = Math.max(...shape.map(p => p[0])) + 1;
      const maxC = Math.max(...shape.map(p => p[1])) + 1;

      const piece = document.createElement("div");
      piece.className = "piece";
      piece.style.gridTemplateColumns =
        `repeat(${maxC}, 20px)`;

      for(let r = 0; r < maxR; r++) {
        for(let c = 0; c < maxC; c++) {
          const el = document.createElement("div");
          el.className = "piece-cell";

          if(!shape.some(p => p[0] === r && p[1] === c)) {
            el.classList.add("empty");
          }

          piece.appendChild(el);
        }
      }

      slot.appendChild(piece);

      slot.addEventListener("pointerdown", e => {
        startDrag(e, index);
      });
    }

    pieces.appendChild(slot);
  });
}

function renderBoard() {
  const cells = board.children;

  for(let r = 0; r < SIZE; r++) {
    for(let c = 0; c < SIZE; c++) {
      const cell = cells[r * SIZE + c];

      cell.className = "cell";

      if(grid[r][c]) {
        cell.classList.add("filled");
      }
    }
  }
}

function startDrag(e, index) {
  if(!currentPieces[index] || drag) return;

  e.preventDefault();

  const piece = currentPieces[index];

  drag = {
    index,
    shape: piece,
    valid: false,
    top: -1,
    left: -1
  };

  const visual = e.currentTarget.querySelector(".piece");

  if(visual) visual.classList.add("dragging");

  previewDrag(e.clientX, e.clientY);
}

function moveDrag(e) {
  if(!drag) return;

  previewDrag(e.clientX, e.clientY);
}

function previewDrag(x, y) {
  renderBoard();

  const rect = board.getBoundingClientRect();

  const col = Math.floor(
    (x - rect.left) / (rect.width / SIZE)
  );

  const row = Math.floor(
    (y - rect.top) / (rect.height / SIZE)
  );

  drag.top = row;
  drag.left = col;

  const inside =
    x >= rect.left &&
    x <= rect.right &&
    y >= rect.top &&
    y <= rect.bottom;

  drag.valid = inside &&
    canPlace(drag.shape, row, col);

  drag.shape.forEach(([r,c]) => {
    const rr = row + r;
    const cc = col + c;

    if(rr >= 0 && rr < SIZE &&
       cc >= 0 && cc < SIZE) {

      const cell = board.children[rr * SIZE + cc];

      cell.className = "cell " +
        (drag.valid ? "preview" : "invalid");
    }
  });
}

function canPlace(shape, top, left) {
  return shape.every(([r,c]) => {
    const rr = top + r;
    const cc = left + c;

    return rr >= 0 &&
      rr < SIZE &&
      cc >= 0 &&
      cc < SIZE &&
      grid[rr][cc] === 0;
  });
}

function endDrag(e) {
  if(!drag) return;

  const current = drag;

  const rect = board.getBoundingClientRect();

  const inside =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  if(inside &&
     canPlace(current.shape, current.top, current.left)) {

    current.shape.forEach(([r,c]) => {
      grid[current.top + r][current.left + c] = 1;
      score += 10;
    });

    currentPieces[current.index] = null;

    playSound(500);

    clearLines();
    updateStats();
    renderBoard();

    document.getElementById("message").textContent =
      "🔥 NICE MOVE! KEEP PLAYING!";

    if(currentPieces.every(p => p === null)) {
      makePieces();
    } else {
      renderPieces();
      checkGameOver();
    }

  } else {
    document.getElementById("message").textContent =
      "❌ Try another position!";
  }

  drag = null;
  renderBoard();
}

function clearLines() {
  let rows = [];
  let cols = [];

  for(let r = 0; r < SIZE; r++) {
    if(grid[r].every(v => v === 1)) {
      rows.push(r);
    }
  }

  for(let c = 0; c < SIZE; c++) {
    if(grid.every(row => row[c] === 1)) {
      cols.push(c);
    }
  }

  rows.forEach(r => {
    grid[r] = Array(SIZE).fill(0);
  });

  cols.forEach(c => {
    for(let r = 0; r < SIZE; r++) {
      grid[r][c] = 0;
    }
  });

  const cleared = rows.length + cols.length;

  if(cleared > 0) {
    score += cleared * 100;
    playSound(800);

    document.getElementById("message").textContent =
      "⚡ " + cleared + " LINES CLEARED!";
  }
}

function updateStats() {
  level = Math.floor(score / 500) + 1;

  if(score > best) {
    best = score;
    localStorage.setItem("keshanBest", best);
  }

  document.getElementById("score").textContent = score;
  document.getElementById("best").textContent = best;
  document.getElementById("level").textContent = level;
}

function checkGameOver() {
  const available = currentPieces.filter(Boolean);

  if(available.length === 0) return;

  const canContinue = available.some(shape => {
    for(let r = 0; r < SIZE; r++) {
      for(let c = 0; c < SIZE; c++) {
        if(canPlace(shape, r, c)) {
          return true;
        }
      }
    }

    return false;
  });

  if(!canContinue) {
    document.getElementById("finalScore").textContent = score;
    document.getElementById("gameOver").style.display = "flex";
    playSound(150);
  }
}

function restartGame() {
  score = 0;
  level = 1;
  drag = null;

  document.getElementById("gameOver").style.display = "none";
  document.getElementById("message").textContent =
    "Drag blocks onto the board to play!";

  grid = Array.from(
    {length: SIZE},
    () => Array(SIZE).fill(0)
  );

  updateStats();
  renderBoard();
  makePieces();
}

function playSound(frequency) {
  if(!soundOn) return;

  try {
    audioContext ??= new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

    if(audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(
      0.08,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.15
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);

  } catch(error) {
    console.log("Sound unavailable");
  }
}

function toggleSound() {
  soundOn = !soundOn;

  document.getElementById("soundBtn").textContent =
    soundOn ? "🔊 SOUND ON" : "🔇 SOUND OFF";

  if(soundOn) playSound(600);
}

init();
