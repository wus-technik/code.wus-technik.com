# code.wus-technik.com

The open-source landing page of W&S Technik GmbH's in-house dev team: one English page that
introduces the company and the team and lists our public projects.

**Live:** <https://code.wus-technik.com/>

## How it works

There is no build. `site/` holds the page exactly as it is served, and every push to `main`
publishes it to GitHub Pages.

```
site/
  index.html             the page — all content lives here
  styles.css             design tokens (light/dark) and all styles
  nav.js                 theme switch (Light / System / Dark), scroll-spy, footer year
  spy.js                 pure function that picks the active nav item (unit-tested)
  favicon.svg            W&S logo on a white square
  claude-usage-tray.png  project screenshot
  CNAME, .nojekyll       GitHub Pages: custom domain, no Jekyll processing
scripts/
  check-site.mjs         assertions on site/ — run before every deploy
  test-spy.mjs           unit tests for spy.js
  check-links.mjs        final HTTP status of every external link
  serve.mjs              local preview server
```

Nothing needs installing — only Node.js 20 or newer, for the scripts. `package.json` holds
scripts and no dependencies.

| Command | What it does |
|---|---|
| `npm run preview` | Serve `site/` on <http://localhost:4321/> |
| `npm test` | Unit tests for the scroll-spy |
| `npm run check` | Structure, SEO, accessibility and contrast checks on the page, plus a guard that no build tooling or dependency returns |
| `npm run check:links` | Fetch every external link; all must end on 200 (the privacy page is allowed to 404 until it is published) |

## Editing the page

Edit the files in `site/` directly, preview, run the checks, commit to `main`.

Conventions the checks enforce:

- **No third-party requests.** No web fonts, analytics, badges, avatars or embeds — every
  `src` and stylesheet is same-origin.
- **External links** open in a new tab: `target="_blank" rel="noopener"`, a visible `↗` and a
  visually hidden `(opens in new tab)`. Copy an existing link. The installer download is the
  one exception and opens in the same tab.
- **No hard-coded release versions** on the page; link to the releases instead.
- **Colour contrast** of pills and muted text must reach WCAG AA (4.5:1) in the light theme.
- **The page works without JavaScript.** The theme switch is hidden then (`hidden-nojs`), and
  the theme follows the OS.

### Adding a project

1. Copy one of the project `<section class="card">` blocks in `site/index.html`, give it a
   new `id`, and update the heading's `id` and the section's `aria-labelledby`.
2. Add a nav item in the sidebar with `href="#<id>"` and `data-spy`.
3. Update the counts: the badge next to *Projects* in the sidebar, the topbar pill
   (*N public projects*) and *Public projects* in the Dev team card.
4. Add the new links to the list in `scripts/check-site.mjs` and the section id to its
   structure check, then run `npm run check` and `npm run check:links`.
5. Add a line to `CHANGELOG.md`.

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main`: it checks out the repo, runs
`test-spy.mjs` and `check-site.mjs`, and publishes `site/` to the `gh-pages` branch. A failing
check stops the deploy.

GitHub Pages must be set to **Deploy from a branch → `gh-pages` / (root)**. With the source set
to *GitHub Actions*, the workflow still reports success, but nothing goes live. After a
release, check the live page, not just the run.

GitHub Pages caches files for about ten minutes and the file names carry no hash, so a deploy
can take that long to reach every visitor.

## Releases

Versions are tagged on `main` (`v0.3.1`, …) and described in [CHANGELOG.md](CHANGELOG.md).

## Background

The design and the decisions behind the page are in
[`docs/superpowers/specs/`](docs/superpowers/specs/), and the implementation plan in
[`docs/superpowers/plans/`](docs/superpowers/plans/). Those documents describe the original
Astro build, which was removed in 0.3.1; the page itself is unchanged.
