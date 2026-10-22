document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const body = document.body;
const revealItems = [...document.querySelectorAll('.reveal')];
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

// The mood switch controls CSS motion; reduced-motion preferences always start calm.
const motionToggle = document.querySelector('.motion-toggle');
const motionLabel = motionToggle.querySelector('.motion-label');
function setMood(active) {
  body.dataset.vibe = active ? 'caos' : 'calmo';
  motionToggle.setAttribute('aria-pressed', String(active));
  motionLabel.textContent = active ? 'CAOS ATIVO' : 'MODO CALMO';
}
setMood(!reducedMotion.matches);
motionToggle.addEventListener('click', () => setMood(body.dataset.vibe !== 'caos'));
reducedMotion.addEventListener?.('change', (event) => {
  if (event.matches) setMood(false);
});

// Organic light pools drift slowly and lean toward the pointer. All drawing stays behind content.
const canvas = document.querySelector('.fluid-canvas');
const ctx = canvas.getContext('2d', { alpha: true });
const colors = ['#ee35b2', '#20d8ff', '#ddff36', '#783df2', '#ff7045'];
let width = window.innerWidth;
let height = window.innerHeight;
let dpr = Math.min(window.devicePixelRatio || 1, 1.25);
let pointer = { x: width * 0.5, y: height * 0.5, seen: false };
const pools = colors.map((color, index) => ({
  color,
  x: width * (0.12 + ((index * 0.217) % 0.76)),
  y: height * (0.16 + ((index * 0.293) % 0.68)),
  phase: index * 1.73,
  radius: Math.min(width, height) * (0.19 + (index % 3) * 0.035)
}));
const ripples = [];
let frame = 0;
let lastPaint = 0;
function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 1.25);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  pools.forEach((pool, index) => {
    pool.radius = Math.min(width, height) * (0.19 + (index % 3) * 0.035);
    pool.x = Math.min(pool.x, width);
    pool.y = Math.min(pool.y, height);
  });
  paint(0, true);
}
function emitRipple(x, y) {
  ripples.push({ x, y, start: performance.now() });
  if (ripples.length > 7) ripples.shift();
}
function paint(now, staticFrame = false) {
  if (!staticFrame && now - lastPaint < 34) {
    frame = requestAnimationFrame(paint);
    return;
  }
  lastPaint = now;
  ctx.clearRect(0, 0, width, height);
  const energetic = body.dataset.vibe === 'caos' && !reducedMotion.matches;
  pools.forEach((pool, index) => {
    pool.phase += energetic ? 0.0028 + index * 0.00018 : 0;
    const driftX = Math.sin(pool.phase * 1.3) * width * 0.055;
    const driftY = Math.cos(pool.phase * 0.9) * height * 0.065;
    const targetX = pool.x + driftX + (pointer.seen ? (pointer.x - pool.x) * 0.075 : 0);
    const targetY = pool.y + driftY + (pointer.seen ? (pointer.y - pool.y) * 0.075 : 0);
    const radius = pool.radius * (1 + Math.sin(pool.phase * 0.7) * (energetic ? 0.12 : 0));
    const gradient = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, radius);
    gradient.addColorStop(0, `${pool.color}44`);
    gradient.addColorStop(0.42, `${pool.color}22`);
    gradient.addColorStop(1, `${pool.color}00`);
    ctx.fillStyle = gradient;
    ctx.fillRect(targetX - radius, targetY - radius, radius * 2, radius * 2);
  });
  const time = performance.now();
  ripples.forEach((ripple) => {
    const age = (time - ripple.start) / 1150;
    if (age >= 1) return;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, 12 + age * 155, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(234,255,72,${(1 - age) * 0.7})`;
    ctx.lineWidth = 1 + (1 - age) * 3;
    ctx.stroke();
  });
  for (let index = ripples.length - 1; index >= 0; index -= 1) {
    if (time - ripples[index].start > 1150) ripples.splice(index, 1);
  }
  if (!staticFrame) frame = requestAnimationFrame(paint);
}
function startCanvas() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(paint);
}
window.addEventListener('resize', resizeCanvas, { passive: true });
window.addEventListener('pointermove', (event) => {
  pointer = { x: event.clientX, y: event.clientY, seen: true };
}, { passive: true });
window.addEventListener('pointerdown', (event) => emitRipple(event.clientX, event.clientY), { passive: true });
document.addEventListener('visibilitychange', () => document.hidden ? cancelAnimationFrame(frame) : startCanvas());
resizeCanvas();
startCanvas();

// A small fixed droplet traces the scroll and reports the current chapter.
const progressRoot = document.documentElement;
const fallCount = document.querySelector('.fall-count');
const chapters = [...document.querySelectorAll('[data-section]')];
let scrollFrame = 0;
function updateFall() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const percentage = maxScroll > 0 ? Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100)) : 0;
  progressRoot.style.setProperty('--scroll-progress', `${percentage}%`);
  const activeChapter = [...chapters].reverse().find((chapter) => chapter.getBoundingClientRect().top < window.innerHeight * 0.48);
  fallCount.textContent = `${activeChapter?.dataset.section || '01'}—${chapters.at(-1)?.dataset.section || '04'}`;
  scrollFrame = 0;
}
window.addEventListener('scroll', () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateFall);
}, { passive: true });
window.addEventListener('resize', updateFall, { passive: true });
updateFall();

// Mobile navigation closes on selection, Escape, and a move to desktop width.
const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
  mobileMenu.hidden = true;
}
menuButton.addEventListener('click', () => {
  const opening = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.setAttribute('aria-label', opening ? 'Fechar menu' : 'Abrir menu');
  mobileMenu.hidden = !opening;
});
mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileMenu.hidden) {
    closeMenu();
    menuButton.focus();
  }
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 680 && !mobileMenu.hidden) closeMenu();
});

// Clicking any liquid surface creates a ring where the gesture lands.
function addSurfaceRipple(button, event) {
  const bounds = button.getBoundingClientRect();
  const x = event.clientX ? event.clientX : bounds.left + bounds.width / 2;
  const y = event.clientY ? event.clientY : bounds.top + bounds.height / 2;
  emitRipple(x, y);
  const target = button.closest('.liquid-orbit, .card-art');
  if (!target) return;
  const localX = x - bounds.left + (button === target ? 0 : bounds.left - target.getBoundingClientRect().left);
  const localY = y - bounds.top + (button === target ? 0 : bounds.top - target.getBoundingClientRect().top);
  const wave = document.createElement('i');
  wave.className = 'ripple-wave';
  wave.setAttribute('aria-hidden', 'true');
  wave.style.left = `${localX}px`;
  wave.style.top = `${localY}px`;
  target.append(wave);
  window.setTimeout(() => wave.remove(), 950);
}
document.querySelectorAll('.pond-trigger, .ripple-target').forEach((button) => {
  button.addEventListener('click', (event) => addSurfaceRipple(button, event));
});

// Project cards can be moved with a pointer or keyboard; reset returns them to their slots.
const cards = [...document.querySelectorAll('.project-card')];
const dragStatus = document.querySelector('#drag-status');
let activeDrag = null;
function getOffset(card, axis) {
  const value = parseFloat(card.style.getPropertyValue(`--drag-${axis}`));
  return Number.isFinite(value) ? value : 0;
}
function setCardOffset(card, x, y) {
  card.style.setProperty('--drag-x', `${x}px`);
  card.style.setProperty('--drag-y', `${y}px`);
}
function endDrag(handle) {
  if (!activeDrag || activeDrag.handle !== handle) return;
  activeDrag.card.classList.remove('dragging');
  activeDrag = null;
  dragStatus.textContent = 'PEÇA SOLTA. CONTINUE EXPLORANDO.';
}
document.querySelectorAll('.drag-handle').forEach((handle) => {
  const card = handle.closest('.project-card');
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    activeDrag = { card, handle, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: getOffset(card, 'x'), y: getOffset(card, 'y') };
    card.classList.add('dragging');
    dragStatus.textContent = 'MOVENDO PEÇA. SOLTE PARA POSICIONAR.';
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', (event) => {
    if (!activeDrag || activeDrag.handle !== handle || activeDrag.pointerId !== event.pointerId) return;
    setCardOffset(card, activeDrag.x + event.clientX - activeDrag.startX, activeDrag.y + event.clientY - activeDrag.startY);
  });
  handle.addEventListener('pointerup', () => endDrag(handle));
  handle.addEventListener('pointercancel', () => endDrag(handle));
  handle.addEventListener('lostpointercapture', () => endDrag(handle));
  handle.addEventListener('keydown', (event) => {
    const vectors = { ArrowUp: [0, -14], ArrowDown: [0, 14], ArrowLeft: [-14, 0], ArrowRight: [14, 0] };
    if (event.key === 'Home') {
      event.preventDefault();
      setCardOffset(card, 0, 0);
      dragStatus.textContent = 'PEÇA RECOLOCADA NO LUGAR.';
      return;
    }
    const vector = vectors[event.key];
    if (!vector) return;
    event.preventDefault();
    const step = event.shiftKey ? 35 : 14;
    setCardOffset(card, getOffset(card, 'x') + vector[0] / 14 * step, getOffset(card, 'y') + vector[1] / 14 * step);
    dragStatus.textContent = 'PEÇA MOVIDA PELO TECLADO. HOME RECOLOCA.';
  });
});
document.querySelector('#reset-cards').addEventListener('click', () => {
  cards.forEach((card) => setCardOffset(card, 0, 0));
  dragStatus.textContent = 'TODAS AS PEÇAS VOLTARAM AO LUGAR.';
});

const shareButton = document.querySelector('.share-button');
const toast = document.querySelector('.toast');
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
shareButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast('LINK COPIADO. PODE COMPARTILHAR.');
  } catch {
    showToast('A CÓPIA FOI BLOQUEADA PELO NAVEGADOR.');
  }
});
