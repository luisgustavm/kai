const puzzleImages = ['img/kai.jpg', 'img/kai2.jpg', 'img/kai3.jpg'];
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

function renderPuzzleCards() {
  puzzleSelect.innerHTML = '';
  for (let i = 0; i < puzzleImages.length; i++) {
    const card = document.createElement('div');
    card.className = 'puzzle-card';
    if (i > 0 && !completedPuzzles[i - 1]) card.classList.add('locked');

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
      const maxWidth = window.innerWidth * 0.9;
      const maxHeight = window.innerHeight * 0.6;
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
      pieces.push({ correctX: x, correctY: y, x: pos.x, y: pos.y });
    }
  }
}

function drawPuzzle(dragging = false) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let piece of pieces) {
    if (piece !== dragPiece) {
      ctx.drawImage(image,
        piece.correctX * originalPieceWidth, piece.correctY * originalPieceHeight,
        originalPieceWidth, originalPieceHeight,
        piece.x * pieceWidth, piece.y * pieceHeight,
        pieceWidth, pieceHeight);
    }
  }

  if (dragPiece && dragging) {
    ctx.globalAlpha = 0.7;
    ctx.drawImage(image,
      dragPiece.correctX * originalPieceWidth, dragPiece.correctY * originalPieceHeight,
      originalPieceWidth, originalPieceHeight,
      dragPiece.drawX, dragPiece.drawY,
      pieceWidth, pieceHeight);
    ctx.globalAlpha = 1;
  }
}

function getPieceAt(x, y) {
  for (let i = pieces.length - 1; i >= 0; i--) {
    let piece = pieces[i];
    let px = piece.x * pieceWidth;
    let py = piece.y * pieceHeight;
    if (x > px && x < px + pieceWidth && y > py && y < py + pieceHeight) {
      return piece;
    }
  }
  return null;
}

function snapPiece(piece) {
  // Snap piece to closest grid position if near
  let dx = piece.drawX - piece.x * pieceWidth;
  let dy = piece.drawY - piece.y * pieceHeight;
  if (Math.abs(dx) < pieceWidth / 3 && Math.abs(dy) < pieceHeight / 3) {
    piece.drawX = piece.x * pieceWidth;
    piece.drawY = piece.y * pieceHeight;
  }
}

function checkComplete() {
  for (let piece of pieces) {
    if (piece.x !== piece.correctX || piece.y !== piece.correctY) return false;
  }
  return true;
}

canvas.addEventListener('mousedown', (e) => {
  if (puzzleCompleted) return;
  let rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;

  let piece = getPieceAt(x, y);
  if (piece) {
    dragPiece = piece;
    dragOffsetX = x - piece.x * pieceWidth;
    dragOffsetY = y - piece.y * pieceHeight;
    piece.drawX = x - dragOffsetX;
    piece.drawY = y - dragOffsetY;
    canvas.style.cursor = 'grabbing';
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!dragPiece) return;
  let rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;

  dragPiece.drawX = x - dragOffsetX;
  dragPiece.drawY = y - dragOffsetY;

  drawPuzzle(true);
});

canvas.addEventListener('mouseup', (e) => {
  if (!dragPiece) return;

  let rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;

  // Snap to closest position
  let snappedX = Math.round(dragPiece.drawX / pieceWidth);
  let snappedY = Math.round(dragPiece.drawY / pieceHeight);

  // Swap positions if another piece is in snapped place
  let targetPiece = pieces.find(p => p.x === snappedX && p.y === snappedY);
  if (targetPiece && targetPiece !== dragPiece) {
    // Swap positions
    let tempX = dragPiece.x;
    let tempY = dragPiece.y;
    dragPiece.x = targetPiece.x;
    dragPiece.y = targetPiece.y;
    targetPiece.x = tempX;
    targetPiece.y = tempY;
  } else {
    dragPiece.x = snappedX;
    dragPiece.y = snappedY;
  }

  dragPiece.drawX = dragPiece.x * pieceWidth;
  dragPiece.drawY = dragPiece.y * pieceHeight;

  dragPiece = null;
  canvas.style.cursor = 'grab';
  drawPuzzle();

  if (checkComplete()) {
    puzzleCompleted = true;
    onPuzzleComplete();
  }
});

canvas.addEventListener('mouseleave', () => {
  if (dragPiece) {
    dragPiece = null;
    canvas.style.cursor = 'grab';
    drawPuzzle();
  }
});

nextBtn.addEventListener('click', () => {
  completedPuzzles[currentPuzzleIndex] = true;
  localStorage.setItem('completedPuzzles', JSON.stringify(completedPuzzles));
  puzzleContainer.classList.remove('show');
  nextBtn.style.display = 'none';
  renderPuzzleCards();
});

function onPuzzleComplete() {
  completedImage.src = puzzleImages[currentPuzzleIndex];
  completedImage.style.display = 'block';
  canvas.style.display = 'none';
  nextBtn.style.display = 'block';
  puzzleSelect.style.pointerEvents = 'none';
}

renderPuzzleCards();

  nextBtn.addEventListener('click', () => {
      window.location.href = 'raspadinha.html';
    });

