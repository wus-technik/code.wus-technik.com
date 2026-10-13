# App-shell one-pager (v0.3.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the animated landing page with a single English page in the Jaguar app-mockup style that introduces W&S Technik, its dev team and the Claude Usage Tray project.

**Architecture:** Astro 4 static site, one page (`src/pages/index.astro`) composed of a layout, a sidebar, a topbar, a reusable card component and a footer. All styling in one `global.css` with design tokens from the reference mockup. One small bundled script (`nav.js`) for the theme switch and scroll-spy, plus an inline theme bootstrap in `<head>`. A Node script (`scripts/check-dist.mjs`) asserts on the built HTML and is the test suite.

**Tech Stack:** Astro 4.16, plain CSS, vanilla JS, Node 24 (CI) / Node 26 (local), headless Microsoft Edge for screenshots.

**Spec:** `docs/superpowers/specs/2026-10-13-app-shell-landing-design.md` — read it before starting any task.

## Global Constraints

- Page language English, `<html lang="en">`.
- Only dependency left in `package.json`: `astro`. Remove `gsap`, `@fontsource/jetbrains-mono`, `@fontsource/roboto`, `@fontsource/syne` with `npm uninstall` (keeps `package-lock.json` in sync — CI runs `npm ci`).
- No third-party requests from the page: no web fonts, analytics, shields.io badges, GitHub avatars, embeds. All `src=` and stylesheet `href=` are same-origin.
- Do not touch `.github/workflows/deploy.yml`, `public/CNAME`, `public/.nojekyll`, root `CNAME`.
- No `<meta name="robots" content="noindex…">`.
- Tokens from the reference, except `--text-muted` light = `#5f6775`. `--text-light` never used for meaningful text.
- The document scrolls normally — never `overflow: hidden` on `html`/`body`.
- External links: `target="_blank" rel="noopener"`, visible ↗, visually hidden "(opens in new tab)". The installer download link opens in the same tab.
- No hard-coded release version number anywhere on the page.
- URLs (verbatim):
  - GitHub org `https://github.com/wus-technik`
  - Company `https://www.wus-technik.com`
  - Repo `https://github.com/wus-technik/win_systray-claude-usage`
  - Releases `https://github.com/wus-technik/win_systray-claude-usage/releases`
  - Installer `https://github.com/wus-technik/win_systray-claude-usage/releases/download/setup-stub/ClaudeUsageTraySetup.exe`
  - Imprint `https://www.wus-technik.com/impressum/`
  - Privacy `https://www.wus-technik.com/datenschutz/code.wus-technik.com` (404 until published — known exception)
- Commits: no AI co-author trailer; end every commit message with
  `Claude-Session: https://claude.ai/code/session_016gyqMKdL25QWagoRggDJgv`.
- Work happens on `main` (user decision); **do not push** — pushing `main` deploys. The user pushes after review.

## Review Focus

