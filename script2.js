const puzzleImages = [
  'img/kai.jpg',
  'img/kai2.jpg',
  'img/kai3.jpg',
];
const size = 3;
let completedPuzzles = JSON.parse(localStorage.getItem('completedPuzzles')) || [false, false, false];
let currentPuzzleIndex = null;

const puzzleSelect = document.getElementById('puzzleSelect');
const puzzleContainer = document.getElementById('puzzleContainer');
const canvas = document.getElementById('puzzleCanvas');
const ctx = canvas.getContext('2d');
const nextBtn = document.getElementById('nextBtn');
const completedImage = document.getElementById('completedImage');

let pieces = [];
let dragPiece = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let pieceWidth, pieceHeight;
let originalPieceWidth, originalPieceHeight;
let image = new Image();
let puzzleCompleted = false;
let isDragging = false;

function renderPuzzleCards() {
  puzzleSelect.innerHTML = '';
  for (let i = 0; i < puzzleImages.length; i++) {
    const card = document.createElement('div');
    card.className = 'puzzle-card';
    if (i > 0 && !completedPuzzles[i - 1]) {
      card.classList.add('locked');
    }

    const img = document.createElement('img');
    img.src = puzzleImages[i];

    const btn = document.createElement('button');
    btn.className = 'puzzle-button';
    btn.textContent = completedPuzzles[i] ? `Monte sua imagem ✓` : `Monte sua imagem`;
    btn.disabled = (i > 0 && !completedPuzzles[i - 1]);
    btn.dataset.index = i;

    card.appendChild(img);
    card.appendChild(btn);

    puzzleSelect.appendChild(card);

    if (!btn.disabled) {
      btn.addEventListener('click', () => openPuzzle(i));
    }
  }
}

function openPuzzle(index) {
  currentPuzzleIndex = index;
  puzzleCompleted = false;
  completedImage.style.display = 'none';
  canvas.style.display = 'block';
  resetCanvas();
  puzzleSelect.style.pointerEvents = 'none';
  puzzleContainer.classList.add('show');
  nextBtn.style.display = 'none';

  puzzleContainer.style.opacity = 0;
  puzzleContainer.style.transform = 'scale(0.8)';

  setTimeout(() => {
    image = new Image();
    image.src = puzzleImages[index];
    image.onload = () => {
      const maxWidth = 600;
      const maxHeight = 400;
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);

      canvas.width = image.width * scale;
      canvas.height = image.height * scale;

      pieceWidth = canvas.width / size;
      pieceHeight = canvas.height / size;

      originalPieceWidth = image.width / size;
      originalPieceHeight = image.height / size;

      createPuzzle();
      drawPuzzle();

      puzzleContainer.style.opacity = 1;
      puzzleContainer.style.transform = 'scale(1)';
      puzzleSelect.style.pointerEvents = 'auto';
    };
  }, 200);
}

function resetCanvas() {
  dragPiece = null;
  pieces = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function createPuzzle() {
  pieces = [];
  let positions = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      positions.push({ x, y });
    }
  }
  positions.sort(() => Math.random() - 0.5);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let pos = positions.pop();
      pieces.push({
        correctX: x,
        correctY: y,
        x: pos.x,
        y: pos.y
      });
    }
  }
}

function drawPuzzle(dragging = false) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let piece of pieces) {
    if (piece !== dragPiece) {
      ctx.drawImage(
        image,
        piece.correctX * originalPieceWidth, piece.correctY * originalPieceHeight,
        originalPieceWidth, originalPieceHeight,
        piece.x * pieceWidth, piece.y * pieceHeight,
        pieceWidth, pieceHeight
      );
    }
  }

  if (dragPiece && dragging) {
    ctx.globalAlpha = 0.7;
    ctx.drawImage(
      image,
      dragPiece.correctX * originalPieceWidth, dragPiece.correctY * originalPieceHeight,
      originalPieceWidth, originalPieceHeight,
      dragPiece.drawX, dragPiece.drawY,
      pieceWidth, pieceHeight
    );
    ctx.globalAlpha = 1.0;
  }
}

