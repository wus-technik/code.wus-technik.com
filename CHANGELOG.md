# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.2.0] — 2026-03-18

### Added

- **Globe background** (`src/scripts/globe.js`) — 520-dot Canvas globe in the hero section using Fibonacci-sphere distribution; slow Y-axis rotation with fixed X-tilt; per-dot phase-shifted pulse animation; depth-based opacity (back hemisphere invisible); violet→green colour gradient with white flash at pulse peaks; ~8% randomly selected "bright" feature dots; pauses via `IntersectionObserver` when hero is off-screen
- **Section navigation** (`src/components/SectionNav.astro`) — fixed left-side vertical indicator with one dot per section; active dot scales and glows in violet; labels fade in on hover; clicking any dot smooth-scrolls to that section via shared `goToSection()` export
- **Back-to-top button** (`src/components/BackToTop.astro`) — fixed bottom-right button; fades in after scrolling past 80% of the hero; glass-morphism background with violet border on hover; scrolls back to `#hero` on click
- **Custom scroll controller** (`src/scripts/scroll.js`) — replaces native scroll-snap with GSAP `ScrollToPlugin`-driven section navigation; `wheel` and `touch` events scroll exactly one section at a time; configurable duration (1.4 s) and easing (`power2.inOut`); lock buffer prevents skipping; exports `goToSection(index)` for use by `SectionNav`
- `@fontsource/roboto` (300/400/700) added as self-hosted font dependency

### Changed

- **Hero headline** rewritten to "Building for you. / Built for W&S." — first line white, second line violet→green gradient applied directly to `.char` spans (fixes `overflow:hidden` clip on `.char-wrap` that previously hid the gradient); font changed from Syne to Roboto 700; size reduced to `clamp(2.2rem, 5vw, 5rem)`
- **All section headings** now use Roboto — `--font-display` CSS variable reassigned from Syne to Roboto, propagating to every component that references it
- **ConnectingThread** completely redesigned from a simple Bezier path to a PCB-style circuit-trace overlay:
  - Vertical trunk runs down the left margin (x ≈ 31 px, aligned with `SectionNav` dots); dashed violet ghost line always visible; active trace draws violet→green with scroll scrub
  - Per-section bus frames branch from the trunk to each card/tile: top horizontal bus → vertical drops → right-side vertical → vertical rises → bottom horizontal bus returning to trunk; right-angle paths with `stroke-linecap: square`
  - Ghost frame (dim violet rails + drop lines) visible before animation; ghost junction pads mark trunk↔bus connection points
  - Active frame animates in sequence when section enters viewport (top bus → drops → right side → rises → bottom bus)
  - Square PCB pads at all card and trunk junction points
  - Services framed in violet (`#9333ea`), How We Work in indigo (`#6366f1`), About in green (`#10b981`)
- **CI workflow** — Node.js runtime bumped from 20 to 24 to resolve GitHub Actions deprecation warning
- **Hero `aria-label`** updated to match new headline text

### Fixed

- Gradient text on second hero headline line was clipped by `overflow:hidden` on `.char-wrap`; fixed by applying `background-clip:text` directly to each `.char` span instead of the parent

[Unreleased]: https://github.com/wus-technik/code.wus-technik.com/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/wus-technik/code.wus-technik.com/compare/v0.1.0...v0.2.0

## [0.1.0] — 2026-03-18

### Added

- Initial release of the `code.wus-technik.com` landing page
- Astro static site (`output: 'static'`) targeting `https://code.wus-technik.com`
- GitHub Actions workflow (`.github/workflows/deploy.yml`) — builds and deploys to `gh-pages` branch via `JamesIves/github-pages-deploy-action`
- `public/CNAME` for GitHub Pages custom domain; `public/.nojekyll` to suppress Jekyll processing