1. **JS disabled** — page must be fully readable, anchors work, theme follows the OS, theme switch hidden. Pinned in Task 1 (`check-dist` asserts the switch carries the `hidden-nojs` class and the CSS rule exists) and Task 5 (no-JS screenshot).
2. **`localStorage` blocked** (privacy mode, file://) — bootstrap and switch must not throw. Pinned in Task 3: both read/write wrapped in `try/catch`; `check-dist` asserts the inline bootstrap contains `try`.
3. **Short desktop window (1366×650)** — theme switch at the sidebar bottom must remain reachable. Pinned in Task 3 CSS (`overflow-y: auto` on sticky sidebar) and Task 5 screenshot at 1366×650.
4. **Anchor jump under the sticky mobile strip** — headings must not hide behind the strip. Pinned in Task 3 (`scroll-margin-top` on cards) and Task 5 mobile screenshot of `#claude-usage-tray`.
5. **Dark mode via OS without a stored choice** — must render dark, not a light/dark mix. Pinned in Task 2 (tokens in both `prefers-color-scheme` and `[data-theme="dark"]`) and Task 5 screenshot with `--force-dark-mode`.

---

## File map

| File | Responsibility |
|---|---|
| `scripts/check-dist.mjs` | Test: asserts on `dist/index.html` |
| `scripts/check-links.mjs` | Final-status check of every external link |
| `src/layouts/Layout.astro` | `<html>`, head/SEO, inline theme bootstrap, imports CSS |
| `src/styles/global.css` | Tokens, base, shell, card, pills, buttons, responsive |
| `src/components/Sidebar.astro` | Brand, nav groups, theme switch |
| `src/components/Topbar.astro` | Title, subtitle, pill |
| `src/components/Card.astro` | Card shell: header (icon, title, sub) + body slot |
| `src/components/Footer.astro` | © line, Imprint, Privacy |
| `src/components/Ext.astro` | External link with ↗ and hidden "(opens in new tab)" |
| `src/pages/index.astro` | Composes everything, holds the three cards' content |
| `src/scripts/nav.js` | Theme switch + scroll-spy |
| `public/favicon.svg`, `public/claude-usage-tray.png` | Assets |

---

### Task 1: Test harness — `check-dist.mjs`

**Files:**
- Create: `scripts/check-dist.mjs`
- Modify: `package.json` (add script `check`)

**Interfaces:**
- Produces: `npm run check` → runs `node scripts/check-dist.mjs`; exit 0 when all assertions pass, exit 1 and a list of `FAIL: …` lines otherwise. Later tasks rely on the ids `about`, `team`, `claude-usage-tray`, the class `hidden-nojs` and `data-theme-set` attributes asserted here.

- [ ] **Step 1: Write the check script**

`scripts/check-dist.mjs`:

```js
// scripts/check-dist.mjs — assertions on the built page. Run after `npm run build`.
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const file = 'dist/index.html';
if (!existsSync(file)) {
  console.error(`FAIL: ${file} missing — run npm run build`);
  process.exit(1);
}
const html = readFileSync(file, 'utf8');
const cssDir = 'dist/_astro';
const css = existsSync(cssDir)
  ? readdirSync(cssDir).filter(f => f.endsWith('.css')).map(f => readFileSync(`${cssDir}/${f}`, 'utf8')).join('\n')
  : '';
// Astro may inline small stylesheets instead of emitting files.
const allCss = css + [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); };
const has = s => html.includes(s);

// Head / SEO
check(/<html[^>]*lang="en"/.test(html), 'html lang="en"');
check(!/noindex/i.test(html), 'no noindex');
check(has('<link rel="canonical" href="https://code.wus-technik.com/"'), 'canonical link');
check(has('content="https://code.wus-technik.com/"') && has('property="og:url"'), 'og:url');
check(has('<title>W&amp;S Technik · Open source — Claude Usage Tray</title>') ||
      has('<title>W&S Technik · Open source — Claude Usage Tray</title>'), 'title');
check(has('href="/favicon.svg"'), 'favicon.svg link');
check(existsSync('dist/favicon.svg'), 'dist/favicon.svg exists');

// Theme bootstrap: inline (not bundled), guarded, sets class js
const headPart = html.split('</head>')[0];
const inline = [...headPart.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
check(inline.includes('localStorage') && inline.includes('try') && inline.includes("'js'"), 'inline theme bootstrap in head with try/catch and js class');

// No third-party requests
const srcs = [...html.matchAll(/\ssrc="([^"]+)"/g)].map(m => m[1]);
check(srcs.every(s => s.startsWith('/') || s.startsWith('data:')), `same-origin src only: ${srcs.join(', ')}`);
const sheets = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map(m => m[0]);
check(sheets.every(l => /href="\//.test(l)), 'same-origin stylesheets only');
check(!/fonts\.googleapis|shields\.io|avatars\.githubusercontent|gsap/i.test(html), 'no third-party assets');

// Structure
for (const id of ['about', 'team', 'claude-usage-tray']) {
  check(has(`id="${id}"`), `section #${id}`);
  check(has(`href="#${id}"`), `nav link to #${id}`);
}
check(has('id="main"') && has('href="#main"'), 'skip link to #main');
check(/<nav[\s>]/.test(html) && /<main[\s>]/.test(html) && /<footer[\s>]/.test(html), 'landmarks nav/main/footer');

// Theme switch
check(/role="group"[^>]*aria-label="Theme"/.test(html), 'theme switch group');
for (const v of ['light', 'system', 'dark']) check(has(`data-theme-set="${v}"`), `theme button ${v}`);
check(/class="[^"]*hidden-nojs/.test(html), 'theme switch hidden without JS');
check(/html:not\(\.js\)\s*\.hidden-nojs/.test(allCss), 'CSS hides .hidden-nojs without js');
check(!/(^|[},\s])(html|body)\s*\{[^}]*overflow:\s*hidden/.test(allCss), 'no overflow:hidden on html/body');

// Content
const img = html.match(/<img[^>]+claude-usage-tray\.png[^>]*>/)?.[0] ?? '';
check(img && /alt="Claude Usage Tray popup[^"]+"/.test(img) && /width="339"/.test(img) && /height="341"/.test(img), 'screenshot img with alt and size');
check(existsSync('dist/claude-usage-tray.png'), 'dist/claude-usage-tray.png exists');
const dl = 'https://github.com/wus-technik/win_systray-claude-usage/releases/download/setup-stub/ClaudeUsageTraySetup.exe';
const dlTag = html.match(new RegExp(`<a[^>]+href="${dl.replace(/[.\/]/g, '\\$&')}"[^>]*>`))?.[0] ?? '';
check(dlTag && !dlTag.includes('target='), 'installer link, same tab');
for (const u of [
  'https://github.com/wus-technik',
  'https://www.wus-technik.com',
  'https://github.com/wus-technik/win_systray-claude-usage',
  'https://github.com/wus-technik/win_systray-claude-usage/releases',
  'https://www.wus-technik.com/impressum/',
  'https://www.wus-technik.com/datenschutz/code.wus-technik.com',
]) check(has(`href="${u}"`), `link ${u}`);
check(!/v\d+\.\d+\.\d+/.test(html.replace(/<head>[\s\S]*<\/head>/, '')), 'no hard-coded version number');

