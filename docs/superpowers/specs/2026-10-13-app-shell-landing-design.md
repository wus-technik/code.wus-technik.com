# code.wus-technik.com — App-shell one-pager (v0.3.0)

Date: 2026-10-13 · Status: approved in chat, awaiting spec review

## Goal

Replace the current animated landing page (preserved on branch `test-01`) with a single,
quiet page in the style of the Claude-generated app mockups used at W&S — reference:
`decision-platform/mockup-jaguar-app.html`. The page introduces W&S Technik and its
in-house dev team and presents the first public project,
[Claude Usage Tray](https://github.com/wus-technik/win_systray-claude-usage).

Audience: GitHub and Claude users outside W&S. Language: **English** (`lang="en"`).

Success: one page, builds with `npm run build`, deploys unchanged via the existing
gh-pages workflow, reads well in light, dark and on mobile, every external link resolves.

## Stack

- Astro (existing major), static output, plain CSS in `src/styles/global.css`.
- Remove dependencies `gsap`, `@fontsource/*` via `npm uninstall` so `package-lock.json`
  stays in sync (CI runs `npm ci`). Delete all existing files in `src/components/` and
  `src/scripts/`, then create the files listed under *Files*. System font stack
  (`-apple-system, Segoe UI, Roboto, …`) and `ui-monospace, Cascadia Mono, Consolas` for
  mono, as in the reference.
- **No third-party requests** from the page: no web fonts, analytics, shields.io badges,
  GitHub avatars or embeds. All assets are served from `code.wus-technik.com`.
- Keep `.github/workflows/deploy.yml`, `public/CNAME`, `public/.nojekyll` untouched.
  `public/CNAME` is the one that reaches `dist/`; the root `CNAME` is left as is.
- Bump `package.json` version to `0.3.0`, add a CHANGELOG entry.

## Visual language (from the reference)

Design tokens copied from the mockup: `--bg #f0f2f5`, `--surface #fff`, `--border #e2e6ea`,
`--text #1a1d23`, `--text-muted #6b7380`, `--primary #2563eb`, success/warning/accent/info
pill colours, `--nav-bg #161b24`, radius 8px, `--shadow-sm`; dark palette under
`prefers-color-scheme: dark` and `:root[data-theme="dark"]`, light override via
`[data-theme="light"]`. Base font 13.5px/1.5 for UI chrome, slightly larger (15px) for
card prose. Uppercase 10.5–11px labels with letter-spacing for nav groups and
label/value grids. Pills: rounded, 1px border, tinted background.

Deviations from the reference:
- Only tokens and component styles are taken over, **not the shell scroll model**: the
  mockup sets `html, body { height: 100% }` and `body { overflow: hidden }` with an inner
  scrolling pane. Here the document scrolls normally so anchors and scroll-spy work.
- `--text-muted` is darkened to `#5f6775` (light theme) so muted text passes WCAG AA on
  `--bg` as well as on cards. `--text-light` is not used for meaningful text.

## Layout

```
┌──────────────┬──────────────────────────────────────────────┐
│ [W&S] brand  │ Topbar: title · subtitle         [pill]      │
│              ├──────────────────────────────────────────────┤
│ OVERVIEW     │  ┌ Card: W&S Technik GmbH ────────────────┐  │
│  About W&S   │  └────────────────────────────────────────┘  │
│  Dev team    │  ┌ Card: Dev team ────────────────────────┐  │
│ PROJECTS     │  └────────────────────────────────────────┘  │
│  Claude Usage│  ┌ Card: Claude Usage Tray (large) ───────┐  │
│  Tray    (1) │  │ screenshot | pills, features, buttons  │  │
│ LINKS        │  └────────────────────────────────────────┘  │
│  GitHub ↗    │  Footer: © · Imprint · Privacy               │
│  wus-technik↗│                                              │
│ ─────────    │                                              │
│ theme switch │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

- **Sidebar** (220px, `--nav-bg`, `position: sticky; top: 0; height: 100vh;
  overflow-y: auto` so the bottom stays reachable on short windows): brand mark (30px
  rounded square, `--primary`, "W&S"), name "code.wus-technik.com", sub "Software at W&S
  Technik". Groups *Overview* (About W&S, Dev team), *Projects* (Claude Usage Tray with
  count badge `1`), *Links* (GitHub org `https://github.com/wus-technik` ↗,
  `https://www.wus-technik.com` ↗). Bottom: theme switch.
- **Theme switch**: a labelled group (`role="group"`, `aria-label="Theme"`) of three
  native `<button>`s Light / System / Dark with `aria-pressed`. Choice persisted in
  `localStorage` key `theme`. A `<script is:inline>` in `<head>` (Astro would otherwise
  bundle and defer it) reads the key inside `try/catch`, sets `data-theme="light|dark"` on
  `<html>` or leaves it unset for System, and adds class `js` to `<html>`. The switch is
  hidden unless `html.js` is present — without JS the page simply follows the OS theme.
- **Active nav item** follows scroll: small `IntersectionObserver` script toggles
  `.active` and `aria-current`. Without JS the links still work as anchors.
- **Topbar**: title "Open source from W&S Technik", subtitle "Tools our in-house dev team
  built for itself — and now shares.", right-hand pill "1 public project" (accent style).
