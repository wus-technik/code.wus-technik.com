/**
 * sections.js — ScrollTrigger reveals for all non-hero sections
 *
 * Services  : staggered card reveal (from below + opacity)
 * HowWeWork : step reveals + horizontal track-line animation
 * About     : left column slide-in, right SVG fade-in + scale
 * Cards     : JS hover tilt (perspective 3D transform)
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────
// SHARED REVEAL FACTORY
// ─────────────────────────────────────────

/**
 * Fades + translates elements up on scroll entry.
 *
 * @param {string|Element|NodeList} targets - GSAP selector / elements
 * @param {string|Element}          trigger - ScrollTrigger trigger element
 * @param {object}                  opts    - Overrides
 */
function revealFrom(targets, trigger, opts = {}) {
  gsap.from(targets, {
    y:       opts.y       ?? 40,
    opacity: opts.opacity ?? 0,
    duration: opts.duration ?? 0.75,
    stagger:  opts.stagger  ?? 0,
    ease:     opts.ease     ?? 'power3.out',
    scrollTrigger: {
      trigger:  trigger,
      start:    opts.start ?? 'top 75%',
      toggleActions: 'play none none reverse',
      ...( opts.scrub !== undefined && { scrub: opts.scrub } ),
    },
  });
}

// ─────────────────────────────────────────
// SERVICES — staggered card reveal
// ─────────────────────────────────────────

function initServices() {
  const section = document.getElementById('services');
  if (!section) return;

  const header = section.querySelector('.services-header');
  const cards  = section.querySelectorAll('.service-card');

  // Header slides in first
  revealFrom(header, section, { y: 30, duration: 0.6 });

  // Cards stagger from below
  gsap.from(cards, {
    y:       60,
    opacity: 0,
    duration: 0.7,
    stagger:  0.12,
    ease:     'power3.out',
    scrollTrigger: {
      trigger:       section,
      start:         'top 65%',
      toggleActions: 'play none none reverse',
    },
  });
}

// ─────────────────────────────────────────
// SERVICES — Card hover tilt (3D perspective)
// ─────────────────────────────────────────

function initCardTilt() {
  const cards = document.querySelectorAll('[data-card]');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;

      // Normalised offset from center: -1 … +1
      const nx = (e.clientX - cx) / (rect.width  / 2);
      const ny = (e.clientY - cy) / (rect.height / 2);

      const rotateX = ny * -7; // tilt up/down
      const rotateY = nx *  7; // tilt left/right

      gsap.to(card, {
        rotateX,
        rotateY,
        translateZ: 12,
        duration:   0.25,
        ease:       'power2.out',
        transformPerspective: 800,
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX:    0,
        rotateY:    0,
        translateZ: 0,
        duration:   0.55,
        ease:       'elastic.out(1, 0.6)',
        transformPerspective: 800,
      });
    });
  });
}

// ─────────────────────────────────────────
// HOW WE WORK — step reveals + track line
// ─────────────────────────────────────────

function initHowWeWork() {
  const section = document.getElementById('how-we-work');
  if (!section) return;

  const header    = section.querySelector('.hww-header');
  const steps     = section.querySelectorAll('.step-item');
  const trackFill = section.querySelector('#track-fill');

  // Header
  revealFrom(header, section, { y: 25, duration: 0.6 });

  // Steps stagger in
  gsap.from(steps, {
    y:       50,
    opacity: 0,
    duration: 0.7,
    stagger:  0.18,
    ease:     'power3.out',
    scrollTrigger: {
      trigger:       section,
      start:         'top 65%',
      toggleActions: 'play none none reverse',
    },
  });

  // Animate track line width from 0% → 100%
  if (trackFill) {
    gsap.fromTo(
      trackFill,
      { width: '0%' },
      {
        width: '100%',
        duration: 1.2,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger:       section,
          start:         'top 60%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }
}

// ─────────────────────────────────────────
// ABOUT — left text + right geo reveal
// ─────────────────────────────────────────

function initAbout() {
  const section = document.getElementById('about');
  if (!section) return;

  const left  = section.querySelector('[data-about-left]');
  const right = section.querySelector('[data-about-right]');

  if (left) {
    revealFrom(left, section, {
      x:       -40,
      y:       0,
      duration: 0.85,
      start:    'top 70%',
    });
  }

  if (right) {
    gsap.from(right, {
      opacity:  0,
      scale:    0.88,
      duration: 1,
      ease:     'power3.out',
      scrollTrigger: {
        trigger:       section,
        start:         'top 70%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  // Subtle statement lines stagger
  const lines = section.querySelectorAll('.statement-line');
  gsap.from(lines, {
    x:       -20,
    opacity: 0,
    duration: 0.6,
    stagger:  0.15,
    ease:     'power3.out',
    scrollTrigger: {
      trigger:       section,
      start:         'top 65%',
      toggleActions: 'play none none reverse',
    },
  });
}

// ─────────────────────────────────────────
// FOOTER — reveal
// ─────────────────────────────────────────

function initFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  revealFrom(footer.querySelector('.footer-brand'),   footer, { y: 20, duration: 0.6 });
  revealFrom(footer.querySelector('.footer-company'), footer, { y: 30, duration: 0.7, start: 'top 75%' });
  revealFrom(footer.querySelector('.footer-bottom'),  footer, { y: 15, duration: 0.5, start: 'top 80%' });
}

// ─────────────────────────────────────────
// SECTION FADE-IN (all sections, generic)
// ─────────────────────────────────────────

function initSectionReveal() {
  const sections = document.querySelectorAll('.snap-section:not(#hero)');

  sections.forEach((section) => {
    gsap.from(section.querySelector('.section-inner') ?? section, {
      opacity: 0,
      duration: 0.4,
      ease:     'power2.out',
      scrollTrigger: {
        trigger:       section,
        start:         'top 90%',
        toggleActions: 'play none none none',
      },
    });
  });
}

// ─────────────────────────────────────────
// INIT ALL
// ─────────────────────────────────────────

function init() {
  initSectionReveal();
  initServices();
  initCardTilt();
  initHowWeWork();
  initAbout();
  initFooter();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