// External links open in new tab with rel=noopener
const ext = [...html.matchAll(/<a[^>]+href="https?:\/\/[^"]+"[^>]*>/g)].map(m => m[0]).filter(a => !a.includes(dl));
for (const a of ext) check(a.includes('target="_blank"') && a.includes('rel="noopener"'), `external link attrs: ${a}`);

if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('check-dist: all checks passed');
```

- [ ] **Step 2: Add the npm script**

In `package.json` `"scripts"`, add after `"astro": "astro"`:

```json
    "check": "node scripts/check-dist.mjs"
```

(remember the comma after `"astro": "astro"`).

- [ ] **Step 3: Run it against the current site to verify it fails**

Run: `npm run build && npm run check`
Expected: exit 1 with many `FAIL:` lines, among them `FAIL: html lang="en"`, `FAIL: no noindex`, `FAIL: section #about`.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-dist.mjs package.json
git commit -m "test: add dist assertions for the app-shell one-pager

Claude-Session: https://claude.ai/code/session_016gyqMKdL25QWagoRggDJgv"
```

---

### Task 2: Strip the old site; new layout, tokens and base CSS

**Files:**
- Delete: everything in `src/components/`, everything in `src/scripts/`
- Modify: `package.json`, `package-lock.json` (via npm), `src/layouts/Layout.astro` (rewrite), `src/styles/global.css` (rewrite), `src/pages/index.astro` (rewrite to a stub)
- Create: `public/favicon.svg`

**Interfaces:**
- Consumes: `npm run check` from Task 1.
- Produces: `Layout.astro` with props `{ title?: string; description?: string }` and a default `<slot />` inside `<body>`; CSS custom properties listed in Step 4; utility classes `.sr-only`, `.hidden-nojs`, `.muted`, `.mono`.

- [ ] **Step 1: Remove dependencies and old files**

```bash
npm uninstall gsap @fontsource/jetbrains-mono @fontsource/roboto @fontsource/syne
git rm -q src/components/*.astro src/scripts/*.js
```

Expected: `package.json` `dependencies` contains only `astro`.

- [ ] **Step 2: Favicon**

`public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#2563eb"/><text x="16" y="21" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="12" font-weight="800" fill="#fff">W&amp;S</text></svg>
```

- [ ] **Step 3: Layout**

`src/layouts/Layout.astro`:

```astro
---
/**
 * Layout.astro — document shell: head/SEO, theme bootstrap, global CSS.
 */
import '../styles/global.css';

interface Props {
  title?: string;
  description?: string;
}

const {
  title = 'W&S Technik · Open source — Claude Usage Tray',
  description = 'Open-source tools from the in-house dev team of W&S Technik GmbH, starting with Claude Usage Tray — your Claude limits in the Windows tray.',
} = Astro.props;
const url = 'https://code.wus-technik.com/';
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={url} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={url} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <!-- Runs before first paint (is:inline: Astro must not bundle/defer it). -->
    <script is:inline>
      (function () {
        var d = document.documentElement;
        d.classList.add('js');
        try {
          var t = localStorage.getItem('theme');
          if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t);
        } catch (e) {}
      })();
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 4: Global CSS — tokens and base**

`src/styles/global.css` (full rewrite; Task 3 and 4 append to it):

```css
/* global.css — tokens and styles, after decision-platform/mockup-jaguar-app.html */

:root {
  --bg: #f0f2f5; --surface: #ffffff; --surface-2: #f8f9fb; --surface-3: #eef1f5;
  --border: #e2e6ea; --border-strong: #cdd2d8;
  --text: #1a1d23; --text-muted: #5f6775; --text-light: #9aa0ab;
  --primary: #2563eb; --primary-hover: #1d4ed8; --primary-light: #eff4ff; --primary-border: #bfdbfe; --on-primary: #ffffff;
  --success: #16a34a; --success-bg: #f0fdf4; --success-border: #bbf7d0;
  --warning: #b45309; --warning-bg: #fffbeb; --warning-border: #fde68a;
  --accent: #7c3aed; --accent-bg: #f3effe; --accent-border: #e3d8fd;
  --info: #0369a1; --info-bg: #f0f9ff; --info-border: #bae6fd;
  --nav-bg: #161b24; --nav-fg: #e7eaf0; --nav-muted: #8b93a3; --nav-hover: #222935; --nav-active: #2b3444;
  --radius: 8px; --radius-sm: 5px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05);
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --mono: ui-monospace, 'Cascadia Mono', Consolas, 'SFMono-Regular', monospace;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0f1217; --surface: #171b22; --surface-2: #1c2129; --surface-3: #232933;
    --border: #2a303b; --border-strong: #3b4250;
    --text: #e6e8ec; --text-muted: #9aa3b2; --text-light: #6f7886;
    --primary: #5b8def; --primary-hover: #7aa3f3; --primary-light: #16223a; --primary-border: #2a4474; --on-primary: #0b1020;
    --success: #4cc27a; --success-bg: #10261a; --success-border: #1f5a35;
    --warning: #f0ac45; --warning-bg: #2a1f0c; --warning-border: #5c4415;
    --accent: #a78bfa; --accent-bg: #211a36; --accent-border: #3d2f66;
    --info: #5cb8ec; --info-bg: #0e2130; --info-border: #1d4560;
    --nav-bg: #0b0e13; --nav-fg: #e7eaf0; --nav-muted: #7d8595; --nav-hover: #161b23; --nav-active: #1f2632;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #0f1217; --surface: #171b22; --surface-2: #1c2129; --surface-3: #232933;
  --border: #2a303b; --border-strong: #3b4250;
  --text: #e6e8ec; --text-muted: #9aa3b2; --text-light: #6f7886;
  --primary: #5b8def; --primary-hover: #7aa3f3; --primary-light: #16223a; --primary-border: #2a4474; --on-primary: #0b1020;
  --success: #4cc27a; --success-bg: #10261a; --success-border: #1f5a35;
  --warning: #f0ac45; --warning-bg: #2a1f0c; --warning-border: #5c4415;
  --accent: #a78bfa; --accent-bg: #211a36; --accent-border: #3d2f66;
  --info: #5cb8ec; --info-bg: #0e2130; --info-border: #1d4560;
  --nav-bg: #0b0e13; --nav-fg: #e7eaf0; --nav-muted: #7d8595; --nav-hover: #161b23; --nav-active: #1f2632;
  color-scheme: dark;
}

*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: var(--font); font-size: 13.5px; line-height: 1.5; background: var(--bg); color: var(--text); }
h1, h2, h3 { margin: 0; text-wrap: balance; }
p { margin: 0; }
a { color: var(--primary); }
img { max-width: 100%; height: auto; }
:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }

.mono { font-family: var(--mono); font-size: .92em; }
.muted { color: var(--text-muted); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
html:not(.js) .hidden-nojs { display: none !important; }
```

