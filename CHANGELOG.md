# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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

[Unreleased]: https://github.com/wus-technik/code.wus-technik.com/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/wus-technik/code.wus-technik.com/releases/tag/v0.1.0
