/**
 * hero.js — Hero section animations
 *
 * 1. GSAP entrance: per-character stagger on headline, subtitle fade-in
 * 2. Mouse parallax: background blobs shift on mousemove
 * 3. Scroll indicator reveal (delayed after headline)
 */

import { gsap } from 'gsap';

// ─────────────────────────────────────────
// ENTRANCE ANIMATION
// ─────────────────────────────────────────

function runHeroEntrance() {
  const chars    = document.querySelectorAll('#hero .char');
  const subtitle = document.querySelector('#hero .hero-subtitle');
  const meta     = document.querySelector('#hero .hero-meta');
  const scrollInd = document.querySelector('#hero .scroll-indicator');

  if (!chars.length) return;

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  // 1. Meta label fades in first
  tl.from(meta, {
    y: 12,
    opacity: 0,
    duration: 0.6,
  }, 0);

  // 2. Characters stagger up from below clip
  tl.from(chars, {
    y: '110%',
    opacity: 0,
    duration: 0.9,
    stagger: {
      amount: 0.55,
      ease: 'power2.out',
    },
  }, 0.15);

  // 3. Subtitle slides in
  tl.from(subtitle, {
    y: 20,
    opacity: 0,
    duration: 0.7,
  }, 0.75);

  // 4. Scroll indicator fades in last
  tl.to(scrollInd, {
    opacity: 1,
    duration: 0.5,
  }, 1.3);
}

// ─────────────────────────────────────────
// MOUSE PARALLAX
// ─────────────────────────────────────────

function initHeroParallax() {
  const hero   = document.getElementById('hero');
  const blobs  = hero ? hero.querySelectorAll('.blob') : null;

  if (!hero || !blobs) return;

  // Parallax multipliers per blob (depth effect)
  const depths = [0.018, -0.022, 0.012, -0.016];

  // Store last known mouse position for smooth interpolation
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  const halfW = window.innerWidth  / 2;
  const halfH = window.innerHeight / 2;

  hero.addEventListener('mousemove', (e) => {
    // Normalise to -1 … +1 range
    targetX = (e.clientX - halfW) / halfW;
    targetY = (e.clientY - halfH) / halfH;
  });

  // Smooth follow via GSAP ticker
  gsap.ticker.add(() => {
    // Only run when hero is in view (scroll position 0)
    if (window.scrollY > window.innerHeight * 0.1) return;

    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;

    blobs.forEach((blob, i) => {
      const d = depths[i] ?? 0.015;
      const tx = currentX * window.innerWidth  * d;
      const ty = currentY * window.innerHeight * d;
      blob.style.transform = `translate(${tx}px, ${ty}px)`;
    });
  });

  // Reset on mouse leave
  hero.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
  });
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────

// Run as soon as possible (Astro scripts are deferred)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    runHeroEntrance();
    initHeroParallax();
  });
} else {
  runHeroEntrance();
  initHeroParallax();
}
