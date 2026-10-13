// nav.js — theme switch (Light / System / Dark) and scroll-spy for the sidebar.

const root = document.documentElement;
const buttons = document.querySelectorAll('[data-theme-set]');

function applyTheme(choice) {
  if (choice === 'light' || choice === 'dark') root.setAttribute('data-theme', choice);
  else root.removeAttribute('data-theme');
  buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeSet === choice)));
}

let stored = 'system';
try { stored = localStorage.getItem('theme') || 'system'; } catch (e) {}
applyTheme(stored);

buttons.forEach(b => b.addEventListener('click', () => {
  const choice = b.dataset.themeSet;
  try {
    if (choice === 'system') localStorage.removeItem('theme');
    else localStorage.setItem('theme', choice);
  } catch (e) {}
  applyTheme(choice);
}));

// Scroll-spy: highlight the nav item of the section crossing the upper middle of the viewport.
const links = new Map([...document.querySelectorAll('[data-spy]')].map(a => [a.getAttribute('href').slice(1), a]));
const observer = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    links.forEach((a, id) => {
      const on = id === e.target.id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }
}, { rootMargin: '-35% 0px -60% 0px' });
document.querySelectorAll('.view section[id]').forEach(s => observer.observe(s));
