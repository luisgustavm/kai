const messages = [
  "Você é um amigo incrível!",
  "Continue sendo uma ótima pessoa! 🌈",
  "Sua alegria é contagiante! 😊",
  "Nunca desista dos seus sonhos! 🌟",
  "Eu confio em você, e sempre estarei ao seu lado! 🚀",
  "Gratidão por você existir! 🙏 ksksks"
];

const gallery = document.getElementById('gallery');
const nextBtn = document.getElementById('nextBtn');

let completedScratch = JSON.parse(localStorage.getItem('completedScratch')) || Array(messages.length).fill(false);
let completedCount = completedScratch.filter(Boolean).length;

if (completedCount === messages.length) {
  nextBtn.style.display = 'inline-block';
} else {
  nextBtn.style.display = 'none';
}

function createScratchCard(message, index) {
  const card = document.createElement('div');
  card.classList.add('scratch-card');

  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message');
  msgDiv.textContent = message;

  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#b9aaf9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = 'destination-out';

  let isScratching = false;

  function getLocalCoords(e) {
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

  function scratch(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    checkScratchPercent();
  }

  function checkScratchPercent() {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentPixels++;
    }

    const percent = (transparentPixels / (canvas.width * canvas.height)) * 100;

    if (percent >= 80 && !card.classList.contains('completed')) {
      card.classList.add('completed');
      completedScratch[index] = true;
      localStorage.setItem('completedScratch', JSON.stringify(completedScratch));
      completedCount = completedScratch.filter(Boolean).length;
      canvas.style.display = 'none';
      checkAllCompleted();
    }
  }

  function checkAllCompleted() {
    if (completedCount === messages.length) {
      nextBtn.style.display = 'inline-block';
    } else {
      nextBtn.style.display = 'none';
    }
  }

  // Mouse Events
  canvas.addEventListener('mousedown', e => {
    isScratching = true;
    const { x, y } = getLocalCoords(e);
    scratch(x, y);
  });

  canvas.addEventListener('mousemove', e => {
    if (!isScratching) return;
    const { x, y } = getLocalCoords(e);
    scratch(x, y);
  });

  window.addEventListener('mouseup', () => {
    isScratching = false;
  });

  // Touch Events
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    isScratching = true;
    const { x, y } = getLocalCoords(e);
    scratch(x, y);
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!isScratching) return;
    const { x, y } = getLocalCoords(e);
    scratch(x, y);
  }, { passive: false });

  window.addEventListener('touchend', () => {
    isScratching = false;
  });

  window.addEventListener('touchcancel', () => {
    isScratching = false;
  });

  // Se já estava completo anteriormente, mostra direto
  if (completedScratch[index]) {
    canvas.style.display = 'none';
    card.classList.add('completed');
  }

  card.appendChild(msgDiv);
  card.appendChild(canvas);
  gallery.appendChild(card);
}

messages.forEach((msg, i) => createScratchCard(msg, i));

nextBtn.addEventListener('click', () => {
  window.location.href = 'final.html'; // Redirecionamento final
});