function getPieceAt(x, y) {
  return pieces.find(p => {
    return x >= p.x * pieceWidth &&
      x < (p.x + 1) * pieceWidth &&
      y >= p.y * pieceHeight &&
      y < (p.y + 1) * pieceHeight;
  });
}

function checkWin() {
  if (pieces.every(p => p.x === p.correctX && p.y === p.correctY)) {
    puzzleCompleted = true;
    showCompletedImage();
    completedPuzzles[currentPuzzleIndex] = true;
    localStorage.setItem('completedPuzzles', JSON.stringify(completedPuzzles));
    updateButtons();

    if (completedPuzzles.every(v => v)) {
      nextBtn.style.display = 'inline-block';
    }
  }
}

function showCompletedImage() {
  canvas.style.display = 'none';
  completedImage.src = puzzleImages[currentPuzzleIndex];
  completedImage.style.display = 'block';
  completedImage.width = canvas.width;
  completedImage.height = canvas.height;
}

function updateButtons() {
  renderPuzzleCards();
}

function getEventPosition(e) {
  const rect = canvas.getBoundingClientRect();
  let x, y;
  if (e.touches && e.touches.length > 0) {
    x = e.touches[0].clientX - rect.left;
    y = e.touches[0].clientY - rect.top;
  } else {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  }
  return { x, y };
}

function startDrag(e) {
  if (puzzleCompleted) return;

  const { x: mouseX, y: mouseY } = getEventPosition(e);

  const piece = getPieceAt(mouseX, mouseY);
  if (piece) {
    dragPiece = piece;
    dragOffsetX = mouseX - piece.x * pieceWidth;
    dragOffsetY = mouseY - piece.y * pieceHeight;
    dragPiece.drawX = mouseX - dragOffsetX;
    dragPiece.drawY = mouseY - dragOffsetY;
    isDragging = true;
    canvas.style.cursor = 'grabbing';
  }
}

function moveDrag(e) {
  if (!isDragging || !dragPiece) return;

  const { x: mouseX, y: mouseY } = getEventPosition(e);
  dragPiece.drawX = mouseX - dragOffsetX;
  dragPiece.drawY = mouseY - dragOffsetY;
  drawPuzzle(true);
}

function endDrag(e) {
  if (!isDragging || !dragPiece) return;

  const { x: mouseX, y: mouseY } = getEventPosition(e);
  const targetX = Math.floor(mouseX / pieceWidth);
  const targetY = Math.floor(mouseY / pieceHeight);
  const targetPiece = pieces.find(p => p.x === targetX && p.y === targetY);
  if (targetPiece && targetPiece !== dragPiece) {
    [dragPiece.x, dragPiece.y, targetPiece.x, targetPiece.y] = [targetPiece.x, targetPiece.y, dragPiece.x, dragPiece.y];
  }
  dragPiece = null;
  isDragging = false;
  canvas.style.cursor = 'grab';
  drawPuzzle();
  checkWin();
}

// Eventos mouse
canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', moveDrag);
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('mouseleave', () => {
  if (dragPiece) {
    dragPiece = null;
    isDragging = false;
    canvas.style.cursor = 'grab';
    drawPuzzle();
  }
});

// Eventos toque (touch)
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  startDrag(e);
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  moveDrag(e);
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  endDrag(e);
}, { passive: false });

canvas.addEventListener('touchcancel', e => {
  e.preventDefault();
  endDrag(e);
}, { passive: false });

// Botão próximo
nextBtn.addEventListener('click', () => {
  window.location.href = 'raspadinha.html';
});

// Inicializa os cards
renderPuzzleCards();

// Verifica se os puzzles já foram completados ao carregar
if (completedPuzzles.every(v => v)) {
  nextBtn.style.display = 'inline-block';
}