- [ ] **Step 5: Stub page**

`src/pages/index.astro`:

```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout>
  <main id="main">code.wus-technik.com</main>
</Layout>
```

- [ ] **Step 6: Build and run the checks**

Run: `npm ci && npm run build && npm run check`
Expected: build succeeds; check exits 1 but **no longer** reports `html lang="en"`, `no noindex`, `canonical link`, `og:url`, `title`, `favicon.svg link`, `dist/favicon.svg exists`, `inline theme bootstrap…`, `same-origin …`, `no third-party assets`, `no overflow:hidden…`. Remaining failures are sections/nav/theme switch/content — Tasks 3 and 4.

- [ ] **Step 7: Commit**

```bash
git add -A src public/favicon.svg package.json package-lock.json
git commit -m "refactor: drop animated site, add app-shell layout and tokens

Claude-Session: https://claude.ai/code/session_016gyqMKdL25QWagoRggDJgv"
```

---

### Task 3: Shell — sidebar, topbar, footer, theme switch, scroll-spy

**Files:**
- Create: `src/components/Ext.astro`, `src/components/Sidebar.astro`, `src/components/Topbar.astro`, `src/components/Footer.astro`, `src/scripts/nav.js`
- Modify: `src/styles/global.css` (append), `src/pages/index.astro`

**Interfaces:**
- Consumes: `Layout` (Task 2), tokens and `.sr-only`/`.hidden-nojs` (Task 2).
- Produces:
  - `<Ext href="…">label</Ext>` — external link component, props `{ href: string; class?: string }`.
  - Page shell classes `.app`, `.side`, `.main-col`, `.topbar`, `.view`; nav links carry `data-spy` and `href="#<id>"`; Task 4 places cards inside `<div class="view">` with ids `about`, `team`, `claude-usage-tray`.
  - `nav.js` exports nothing; on load it wires `[data-theme-set]` buttons and spies `section[id]` inside `.view`.

- [ ] **Step 1: External link component**

`src/components/Ext.astro`:

```astro
---
interface Props { href: string; class?: string }
const { href, class: cls } = Astro.props;
---
<a href={href} class={cls} target="_blank" rel="noopener"><slot /><span aria-hidden="true"> ↗</span><span class="sr-only"> (opens in new tab)</span></a>
```

- [ ] **Step 2: Sidebar**

`src/components/Sidebar.astro`:

```astro
---
import Ext from './Ext.astro';
const icon = {
  building: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M2 21h20"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  gauge: '<path d="M12 14l4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
  github: '<path d="M9 19c-4 1.5-4-2-6-2.5m12 5v-3.5a3 3 0 0 0-1-2.3c3-.3 6-1.5 6-6.5a5 5 0 0 0-1.4-3.5 4.6 4.6 0 0 0-.1-3.5s-1.1-.3-3.6 1.4a12.4 12.4 0 0 0-6.6 0C5.8 2.1 4.7 2.4 4.7 2.4a4.6 4.6 0 0 0-.1 3.5A5 5 0 0 0 3.2 9.4c0 5 3 6.2 6 6.5a3 3 0 0 0-1 2.3V22"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
};
const svg = (p: string) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
---

<aside class="side">
  <a class="brand" href="#main">
    <span class="brand-mark" aria-hidden="true">W&amp;S</span>
    <span class="brand-txt">
      <span class="brand-name">code.wus-technik.com</span>
      <span class="brand-sub">Software at W&amp;S Technik</span>
    </span>
  </a>

  <nav class="side-nav" aria-label="Page">
    <div class="nav-group">Overview</div>
    <a class="nav-item" href="#about" data-spy><Fragment set:html={svg(icon.building)} /><span>About W&amp;S</span></a>
    <a class="nav-item" href="#team" data-spy><Fragment set:html={svg(icon.users)} /><span>Dev team</span></a>
    <div class="nav-group">Projects</div>
    <a class="nav-item" href="#claude-usage-tray" data-spy><Fragment set:html={svg(icon.gauge)} /><span>Claude Usage Tray</span><span class="nav-count" aria-hidden="true">1</span></a>
    <div class="nav-group nav-ext">Links</div>
    <Ext class="nav-item nav-ext" href="https://github.com/wus-technik"><Fragment set:html={svg(icon.github)} />GitHub</Ext>
    <Ext class="nav-item nav-ext" href="https://www.wus-technik.com"><Fragment set:html={svg(icon.globe)} />wus-technik.com</Ext>
  </nav>

  <div class="theme hidden-nojs" role="group" aria-label="Theme">
    <button type="button" data-theme-set="light" aria-pressed="false" aria-label="Light theme"><Fragment set:html={svg(icon.sun)} /><span class="theme-lbl">Light</span></button>
    <button type="button" data-theme-set="system" aria-pressed="true" aria-label="System theme"><Fragment set:html={svg(icon.monitor)} /><span class="theme-lbl">System</span></button>
    <button type="button" data-theme-set="dark" aria-pressed="false" aria-label="Dark theme"><Fragment set:html={svg(icon.moon)} /><span class="theme-lbl">Dark</span></button>
  </div>
</aside>
```