- **Canvas**: `--bg`, content column max ~1000px, cards with 16–20px gap.
- **Mobile (< 860px)**: the sidebar becomes a sticky top strip in two rows — row 1: brand
  mark + name left, theme switch (icon-only buttons with `aria-label`) right; row 2: the
  three in-page links as a horizontally scrollable row. Group labels, count badge and the
  external *Links* group are hidden there (both external links also appear in the cards
  and footer). Topbar and cards stack in one column below.

## Content

### Card 1 — W&S Technik GmbH (`#about`)

Header: icon + "W&S Technik GmbH", right "Since 2007".
Prose: W&S Technik is a service provider for railway infrastructure — maintaining
signalling and safety systems, training specialist staff through the W&S Academy, and
building custom training installations. Services come from one source across Technik,
Consulting and Services.
Label/value grid: FOUNDED 2007 · EMPLOYEES 100+ · HEADQUARTERS Castrop-Rauxel ·
BRANCH Friedrichsdorf · FIELD Railway infrastructure.
Pills: Technik, Consulting, Services. Link: "wus-technik.com ↗".

### Card 2 — Dev team (`#team`)

Prose: a small in-house team that builds the software W&S colleagues use every day —
internal platforms, automation, infrastructure. When a tool solves a problem others have
too, we publish it under an open licence. Label/value grid: GITHUB `wus-technik` ·
PUBLIC PROJECTS 1 (MIT) · FOCUS Internal tools, DevOps, infrastructure.

### Card 3 — Claude Usage Tray (`#claude-usage-tray`)

Header: icon + "Claude Usage Tray", subtitle "Your Claude limits, always visible — right
next to the clock." Pills: MIT · Windows 10/11 x64 · .NET 10 · No admin · Auto-update.
Two columns (stack on mobile): left the popup screenshot
(`public/claude-usage-tray.png`, copied from the repo's `docs/screenshot-popup.png`, with
explicit `width`/`height` and alt text "Claude Usage Tray popup showing the 5-hour and
7-day usage bars with reset countdowns, a per-model weekly cap and monthly credit
spend"); right a short "Why" paragraph and a feature grid of six items:
two badge icons (5h / 7d), per-model weekly caps, credit spend, reset countdowns,
pace marker and pace colours, platform status banner.
Actions: primary **Download installer** →
`https://github.com/wus-technik/win_systray-claude-usage/releases/download/setup-stub/ClaudeUsageTraySetup.exe`;
secondary **View on GitHub** → `https://github.com/wus-technik/win_systray-claude-usage`;
tertiary text link **All releases** →
`https://github.com/wus-technik/win_systray-claude-usage/releases`.
No hard-coded version number.

### Footer

"© {year} W&S Technik GmbH" · Imprint → `https://www.wus-technik.com/impressum/` ·
Privacy → `https://www.wus-technik.com/datenschutz/code.wus-technik.com` (a
subdomain-specific policy covering the GitHub Pages hosting; that page does not exist yet
— as of 2026-10-13 it returns 404 and is created separately on wus-technik.com).

## Head / SEO

- Remove the current `<meta name="robots" content="noindex, nofollow">` — the site is
  meant to be found.
- `<title>`: "W&S Technik · Open source — Claude Usage Tray".
- `description`: "Open-source tools from the in-house dev team of W&S Technik GmbH,
  starting with Claude Usage Tray — your Claude limits in the Windows tray."
- `<link rel="canonical">` and `og:url`: `https://code.wus-technik.com/`; `og:title`,
  `og:description`, `og:type=website`; no `og:image`.
- Favicon: replaced by an SVG of the blue W&S brand mark (`public/favicon.svg`).

## Files

- `src/layouts/Layout.astro` — html shell, head/SEO, inline theme bootstrap.
- `src/components/Sidebar.astro`, `Topbar.astro`, `Card.astro` (header slot + body),
  `Footer.astro`.
- `src/pages/index.astro` — composes the three cards.
- `src/scripts/nav.js` — scroll-spy and theme switch.
- `src/styles/global.css` — tokens and all styles.
- `public/claude-usage-tray.png`, `public/favicon.svg`.
- `package.json`, `package-lock.json` (dependency removal, version bump), `CHANGELOG.md`.

## Accessibility

Landmarks (`nav`, `header`, `main`, `footer`), visible `:focus-visible`, skip link to
main, contrast per the adjusted palette, `prefers-reduced-motion` respected for smooth
scrolling. External links open in a new tab (`target="_blank" rel="noopener"`), are
marked ↗ and carry a visually hidden "(opens in new tab)". The installer download link
opens in the same tab.

## Verification

1. `npm ci && npm run build` passes with no warnings about missing assets.
2. Headless Edge screenshots of `dist/` at 1440×900 light, 1440×900 dark, 390×844 mobile —
   reviewed with the user.
3. Every external link in the built HTML: `curl -sIL -o /dev/null -w '%{http_code}'`
   reports a **final** status of 200 (GitHub release links redirect first).
   Known exception until it is published: the privacy URL (404 on 2026-10-13) — report it,
   don't block on it.
4. The built HTML contains no `noindex` and no third-party `src=`/stylesheet URLs.

## Out of scope

Bilingual content, analytics, a blog or more pages, automatic release-version fetching.
