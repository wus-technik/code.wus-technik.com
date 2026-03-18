/**
 * thread.js — PCB circuit-trace overlay
 *
 * A vertical trunk runs down the left margin (aligned with SectionNav dots).
 * At each section it branches out into a full PCB bus frame:
 *   trunk ──── top horizontal bus ──── busRight
 *                  │          │           │   (right side vertical)
 *               [elem1]    [elem2]    [elem3]
 *                  │          │           │
 *   trunk ──── bottom horizontal bus ──────
 *
 * Trunk draws with scroll scrub. Each frame animates in when its
 * section enters the viewport: top bus → drops → right side → rises → bottom bus.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const NS = 'http://www.w3.org/2000/svg';

// ── SVG helpers ───────────────────────────────────────────────────────────────

function svgEl(tag, attrs = {}) {
  const e = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));
  return e;
}

/** Page-relative bounding box via offsetParent traversal. */
function pageRect(elem) {
  let top = 0, left = 0;
  let node = elem;
  while (node) {
    top  += node.offsetTop  || 0;
    left += node.offsetLeft || 0;
    node  = node.offsetParent;
  }
  const w = elem.offsetWidth;
  const h = elem.offsetHeight;
  return {
    top, left,
    right:   left + w,
    bottom:  top  + h,
    cx:      left + w / 2,
    cy:      top  + h / 2,
    w, h,
  };
}

/** Animate path stroke-dashoffset 100% → 0. */
function animateDash(path, tl, position, duration, ease = 'power2.inOut') {
  const len = path.getTotalLength();
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
  tl.to(path, { strokeDashoffset: 0, duration, ease, immediateRender: false }, position);
}

/** Reset path to fully-hidden state. */
function resetDash(path) {
  const len = path.getTotalLength();
  gsap.set(path, { strokeDashoffset: len });
}

/** Append a path element and return it. */
function addPath(parent, d, stroke, strokeWidth = 1.5, glow = false, extra = {}) {
  const p = svgEl('path', {
    d,
    stroke,
    'stroke-width':   strokeWidth,
    fill:             'none',
    'stroke-linecap': 'square',
    ...(glow ? { filter: 'url(#thread-glow)' } : {}),
    ...extra,
  });
  parent.appendChild(p);
  return p;
}

/** Square PCB pad. */
function addPad(parent, x, y, stroke, size = 7) {
  parent.appendChild(svgEl('rect', {
    x:            x - size / 2,
    y:            y - size / 2,
    width:        size,
    height:       size,
    fill:         'rgba(10,10,15,0.95)',
    stroke,
    'stroke-width': 1.5,
  }));
}

// ── Section frame builder ─────────────────────────────────────────────────────

/**
 * Builds the PCB bus frame for one section.
 *
 * @param {SVGElement}  svg      - The full-page SVG element
 * @param {number}      trunkX   - X coordinate of the main trunk
 * @param {Element}     section  - The section DOM element
 * @param {Element[]}   elems    - Cards / tiles / blocks inside the section
 * @param {string}      color    - Active trace colour
 */
function buildFrame(svg, trunkX, section, elems, color) {
  const rects = elems.map(pageRect);
  if (rects.length === 0) return;

  const BUS_MARGIN = 32; // px above/below card edges for bus rail
  const PAD_MARGIN = 20; // px extra on the right side

  const topBusY    = Math.min(...rects.map(r => r.top))    - BUS_MARGIN;
  const bottomBusY = Math.max(...rects.map(r => r.bottom)) + BUS_MARGIN;
  const busRight   = Math.max(...rects.map(r => r.right))  + PAD_MARGIN;

  const ghostLine = 'rgba(147,51,234,0.15)';
  const ghostDrop = 'rgba(255,255,255,0.07)';
  const g         = svgEl('g');
  svg.appendChild(g);

  // ── Ghost frame (always visible at low opacity) ──────────────────────────

  addPath(g, `M ${trunkX} ${topBusY}      H ${busRight}`, ghostLine, 1);
  addPath(g, `M ${busRight} ${topBusY}    V ${bottomBusY}`, ghostLine, 1);
  addPath(g, `M ${busRight} ${bottomBusY} H ${trunkX}`,    ghostLine, 1);

  rects.forEach(r => {
    addPath(g, `M ${r.cx} ${topBusY}    V ${r.top}`,    ghostDrop, 1);
    addPath(g, `M ${r.cx} ${r.bottom}   V ${bottomBusY}`, ghostDrop, 1);
  });

  // Ghost junction pads — show trunk↔frame connection before animation
  [topBusY, bottomBusY].forEach(busY => {
    g.appendChild(svgEl('rect', {
      x: trunkX - 3, y: busY - 3, width: 6, height: 6,
      fill: 'none', stroke: 'rgba(147,51,234,0.3)', 'stroke-width': 1,
    }));
  });

  // ── Active paths (animate in on scroll) ──────────────────────────────────

  const topBus    = addPath(g, `M ${trunkX} ${topBusY} H ${busRight}`,       color, 1.5, true);
  const rightSide = addPath(g, `M ${busRight} ${topBusY} V ${bottomBusY}`,   color, 1,   true);
  const bottomBus = addPath(g, `M ${busRight} ${bottomBusY} H ${trunkX}`,    color, 1.5, true);

  const drops = rects.map(r => addPath(g, `M ${r.cx} ${topBusY} V ${r.top}`,    color, 1.5, true));
  const rises = rects.map(r => addPath(g, `M ${r.cx} ${r.bottom} V ${bottomBusY}`, color, 1.5, true));

  // Pads
  addPad(g, trunkX, topBusY,    color, 8); // trunk ↔ top bus junction
  addPad(g, trunkX, bottomBusY, color, 8); // trunk ↔ bottom bus junction
  rects.forEach(r => {
    addPad(g, r.cx, r.top,    color);
    addPad(g, r.cx, r.bottom, color);
  });

  // ── Animation timeline ────────────────────────────────────────────────────

  const allActive = [topBus, rightSide, bottomBus, ...drops, ...rises];
  allActive.forEach(resetDash);

  ScrollTrigger.create({
    trigger: section,
    start:   'top 65%',

    onEnter() {
      const tl = gsap.timeline();

      // 1. Top bus draws left → right
      animateDash(topBus, tl, 0, 0.55);

      // 2. Drops fall simultaneously from the top bus
      drops.forEach((d, i) => animateDash(d, tl, `>-0.1`, 0.3));

      // 3. Right side closes the top corner
      animateDash(rightSide, tl, '<0.15', 0.35);

      // 4. Rises come up from card bottoms
      rises.forEach((r, i) => animateDash(r, tl, `>-0.15`, 0.3));

      // 5. Bottom bus draws right → left (closes the frame back to trunk)
      animateDash(bottomBus, tl, '>-0.1', 0.55);
    },

    onLeaveBack() {
      allActive.forEach(resetDash);
    },
  });
}