- [ ] **Step 3: Topbar**

`src/components/Topbar.astro`:

```astro
<header class="topbar">
  <h1 class="topbar-title">Open source from W&amp;S Technik</h1>
  <p class="topbar-sub">Tools our in-house dev team built for itself — and now shares.</p>
  <span class="chip acc topbar-right">1 public project</span>
</header>
```

- [ ] **Step 4: Footer**

`src/components/Footer.astro`:

```astro
---
import Ext from './Ext.astro';
const year = new Date().getFullYear();
---
<footer class="foot">
  <span>© {year} W&amp;S Technik GmbH</span>
  <Ext href="https://www.wus-technik.com/impressum/">Imprint</Ext>
  <Ext href="https://www.wus-technik.com/datenschutz/code.wus-technik.com">Privacy</Ext>
</footer>
```

- [ ] **Step 5: nav.js**

`src/scripts/nav.js`:

```js
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
```

- [ ] **Step 6: Shell CSS (append to `global.css`)**

```css
/* ── Shell ── */
.skip { position: absolute; left: 8px; top: -40px; z-index: 10; background: var(--primary); color: var(--on-primary); padding: 6px 10px; border-radius: var(--radius-sm); }
.skip:focus { top: 8px; }
.app { display: grid; grid-template-columns: 220px minmax(0, 1fr); min-height: 100vh; }

.side { position: sticky; top: 0; height: 100vh; overflow-y: auto; background: var(--nav-bg); color: var(--nav-fg); display: flex; flex-direction: column; gap: 2px; padding: 14px 10px; }
.brand { display: flex; align-items: center; gap: 10px; padding: 4px 8px 16px; color: inherit; text-decoration: none; }
.brand-mark { width: 30px; height: 30px; border-radius: 8px; background: var(--primary); color: var(--on-primary); display: grid; place-items: center; flex-shrink: 0; font-size: 10.5px; font-weight: 800; }
.brand-txt { display: flex; flex-direction: column; min-width: 0; }
.brand-name { font-weight: 800; font-size: 14px; letter-spacing: -.2px; }
.brand-sub { font-size: 11px; color: var(--nav-muted); line-height: 1.2; }
.side-nav { display: flex; flex-direction: column; gap: 2px; }
.nav-group { font-size: 10.5px; text-transform: uppercase; letter-spacing: .7px; color: var(--nav-muted); padding: 14px 10px 4px; font-weight: 700; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; color: var(--nav-fg); text-decoration: none; font-weight: 500; }
.nav-item:hover { background: var(--nav-hover); }
.nav-item.active { background: var(--nav-active); font-weight: 650; }
.nav-item svg { flex-shrink: 0; opacity: .85; }
.nav-count { margin-left: auto; background: var(--primary); color: var(--on-primary); font-size: 11px; font-weight: 700; border-radius: 10px; padding: 0 7px; min-width: 20px; text-align: center; }

.theme { margin-top: auto; display: flex; gap: 2px; padding: 3px; border: 1px solid var(--nav-active); border-radius: 8px; background: var(--nav-hover); }
.theme button { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px; border: 0; border-radius: 6px; padding: 5px 4px; background: transparent; color: var(--nav-muted); font: inherit; font-size: 11.5px; cursor: pointer; }
.theme button:hover { color: var(--nav-fg); }
.theme button[aria-pressed="true"] { background: var(--nav-active); color: var(--nav-fg); font-weight: 650; }

.main-col { display: flex; flex-direction: column; min-width: 0; }
.topbar { position: sticky; top: 0; z-index: 2; background: var(--surface); border-bottom: 1px solid var(--border); box-shadow: var(--shadow-sm); padding: 0 20px; min-height: 52px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.topbar-title { font-weight: 700; font-size: 15px; }
.topbar-sub { color: var(--text-muted); font-size: 12.5px; }
.topbar-right { margin-left: auto; }
.view { flex: 1; width: 100%; max-width: 1000px; padding: 20px; display: flex; flex-direction: column; gap: 18px; }
.view section[id] { scroll-margin-top: 68px; }

.foot { max-width: 1000px; width: 100%; padding: 6px 20px 28px; display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12.5px; color: var(--text-muted); }
.foot a { color: var(--text-muted); }

.chip { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text-muted); white-space: nowrap; }
.chip.ok { background: var(--success-bg); color: var(--success); border-color: var(--success-border); }
.chip.info { background: var(--info-bg); color: var(--info); border-color: var(--info-border); }
.chip.acc { background: var(--accent-bg); color: var(--accent); border-color: var(--accent-border); }
.chip.pri { background: var(--primary-light); color: var(--primary); border-color: var(--primary-border); }

/* ── Mobile: sidebar becomes a two-row sticky strip ── */
@media (max-width: 859px) {
  .app { grid-template-columns: 1fr; }
  .side { position: sticky; top: 0; z-index: 3; height: auto; overflow: visible; display: grid; grid-template-columns: 1fr auto; grid-template-areas: "brand theme" "nav nav"; align-items: center; gap: 6px; padding: 8px 12px; }
  .brand { grid-area: brand; padding: 0; }
  .brand-sub, .nav-group, .nav-count, .nav-ext, .theme-lbl { display: none; }
  .side-nav { grid-area: nav; flex-direction: row; overflow-x: auto; gap: 4px; }
  .nav-item { white-space: nowrap; padding: 6px 10px; }
  .theme { grid-area: theme; margin-top: 0; }
  .theme button { padding: 5px 7px; }
  .topbar { position: static; padding: 10px 16px; }
  .topbar-right { margin-left: 0; }
  .view { padding: 14px; }
  .view section[id] { scroll-margin-top: 104px; }
  .foot { padding: 6px 14px 24px; }
}
```

