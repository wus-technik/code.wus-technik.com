// nav.js — theme switch (Light / System / Dark) and scroll-spy for the sidebar.

import { activeIndex } from './spy.js';

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

// Scroll-spy: highlight the last section whose top has passed below the sticky bar.
const links = new Map([...document.querySelectorAll('[data-spy]')].map(a => [a.getAttribute('href').slice(1), a]));
const sections = [...document.querySelectorAll('.view section[id]')];

function spy() {
  if (!sections.length) return;
  const offset = parseFloat(getComputedStyle(sections[0]).scrollMarginTop) + 16;
  const i = activeIndex(sections.map(s => s.getBoundingClientRect().top), {
    scrollY: window.scrollY,
    innerHeight: window.innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
    offset,
  });
  const current = sections[i]?.id;
  links.forEach((a, id) => {
    const on = id === current;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
  });
}

let queued = false;
const onScroll = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; spy(); });
};
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
spy();
