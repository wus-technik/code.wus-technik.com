/**
 * globe.js — Animated dot-globe background for the hero section
 *
 * - Fibonacci-sphere distribution (~500 dots)
 * - Slow Y-axis rotation
 * - Per-dot pulse animation (phase-shifted, so they breathe independently)
 * - Depth-based opacity: front hemisphere bright, back hemisphere invisible
 * - Colour gradient: violet (top) → green (bottom), mixing toward white at pulse peaks
 * - Pauses rendering when the hero section is off-screen (IntersectionObserver)
 */

const canvas = document.getElementById('hero-globe');
if (!canvas) throw new Error('hero-globe canvas not found');

const ctx = canvas.getContext('2d');

// ── Config ────────────────────────────────────────────────────────────────────

const N_DOTS          = 520;
const RADIUS_RATIO    = 0.36;   // fraction of Math.min(W, H)
const ROTATION_SPEED  = 0.0012; // rad/frame  (~4° per second)
const TILT_X          = 0.22;   // fixed X-axis tilt (radians) — tilts globe slightly

// Colors  (R, G, B)
const C_VIOLET = [147, 51,  234];
const C_GREEN  = [52,  211, 153];
const C_WHITE  = [240, 238, 248];

// ── Dot generation (Fibonacci sphere) ────────────────────────────────────────

const PHI = Math.PI * (3 - Math.sqrt(5)); // golden angle

const dots = Array.from({ length: N_DOTS }, (_, i) => {
  const y     = 1 - (i / (N_DOTS - 1)) * 2;       // -1 … +1
  const r     = Math.sqrt(1 - y * y);
  const theta = PHI * i;

  return {
    x:          Math.cos(theta) * r,
    y,
    z:          Math.sin(theta) * r,
    phase:      Math.random() * Math.PI * 2,        // pulse phase offset
    speed:      0.25 + Math.random() * 0.75,        // pulse speed multiplier
    colorT:     (y + 1) / 2,                        // 0 = bottom/green, 1 = top/violet
    brightDot:  Math.random() < 0.08,               // ~8% are "bright" feature dots
  };
});

// ── Colour helpers ────────────────────────────────────────────────────────────

function lerp3(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t | 0,
    a[1] + (b[1] - a[1]) * t | 0,
    a[2] + (b[2] - a[2]) * t | 0,
  ];
}

// ── Canvas sizing ─────────────────────────────────────────────────────────────

function resize() {
  canvas.width  = canvas.offsetWidth  * (window.devicePixelRatio || 1);
  canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
}

// ── Render loop ───────────────────────────────────────────────────────────────

let rotY = 0;
let rafId = null;

// Pre-compute tilt sin/cos (fixed X-tilt for a natural globe look)
const cosX = Math.cos(TILT_X);
const sinX = Math.sin(TILT_X);

function render(ts) {
  rafId = requestAnimationFrame(render);

  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  if (!W || !H) return;

  ctx.clearRect(0, 0, W, H);

  const R  = Math.min(W, H) * RADIUS_RATIO;
  const cx = W * 0.64;   // offset right — leaves room for text on the left
  const cy = H * 0.50;

  rotY += ROTATION_SPEED;
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);

  const t = ts * 0.001; // seconds

  // Project all dots
  const projected = dots.map(dot => {
    // Rotate around Y-axis
    const rx1 =  dot.x * cosY + dot.z * sinY;
    const ry1 =  dot.y;
    const rz1 = -dot.x * sinY + dot.z * cosY;

    // Rotate around X-axis (fixed tilt)
    const rx  =  rx1;
    const ry  =  ry1 * cosX - rz1 * sinX;
    const rz  =  ry1 * sinX + rz1 * cosX;

    // Orthographic projection
    const px = cx + rx * R;
    const py = cy + ry * R;

    // Depth in [-1, +1] → visibility [0, 1]
    const depth = (rz + 1) / 2;                  // 0 = back, 1 = front

    // Per-dot pulse  [0, 1]
    const pulse  = 0.5 + 0.5 * Math.sin(t * dot.speed + dot.phase);

    // Size: larger when front-facing and at pulse peak
    const baseSize = dot.brightDot ? 3.2 : 1.6;
    const size = baseSize * (0.4 + depth * 0.6) * (1 + pulse * 0.7 * depth);

    // Colour
    const base  = lerp3(C_GREEN, C_VIOLET, dot.colorT);
    const color = lerp3(base, C_WHITE, pulse * 0.35 * depth);

    // Alpha: back hemisphere invisible, front bright
    const alpha = Math.max(0, rz)
      * (dot.brightDot
        ? (0.5 + pulse * 0.5)
        : (0.15 + pulse * 0.25));

    return { px, py, size, color, alpha, rz };
  });

  // Painter's sort: back → front so front dots render on top
  projected.sort((a, b) => a.rz - b.rz);

  projected.forEach(({ px, py, size, color, alpha }) => {
    if (alpha < 0.015 || size < 0.3) return;

    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha.toFixed(3)})`;
    ctx.fill();
  });
}

// ── Start / stop with visibility ─────────────────────────────────────────────

function start() {
  if (!rafId) rafId = requestAnimationFrame(render);
}

function stop() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

const hero = document.getElementById('hero');
if (hero) {
  const observer = new IntersectionObserver(
    entries => entries[0].isIntersecting ? start() : stop(),
    { threshold: 0.1 }
  );
  observer.observe(hero);
}

window.addEventListener('resize', () => {
  resize();
});

resize();
start();