- [ ] **Step 7: Compose the page**

`src/pages/index.astro`:

```astro
---
import Layout from '../layouts/Layout.astro';
import Sidebar from '../components/Sidebar.astro';
import Topbar from '../components/Topbar.astro';
import Footer from '../components/Footer.astro';
---

<Layout>
  <a class="skip" href="#main">Skip to content</a>
  <div class="app">
    <Sidebar />
    <div class="main-col">
      <Topbar />
      <main class="view" id="main">
        <section id="about"><h2>About</h2></section>
        <section id="team"><h2>Team</h2></section>
        <section id="claude-usage-tray"><h2>Claude Usage Tray</h2></section>
      </main>
      <Footer />
    </div>
  </div>
</Layout>

<script>
  import '../scripts/nav.js';
</script>
```

The three `<section>` placeholders are replaced by real cards in Task 4.

- [ ] **Step 8: Build and check**

Run: `npm run build && npm run check`
Expected: remaining failures only `screenshot img with alt and size`, `dist/claude-usage-tray.png exists`, `installer link, same tab`, and the `link https://…` lines for `win_systray-claude-usage`, `/releases` (org, company, imprint and privacy links now pass).

- [ ] **Step 9: Manual smoke test**

Run: `npm run preview` and open the printed URL. Click Light / Dark / System: colours switch, reload keeps the choice, System follows the OS. Scroll: active nav item changes. Stop the server.

- [ ] **Step 10: Commit**

```bash
git add src
git commit -m "feat: app shell with sidebar, topbar, footer and theme switch

Claude-Session: https://claude.ai/code/session_016gyqMKdL25QWagoRggDJgv"
```

---

### Task 4: Content cards

**Files:**
- Create: `src/components/Card.astro`, `public/claude-usage-tray.png`
- Modify: `src/pages/index.astro`, `src/styles/global.css` (append)

**Interfaces:**
- Consumes: `Ext` (Task 3), `.chip` classes (Task 3), `.view section[id]` scroll-spy contract (Task 3).
- Produces: `<Card id title sub? tone>` with named slot `icon` and default slot body; `tone` ∈ `'p' | 'a' | 's' | 'n'`.

- [ ] **Step 1: Screenshot asset**

```bash
curl -sL -o public/claude-usage-tray.png https://raw.githubusercontent.com/wus-technik/win_systray-claude-usage/main/docs/screenshot-popup.png
node -e "const b=require('fs').readFileSync('public/claude-usage-tray.png');console.log(b.readUInt32BE(16),b.readUInt32BE(20))"
```

Expected output: `339 341`. If different, use the printed numbers for `width`/`height` in Step 3 **and** in `scripts/check-dist.mjs`.

- [ ] **Step 2: Card component**

`src/components/Card.astro`:

```astro
---
interface Props {
  id: string;
  title: string;
  sub?: string;
  tone?: 'p' | 'a' | 's' | 'n';
}
const { id, title, sub, tone = 'p' } = Astro.props;
---
<section id={id} class="card" aria-labelledby={`${id}-h`}>
  <div class="card-h">
    <span class={`card-ic ${tone}`} aria-hidden="true"><slot name="icon" /></span>
    <h2 id={`${id}-h`}>{title}</h2>
    {sub && <span class="sub">{sub}</span>}
  </div>
  <div class="card-b"><slot /></div>
</section>
```

- [ ] **Step 3: Page content**

Replace the `<main>` block in `src/pages/index.astro` and add the imports. Full file:

```astro
---
import Layout from '../layouts/Layout.astro';
import Sidebar from '../components/Sidebar.astro';
import Topbar from '../components/Topbar.astro';
import Footer from '../components/Footer.astro';
import Card from '../components/Card.astro';
import Ext from '../components/Ext.astro';

const svg = (p: string) => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ic = {
  building: svg('<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M2 21h20"/>'),
  users: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
  gauge: svg('<path d="M12 14l4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>'),
  download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
};

const features = [
  ['Two badge icons', 'Fill shows usage, colour shows severity, the digit names the window — 5 hours or 7 days.'],
  ['Per-model caps', 'Weekly limits scoped to a model or surface — the cap that usually bites first.'],
  ['Credit spend', 'Paid extra usage against your monthly limit, in your account’s currency.'],
  ['Reset countdowns', '“Resets in 3h 58m” on hover and in the popup.'],
  ['Pace marker & colours', 'A line shows where the clock is in the period; colour follows usage against the clock, not raw percent.'],
  ['Platform status', 'A warning badge appears while status.claude.com reports anything but “All Systems Operational”.'],
];
---

<Layout>
  <a class="skip" href="#main">Skip to content</a>
  <div class="app">
    <Sidebar />
    <div class="main-col">
      <Topbar />
      <main class="view" id="main">

        <Card id="about" title="W&S Technik GmbH" sub="Since 2007" tone="p">
          <Fragment slot="icon" set:html={ic.building} />
          <p class="lede">
            W&amp;S Technik is a service provider for railway infrastructure: we maintain
            signalling and safety systems, train specialist staff through the W&amp;S Academy
            and build custom training installations — Technik, Consulting and Services from
            one source.
          </p>
          <div class="fields">
            <div class="field"><span class="f-l">Founded</span><span class="f-v">2007</span></div>
            <div class="field"><span class="f-l">Employees</span><span class="f-v">100+</span></div>
            <div class="field"><span class="f-l">Headquarters</span><span class="f-v">Castrop-Rauxel</span></div>
            <div class="field"><span class="f-l">Branch</span><span class="f-v">Friedrichsdorf</span></div>
            <div class="field"><span class="f-l">Field</span><span class="f-v">Railway infrastructure</span></div>
          </div>
          <div class="row">
            <span class="chip pri">Technik</span>
            <span class="chip pri">Consulting</span>
            <span class="chip pri">Services</span>
            <Ext class="row-link" href="https://www.wus-technik.com">wus-technik.com</Ext>
          </div>
        </Card>

        <Card id="team" title="Dev team" sub="In-house software" tone="a">
          <Fragment slot="icon" set:html={ic.users} />
          <p class="lede">
            A small in-house team that builds the software W&amp;S colleagues use every day —
            internal platforms, automation and infrastructure. When a tool solves a problem
            others have too, we publish it under an open licence.
          </p>
          <div class="fields">
            <div class="field"><span class="f-l">GitHub</span><span class="f-v"><Ext href="https://github.com/wus-technik"><span class="mono">wus-technik</span></Ext></span></div>
            <div class="field"><span class="f-l">Public projects</span><span class="f-v">1 (MIT)</span></div>
            <div class="field"><span class="f-l">Focus</span><span class="f-v">Internal tools, DevOps, infrastructure</span></div>
          </div>
        </Card>

        <Card id="claude-usage-tray" title="Claude Usage Tray" sub="Windows tray app" tone="s">
          <Fragment slot="icon" set:html={ic.gauge} />
          <div class="project">
            <figure class="shot">
              <img src="/claude-usage-tray.png" width="339" height="341"
                alt="Claude Usage Tray popup showing the 5-hour and 7-day usage bars with reset countdowns, a per-model weekly cap and monthly credit spend" />
            </figure>
            <div class="project-body">
              <p class="tagline">Your Claude limits, always visible — right next to the clock.</p>
              <div class="row">
                <span class="chip ok">MIT</span>
                <span class="chip">Windows 10/11 x64</span>
                <span class="chip">.NET 10</span>
                <span class="chip info">No admin</span>
                <span class="chip info">Auto-update</span>
              </div>
              <p>
                Claude Code tells you that you hit a limit <em>after</em> you hit it. This sits in
                your tray and tells you it’s coming — the rolling windows, the per-model weekly
                cap that throttles first, and how much paid credit you’ve burned this month.
              </p>
              <div class="section-label">What you get</div>
              <ul class="features">
                {features.map(([t, d]) => <li><b>{t}</b><span>{d}</span></li>)}
              </ul>
              <div class="actions">
                <a class="btn btn-primary" href="https://github.com/wus-technik/win_systray-claude-usage/releases/download/setup-stub/ClaudeUsageTraySetup.exe"><Fragment set:html={ic.download} />Download installer</a>
                <Ext class="btn btn-ghost" href="https://github.com/wus-technik/win_systray-claude-usage">View on GitHub</Ext>
                <Ext class="btn-link" href="https://github.com/wus-technik/win_systray-claude-usage/releases">All releases</Ext>
              </div>
              <p class="muted small">Per-user install, nothing written outside your profile. Polls Anthropic’s usage API every 5 minutes and falls back to Claude Code’s local cache.</p>
            </div>
          </div>
        </Card>

      </main>
      <Footer />
    </div>
  </div>
</Layout>

<script>
  import '../scripts/nav.js';
</script>
```

- [ ] **Step 4: Card and content CSS (append to `global.css`)**

```css
/* ── Cards ── */
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-sm); overflow: hidden; }
.card-h { padding: 10px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; background: var(--surface-2); }
.card-h h2 { font-size: 14px; font-weight: 700; }
.card-h .sub { font-size: 11.5px; color: var(--text-muted); margin-left: auto; text-align: right; }
.card-ic { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.card-ic.p { background: var(--primary-light); color: var(--primary); }
.card-ic.a { background: var(--accent-bg); color: var(--accent); }
.card-ic.s { background: var(--success-bg); color: var(--success); }
.card-ic.n { background: var(--surface-3); color: var(--text-muted); }
.card-b { padding: 16px; display: flex; flex-direction: column; gap: 14px; font-size: 15px; }
.lede { max-width: 72ch; }

.fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px 18px; }
.field { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.f-l { font-size: 10.5px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .4px; }
.f-v { font-size: 13.5px; font-weight: 500; overflow-wrap: anywhere; }
.section-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .6px; }
.row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.row-link { margin-left: auto; font-size: 13px; font-weight: 600; }
.small { font-size: 12.5px; }

.project { display: grid; grid-template-columns: 339px minmax(0, 1fr); gap: 22px; align-items: start; }
.shot { margin: 0; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface-2); padding: 0; overflow: hidden; }
.shot img { display: block; }
.project-body { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.tagline { font-size: 17px; font-weight: 700; }
.features { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.features li { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; background: var(--surface-2); }
.features b { font-size: 13.5px; }
.features span { font-size: 12.5px; color: var(--text-muted); }

.actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.btn { padding: 8px 16px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; border: 1.5px solid transparent; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; white-space: nowrap; transition: background .15s, border-color .15s, color .15s; }
.btn-primary { background: var(--primary); color: var(--on-primary); }
.btn-primary:hover { background: var(--primary-hover); }
.btn-ghost { border-color: var(--border-strong); color: var(--text); }
.btn-ghost:hover { border-color: var(--text-muted); background: var(--surface-2); }
.btn-link { font-size: 13px; font-weight: 600; }

@media (max-width: 859px) {
  .project { grid-template-columns: 1fr; }
  .shot { justify-self: center; max-width: 339px; }
  .card-b { font-size: 14.5px; }
}
```

