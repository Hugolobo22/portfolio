document.documentElement.classList.add('js');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      instance.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

// Keep the menu usable with touch, keyboard, and links inside it.
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
  if (window.innerWidth > 800 && !mobileMenu.hidden) closeMenu();
});

// The orbit follows the pointer without changing its content or blocking links.
const machine = document.querySelector('#machine');
const machineWrap = document.querySelector('.machine-wrap');
const glow = document.querySelector('.cursor-glow');
const finePointer = window.matchMedia('(pointer: fine)');
if (finePointer.matches && !reducedMotion.matches) {
  machineWrap.addEventListener('pointermove', (event) => {
    const rect = machineWrap.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    machine.style.transform = `rotateY(${x * 13}deg) rotateX(${-y * 13}deg)`;
  });
  machineWrap.addEventListener('pointerleave', () => {
    machine.style.transform = '';
  });
  let glowFrame = 0;
  window.addEventListener('pointermove', (event) => {
    if (glowFrame) return;
    glowFrame = requestAnimationFrame(() => {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
      glow.style.opacity = event.target.closest('.hero, .playground') ? '1' : '0';
      glowFrame = 0;
    });
  }, { passive: true });
}

const visualizer = document.querySelector('#visualizer');
const modeLabel = document.querySelector('#mode-label');
const modes = { calmo: { label: 'CALMO', speed: 2.5 }, pulso: { label: 'PULSO', speed: 1 }, caos: { label: 'CAOS', speed: 0.38 } };
document.querySelectorAll('[data-mode]').forEach((button) => {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    if (!modes[mode]) return;
    document.querySelectorAll('[data-mode]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    visualizer.dataset.mode = mode;
    visualizer.style.setProperty('--motion-speed', modes[mode].speed);
    modeLabel.textContent = modes[mode].label;
  });
});

const shareButton = document.querySelector('.share-button');
const toast = document.querySelector('.toast');
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
shareButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast('LINK COPIADO. ENVIE PARA QUEM QUISER.');
  } catch {
    showToast('USE A BARRA DE ENDEREÇOS PARA COPIAR O LINK.');
  }
});
