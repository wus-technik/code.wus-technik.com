/**
 * scroll.js — Custom section-by-section smooth scrolling (GSAP-driven)
 *
 * Uses GSAP ScrollToPlugin so scroll speed and easing are fully controlled.
 * Intercepts wheel and touch events and navigates exactly one section at a time.
 */

import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

const DURATION    = 1.4;  // seconds per section transition
const EASE        = 'power2.inOut';
const LOCK_BUFFER = 200;  // ms after animation ends before next scroll is accepted

let isScrolling = false;

function getSections() {
  return Array.from(document.querySelectorAll('.snap-section'));
}

function getCurrentIndex(sections) {
  const mid = window.scrollY + window.innerHeight * 0.5;
  let nearest     = 0;
  let nearestDist = Infinity;

  sections.forEach((s, i) => {
    const dist = Math.abs(s.offsetTop + s.offsetHeight * 0.5 - mid);
    if (dist < nearestDist) { nearestDist = dist; nearest = i; }
  });

  return nearest;
}

export function goToSection(index) {
  const sections = getSections();
  if (index < 0 || index >= sections.length) return;
  if (isScrolling) return;

  isScrolling = true;

  gsap.to(window, {
    scrollTo:   { y: sections[index].offsetTop, autoKill: false },
    duration:   DURATION,
    ease:       EASE,
    onComplete: () => {
      setTimeout(() => { isScrolling = false; }, LOCK_BUFFER);
    },
  });
}

// ── Wheel ──────────────────────────────────────────────────────────────────────

window.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (isScrolling) return;

  const sections = getSections();
  const dir      = e.deltaY > 0 ? 1 : -1;
  goToSection(getCurrentIndex(sections) + dir);
}, { passive: false });

// ── Touch ──────────────────────────────────────────────────────────────────────

let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  if (isScrolling) return;

  const delta = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(delta) < 40) return;

  const sections = getSections();
  const dir      = delta > 0 ? 1 : -1;
  goToSection(getCurrentIndex(sections) + dir);
}, { passive: true });