- [ ] **Step 5: Build and check**

Run: `npm run build && npm run check`
Expected: `check-dist: all checks passed`, exit 0.

- [ ] **Step 6: Commit**

```bash
git add src public/claude-usage-tray.png
git commit -m "feat: W&S, dev team and Claude Usage Tray cards

Claude-Session: https://claude.ai/code/session_016gyqMKdL25QWagoRggDJgv"
```

---

### Task 5: Verification, link check, release notes

**Files:**
- Create: `scripts/check-links.mjs`
- Modify: `package.json` (version `0.3.0`, script `check:links`), `CHANGELOG.md`

**Interfaces:**
- Consumes: built `dist/` from Task 4.
- Produces: screenshots in the session scratchpad for the user; version bump.

- [ ] **Step 1: Link checker**

`scripts/check-links.mjs`:

```js
// scripts/check-links.mjs — final HTTP status of every external link in dist/index.html.
import { readFileSync } from 'node:fs';

const KNOWN_PENDING = new Set(['https://www.wus-technik.com/datenschutz/code.wus-technik.com']);
const html = readFileSync('dist/index.html', 'utf8');
const urls = [...new Set([...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(m => m[1]))]
  .filter(u => !u.startsWith('https://code.wus-technik.com/'));

let bad = 0;
for (const u of urls) {
  let status;
  try {
    const r = await fetch(u, { method: 'GET', redirect: 'follow' });
    status = r.status;
    await r.body?.cancel();
  } catch (e) { status = `ERR ${e.message}`; }
  const ok = status === 200;
  const pending = !ok && KNOWN_PENDING.has(u);
  console.log(`${ok ? 'OK  ' : pending ? 'PEND' : 'FAIL'} ${status} ${u}`);
  if (!ok && !pending) bad++;
}
process.exit(bad ? 1 : 0);
```

Add to `package.json` scripts: `"check:links": "node scripts/check-links.mjs"`.

Run: `npm run check:links`
Expected: every line `OK   200`, except `PEND 404 https://www.wus-technik.com/datenschutz/code.wus-technik.com`; exit 0.

- [ ] **Step 2: Version and changelog**

`package.json`: `"version": "0.3.0"`.

`CHANGELOG.md`, directly below `## [Unreleased]`:

```markdown
## [0.3.0] — 2026-10-13

### Changed

- **Complete redesign** as a single English page in the app-shell style of the W&S
  Claude mockups: dark sidebar navigation, topbar, cards on a grey canvas, light/dark/system
  theme switch. Content: W&S Technik GmbH, the in-house dev team, and the first public
  project, [Claude Usage Tray](https://github.com/wus-technik/win_systray-claude-usage).
- The site is now indexable (removed `noindex, nofollow`), with canonical URL and OG tags.

### Removed

- GSAP animations, globe, PCB circuit trace, section navigation, custom scroll controller,
  back-to-top button, and the self-hosted fonts (`gsap`, `@fontsource/*`). The previous
  site is preserved on branch `test-01`.
```

- [ ] **Step 3: Full verification**

Run: `npm ci && npm run build && npm run check && npm run check:links`
Expected: all pass as above.

- [ ] **Step 4: Screenshots**

Serve `dist/` with `npm run preview` (background), then with headless Edge
(`"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --hide-scrollbars`)
capture into the session scratchpad:

| File | Flags / URL |
|---|---|
| `light-1440.png` | `--window-size=1440,900 http://localhost:4321/` |
| `dark-1440.png` | `--window-size=1440,900 --force-dark-mode --enable-features=WebContentsForceDark:inversion_method/cielab_based/image_behavior/none http://localhost:4321/` — if Edge ignores `prefers-color-scheme` with these flags, use `--blink-settings=preferredColorScheme=0` instead |
| `short-1366x650.png` | `--window-size=1366,650 http://localhost:4321/` — theme switch must be visible or reachable |
| `mobile-390.png` | `--window-size=390,844 http://localhost:4321/#claude-usage-tray` — card heading not hidden under the strip |
| `nojs-1440.png` | `--window-size=1440,900 --blink-settings=scriptEnabled=false http://localhost:4321/` — no theme switch visible, content complete |

Inspect each image; fix any layout defect found (and re-run Step 3) before continuing. Stop the preview server.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-links.mjs package.json CHANGELOG.md
git commit -m "chore: release 0.3.0 — link check and changelog

Claude-Session: https://claude.ai/code/session_016gyqMKdL25QWagoRggDJgv"
```

- [ ] **Step 6: Hand back**

Show the user the five screenshots and the check output. Do **not** push; pushing `main` deploys to code.wus-technik.com and is the user's call.