**Layout & Design**
- Base HTML layout (`src/layouts/Layout.astro`) with SEO meta tags and inline SVG favicon
- Global CSS (`src/styles/global.css`) with CSS custom properties for all colors, spacing, and transitions
- `scroll-snap-type: y mandatory` on `html` with per-section `scroll-snap-align: start` (100vh sections)
- CSS grain overlay on `body::before` via inline SVG `feTurbulence` filter
- Custom scrollbar styled in violet accent
- `@fontsource/syne` (400/700/800) as display font; `@fontsource/jetbrains-mono` (400) as body/mono font — fully self-hosted, no Google Fonts CDN dependency

**ConnectingThread SVG overlay** (`src/components/ConnectingThread.astro` + `src/scripts/thread.js`)
- Fixed-width SVG spanning full page height, positioned absolutely behind all content
- Path built dynamically in JS after DOM layout using `offsetTop` measurements on each section
- S-curve cubic Bezier path weaving ±40px around vertical center through all 5 section anchors
- `linearGradient` with `gradientUnits="userSpaceOnUse"` shifting violet → emerald top-to-bottom; `y2` set to actual page height in JS
- `stroke-dashoffset` animated from `totalLength → 0` via GSAP `ScrollTrigger` with `scrub: 1.2`
- Pulsing SVG node circles at each section anchor: scale spring entrance (`back.out(1.7)`) + repeating glow-ring fade on `ScrollTrigger` section entry
- Mobile fallback: thread SVG hidden, replaced with a static CSS dotted vertical line
- Automatic rebuild on `window.resize` (debounced 300 ms)

**Hero section** (`src/components/Hero.astro` + `src/scripts/hero.js`)
- Four animated CSS blob layers (radial gradient + `filter: blur(90px)`) with independent `@keyframes` drift cycles
- CSS scanline overlay for industrial texture
- Headline "Built for the inside." split into per-character `<span>` wrappers for GSAP stagger animation
- Second headline line rendered as a gradient text clip (violet → emerald)
- Eyebrow label, gradient subtitle, and animated scroll indicator
- Mouse parallax: background blobs shift on `mousemove` at different depths, interpolated via GSAP ticker (only active when hero is in viewport)
- GSAP entrance timeline: meta label → character stagger → subtitle → scroll indicator

**Services section** (`src/components/Services.astro` + `src/scripts/sections.js`)
- 4 service cards: DevOps, WebOps, Infrastructure, MDM
- Custom inline SVG icons per service (geometric line style)
- Violet / green card variants with glow border and background on hover
- Decorative corner accent that glows on hover
- Staggered scroll-triggered reveal (GSAP `ScrollTrigger`, `stagger: 0.12`)
- Per-card 3D perspective tilt on `mousemove` via GSAP (`rotateX`/`rotateY`), elastic reset on `mouseleave`

**How We Work section** (`src/components/HowWeWork.astro` + `src/scripts/sections.js`)
- 3-step horizontal process: Plan → Build → Ship
- Horizontal track line with `linear-gradient` fill animated from 0% → 100% width on scroll entry
- Coloured node dots per step (violet / mixed / green) with glow shadows
- Large step numbers as background typographic accents
- Steps stagger in from below on scroll

**About section** (`src/components/About.astro` + `src/scripts/sections.js`)
- Two-column layout: typographic statement left, geometric SVG right
- Three-line statement with muted / gradient text variants
- Abstract geometric SVG: concentric hexagons + dashed rings + radial spokes + vertex dots — all animated independently via CSS `@keyframes` (no JS required)
- Body copy, italic tagline, and styled tag pills
- Left column slides in from left, right SVG scales in on scroll

**Footer** (`src/components/Footer.astro`)
- Dark green tinted background (`#060e0a`) with radial green ambient glows
- Brand mark with inline SVG logo, site name, and tagline
- Mini anchor navigation
- Horizontal gradient dividers
- Company name (W&S Technik GmbH) + department label + W&S Gruppe hierarchy indicator
- Service summary tags (DevOps / WebOps / Infrastructure / MDM)
- Copyright, Impressum, Datenschutz, Kontakt links
- Large "WUS" watermark background text

[0.1.0]: https://github.com/wus-technik/code.wus-technik.com/releases/tag/v0.1.0
