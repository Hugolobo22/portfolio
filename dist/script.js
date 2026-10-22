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
const pixelStage = document.querySelector('.pixel-stage');
const glow = document.querySelector('.cursor-glow');
const finePointer = window.matchMedia('(pointer: fine)');
if (finePointer.matches && !reducedMotion.matches) {
  pixelStage.addEventListener('pointermove', (event) => {
    const rect = pixelStage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    pixelStage.style.translate = `${x * 5}px ${y * 5}px`;
  });
  pixelStage.addEventListener('pointerleave', () => {
    pixelStage.style.translate = '';
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

const gameConsole = document.querySelector('#game-console');
const collectBlocks = [...document.querySelectorAll('.collect-block')];
const questCount = document.querySelector('#quest-count');
const questXp = document.querySelector('#quest-xp');
const heroXp = document.querySelector('#hero-xp');
const questMessage = document.querySelector('#quest-message');
const questReset = document.querySelector('#quest-reset');
const meterTiles = [...document.querySelectorAll('.console-meter i')];
let collectedBlocks = 0;
function formatXp(value) {
  return String(value).padStart(3, '0');
}
collectBlocks.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.disabled) return;
    button.disabled = true;
    button.classList.add('collected');
    collectedBlocks += 1;
    questCount.textContent = String(collectedBlocks);
    questXp.textContent = formatXp(collectedBlocks * 10);
    heroXp.textContent = formatXp(collectedBlocks * 10);
    meterTiles[collectedBlocks - 1]?.classList.add('done');
    if (collectedBlocks === collectBlocks.length) {
      gameConsole.classList.add('complete');
      questMessage.textContent = 'FASE COMPLETA! +40 XP';
      questReset.hidden = false;
      questReset.focus();
    } else {
      questMessage.textContent = `${collectBlocks.length - collectedBlocks} BLOCOS RESTANTES`;
    }
  });
});
questReset.addEventListener('click', () => {
  collectedBlocks = 0;
  collectBlocks.forEach((button) => {
    button.disabled = false;
    button.classList.remove('collected');
  });
  meterTiles.forEach((tile) => tile.classList.remove('done'));
  gameConsole.classList.remove('complete');
  questCount.textContent = '0';
  questXp.textContent = '000';
  heroXp.textContent = '000';
  questMessage.textContent = 'ACHE OS BLOCOS PARA COMEÇAR';
  questReset.hidden = true;
  collectBlocks[0].focus();
});

document.querySelectorAll('.vibe-controls button[data-vibe]').forEach((button) => {
  button.addEventListener('click', () => {
    const vibe = button.dataset.vibe;
    document.body.dataset.vibe = vibe;
    document.querySelectorAll('.vibe-controls button[data-vibe]').forEach((choice) => {
      choice.setAttribute('aria-pressed', String(choice === button));
    });
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