// ── Main init ─────────────────────────────────────────────────────────────────

function initThread() {
  const svg     = document.querySelector('.thread-svg');
  const wrapper = document.querySelector('.page-wrapper');
  if (!svg || !wrapper) return;

  // Kill old triggers
  ScrollTrigger.getAll()
    .filter(t => t.vars?.id?.startsWith('thread'))
    .forEach(t => t.kill());

  // Clear previous drawing (keep <defs>)
  Array.from(svg.children)
    .filter(c => c.tagName !== 'defs')
    .forEach(c => c.remove());

  const W = wrapper.offsetWidth;
  const H = wrapper.scrollHeight;

  svg.setAttribute('width',   W);
  svg.setAttribute('height',  H);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const grad = svg.querySelector('#thread-gradient');
  if (grad) grad.setAttribute('y2', H);

  // Trunk x — centre of SectionNav dots (left: 1.75rem = 28px, dot centre = 31px)
  const TRUNK_X = 31;

  // ── Ghost trunk ──────────────────────────────────────────────────────────
  svg.appendChild(svgEl('line', {
    x1: TRUNK_X, y1: 0,
    x2: TRUNK_X, y2: H,
    stroke: 'rgba(147,51,234,0.18)',
    'stroke-width': 1.5,
    'stroke-dasharray': '3 6',
  }));

  // ── Active trunk (scrubs with scroll) ────────────────────────────────────
  const trunk = addPath(
    svg,
    `M ${TRUNK_X} 0 V ${H}`,
    'url(#thread-gradient)',
    1.5,
    true,
    { id: 'thread-trunk-path' }
  );

  const trunkLen = trunk.getTotalLength();
  gsap.set(trunk, { strokeDasharray: trunkLen, strokeDashoffset: trunkLen });

  gsap.to(trunk, {
    strokeDashoffset: 0,
    ease: 'none',
    scrollTrigger: {
      id:      'thread-trunk',
      trigger: wrapper,
      start:   'top top',
      end:     'bottom bottom',
      scrub:   1.4,
    },
  });

  // ── Section frames ────────────────────────────────────────────────────────

  // Services — 4 cards
  const serviceSection = document.getElementById('services');
  if (serviceSection) {
    const cards = Array.from(serviceSection.querySelectorAll('.service-card'));
    if (cards.length) buildFrame(svg, TRUNK_X, serviceSection, cards, '#9333ea');
  }

  // How We Work — 3 steps
  const hwwSection = document.getElementById('how-we-work');
  if (hwwSection) {
    const steps = Array.from(hwwSection.querySelectorAll('.step-item'));
    if (steps.length) buildFrame(svg, TRUNK_X, hwwSection, steps, '#6366f1');
  }

  // About — left block + right block
  const aboutSection = document.getElementById('about');
  if (aboutSection) {
    const blocks = [
      aboutSection.querySelector('[data-about-left]'),
      aboutSection.querySelector('[data-about-right]'),
    ].filter(Boolean);
    if (blocks.length) buildFrame(svg, TRUNK_X, aboutSection, blocks, '#10b981');
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

window.addEventListener('load', initThread);

let _resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(initThread, 300);
});
