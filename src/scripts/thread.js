/**
 * thread.js — Connecting Thread SVG animation
 *
 * Builds the SVG path dynamically after DOM layout:
 *   1. Measures section anchor points using offsetTop
 *   2. Constructs a smooth cubic Bezier path weaving through the centers
 *   3. Sets up a GSAP ScrollTrigger scrub to animate stroke-dashoffset
 *   4. Adds pulsing node circles at each section anchor, revealed on scroll
 *
 * The SVG uses gradientUnits="userSpaceOnUse" — the gradient y2 coordinate
 * is updated to match the actual page height so violet→green maps correctly.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────
// NODE COLOR SEQUENCE (violet → green)
// ─────────────────────────────────────────
const NODE_COLORS = [
  '#9333ea', // hero      — bright violet
  '#7c3aed', // services  — mid violet
  '#34d399', // how-we-work — light green (crossover point)
  '#10b981', // about     — green
  '#047857', // footer    — deep green
];

const NODE_GLOW_COLORS = [
  'rgba(147,51,234,0.6)',
  'rgba(124,58,237,0.5)',
  'rgba(52,211,153,0.5)',
  'rgba(16,185,129,0.5)',
  'rgba(4,120,87,0.4)',
];

// ─────────────────────────────────────────
// BUILD PATH
// ─────────────────────────────────────────

/**
 * Generates a smooth cubic Bezier SVG path through the given points.
 * Points alternate left-of-center and right-of-center for a gentle weave.
 *
 * @param {{ x: number, y: number }[]} points - Anchor points in page space
 * @returns {string} SVG path `d` attribute
 */
function buildSmoothPath(points) {
  if (points.length < 2) return '';

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    // Vertical midpoint
    const midY = (prev.y + curr.y) / 2;

    // Horizontal tension — creates the weave
    const tension = 50;
    const sign    = (i % 2 === 0) ? 1 : -1;

    // Control points: one above midpoint on prev side, one below on curr side
    const cp1x = prev.x + sign * tension;
    const cp1y = midY - (curr.y - prev.y) * 0.15;
    const cp2x = curr.x - sign * tension;
    const cp2y = midY + (curr.y - prev.y) * 0.15;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }

  return d;
}

// ─────────────────────────────────────────
// CREATE NODE CIRCLE
// ─────────────────────────────────────────

function createNode(svg, x, y, colorIndex) {
  const ns = 'http://www.w3.org/2000/svg';

  // Outer glow circle
  const glow = document.createElementNS(ns, 'circle');
  glow.setAttribute('cx', x);
  glow.setAttribute('cy', y);
  glow.setAttribute('r',  '10');
  glow.setAttribute('fill', 'none');
  glow.setAttribute('stroke', NODE_GLOW_COLORS[colorIndex]);
  glow.setAttribute('stroke-width', '1');
  glow.setAttribute('class', `thread-node-glow thread-node-glow-${colorIndex}`);
  glow.style.opacity = '0';
  glow.style.transformOrigin = `${x}px ${y}px`;

  // Inner solid dot
  const dot = document.createElementNS(ns, 'circle');
  dot.setAttribute('cx', x);
  dot.setAttribute('cy', y);
  dot.setAttribute('r',  '4');
  dot.setAttribute('fill', NODE_COLORS[colorIndex]);
  dot.setAttribute('filter', 'url(#node-glow)');
  dot.setAttribute('class', `thread-node thread-node-${colorIndex}`);
  dot.style.opacity = '0';
  dot.style.transformOrigin = `${x}px ${y}px`;

  svg.appendChild(glow);
  svg.appendChild(dot);

  return { dot, glow };
}

// ─────────────────────────────────────────
// MAIN INIT
// ─────────────────────────────────────────

function initThread() {
  const svg      = document.querySelector('.thread-svg');
  const wrapper  = document.querySelector('.page-wrapper');
  const sections = document.querySelectorAll('.snap-section');

  if (!svg || !wrapper || sections.length === 0) return;

  // ── 1. Set SVG dimensions to full page height ──
  const totalHeight = wrapper.scrollHeight;
  const svgWidth    = wrapper.offsetWidth;

  svg.setAttribute('width',   svgWidth);
  svg.setAttribute('height',  totalHeight);
  svg.setAttribute('viewBox', `0 0 ${svgWidth} ${totalHeight}`);

  // ── 2. Update gradient to span full page height ──
  const gradient = svg.querySelector('#thread-gradient');
  if (gradient) {
    gradient.setAttribute('y1', '0');
    gradient.setAttribute('y2', String(totalHeight));
  }

  // ── 3. Compute anchor points (center of each section) ──
  // Using offsetTop + offsetHeight for accuracy post-layout.
  // The thread weaves slightly left/right of the center for visual interest.
  const centerX = svgWidth / 2;
  const weaveMag = Math.min(svgWidth * 0.04, 40); // max ±40px or 4vw

  const points = Array.from(sections).map((section, i) => {
    const top    = section.offsetTop;
    const height = section.offsetHeight;
    const cy     = top + height / 2;

    // Alternate left / right offset — creates the weave
    const weave = (i % 2 === 0) ? -weaveMag : weaveMag;

    return { x: centerX + weave, y: cy };
  });

  // Snap first and last points to true center
  if (points.length > 0) {
    points[0].x = centerX;
    points[points.length - 1].x = centerX;
  }

  // ── 4. Build SVG path ──
  const path = svg.querySelector('.thread-path');
  if (!path) return;

  const pathData = buildSmoothPath(points);
  path.setAttribute('d', pathData);

  // ── 5. Measure path length and set up dash animation ──
  const totalLength = path.getTotalLength();

  gsap.set(path, {
    strokeDasharray:  totalLength,
    strokeDashoffset: totalLength,
  });

  // ── 6. Scrub the dashoffset against window scroll ──
  // scrub: 1.2 gives a 1.2s lag so the line smoothly follows snapped scrolling
  gsap.to(path, {
    strokeDashoffset: 0,
    ease: 'none',
    scrollTrigger: {
      trigger:    wrapper,
      start:      'top top',
      end:        'bottom bottom',
      scrub:      1.2,
    },
  });

  // ── 7. Create and animate node circles ──
  points.forEach((point, i) => {
    const { dot, glow } = createNode(svg, point.x, point.y, i);
    const section = sections[i];

    ScrollTrigger.create({
      trigger: section,
      start:   'top center',
      onEnter: () => {
        // Node appears with scale spring
        gsap.to([dot, glow], {
          opacity:  1,
          scale:    1,
          duration: 0.5,
          ease:     'back.out(1.7)',
          stagger:  0.05,
        });

        // Glow pulses
        gsap.fromTo(glow,
          { scale: 1, opacity: 0.8 },
          {
            scale:    2.5,
            opacity:  0,
            duration: 1.2,
            ease:     'power2.out',
            repeat:   -1,
            repeatDelay: 0.8,
          }
        );
      },
      onLeaveBack: () => {
        // Node fades out when scrolling back past it
        gsap.to([dot, glow], {
          opacity:  0,
          scale:    0.5,
          duration: 0.3,
        });
      },
    });

    // Initial scale = 0 for the spring entrance
    gsap.set([dot, glow], { scale: 0 });
  });

  // ── 8. Rebuild on resize ──
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Kill existing ScrollTriggers on the path and re-init
      ScrollTrigger.getAll()
        .filter(t => t.vars?.trigger === wrapper)
        .forEach(t => t.kill());
      initThread();
    }, 300);
  });
}

// ─────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────

// Wait for full layout so offsetTop values are correct
window.addEventListener('load', initThread);
