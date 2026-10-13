// scripts/check-site.mjs — assertions on the static page in site/ and on the repo having no build step.
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const file = 'site/index.html';
if (!existsSync(file)) {
  console.error(`FAIL: ${file} missing`);
  process.exit(1);
}
const html = readFileSync(file, 'utf8');
const cssDir = 'site';
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
check(has('<title>W&amp;S Technik · Open source</title>') ||
      has('<title>W&S Technik · Open source</title>'), 'title');
check(has('href="/favicon.svg"'), 'favicon.svg link');
check(existsSync('site/favicon.svg'), 'site/favicon.svg exists');

// Company logo (from wus-technik.com): inline in the sidebar brand, and as the favicon
const LOGO_PATH = 'M295.9,73.59l-17.64,66.6';
check(/<svg[^>]*class="brand-logo"[^>]*>[\s\S]*?M295\.9,73\.59l-17\.64,66\.6/.test(html), 'W&S logo inline in sidebar brand');
check(existsSync('site/favicon.svg') && readFileSync('site/favicon.svg', 'utf8').includes(LOGO_PATH), 'favicon uses the W&S logo');

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
for (const id of ['about', 'team', 'claude-usage-tray', 'meshcentral-agent']) {
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

// Contrast: light-theme pill text on its tint must reach WCAG AA (4.5:1) — first token match is the light :root.
const token = n => allCss.match(new RegExp(`--${n}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1];
const lum = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
for (const [fg, bg] of [['success', 'success-bg'], ['primary', 'primary-light'], ['accent', 'accent-bg'], ['info', 'info-bg'], ['text-muted', 'bg']]) {
  const [f, b] = [token(fg), token(bg)];
  check(f && b && ratio(f, b) >= 4.5, `contrast --${fg} on --${bg} ≥ 4.5 (${f} on ${b}: ${f && b ? ratio(f, b).toFixed(2) : '?'})`);
}

// Content
const img = html.match(/<img[^>]+claude-usage-tray\.png[^>]*>/)?.[0] ?? '';
check(img && /alt="Claude Usage Tray popup[^"]+"/.test(img) && /width="339"/.test(img) && /height="341"/.test(img), 'screenshot img with alt and size');
check(has('2 public projects') && />Public projects<\/span><span class="f-v">2 \(MIT\)/.test(html), 'project count is 2 (topbar and dev team card)');
check(/<pre class="code"><code>services:\r?\n  meshcentral-agent:\r?\n/.test(html), 'meshcentral quick-start compose snippet with preserved line breaks');
check(existsSync('site/claude-usage-tray.png'), 'site/claude-usage-tray.png exists');
const dl = 'https://github.com/wus-technik/win_systray-claude-usage/releases/download/setup-stub/ClaudeUsageTraySetup.exe';
const dlTag = html.match(new RegExp(`<a[^>]+href="${dl.replace(/[.\/]/g, '\\$&')}"[^>]*>`))?.[0] ?? '';
check(dlTag && !dlTag.includes('target='), 'installer link, same tab');
for (const u of [
  'https://github.com/wus-technik',
  'https://www.wus-technik.com',
  'https://github.com/wus-technik/win_systray-claude-usage',
  'https://github.com/wus-technik/win_systray-claude-usage/releases',
  'https://github.com/wus-technik/docker-meshcentral-agent',
  'https://github.com/wus-technik/docker-meshcentral-agent/pkgs/container/docker-meshcentral-agent',
  'https://github.com/wus-technik/docker-meshcentral-agent/releases',
  'https://www.wus-technik.com/impressum/',
  'https://www.wus-technik.com/datenschutz/code.wus-technik.com',
]) check(has(`href="${u}"`), `link ${u}`);
check(!/v\d+\.\d+\.\d+/.test(html.replace(/<head>[\s\S]*<\/head>/, '')), 'no hard-coded version number');

// External links open in new tab with rel=noopener
const ext = [...html.matchAll(/<a[^>]+href="https?:\/\/[^"]+"[^>]*>/g)].map(m => m[0]).filter(a => !a.includes(dl));
for (const a of ext) check(a.includes('target="_blank"') && a.includes('rel="noopener"'), `external link attrs: ${a}`);

// No build step: the page is served as committed, with nothing to install or audit
check(has('<script type="module" src="/nav.js"></script>'), 'nav.js loaded as a same-origin module');
for (const f of ['site/nav.js', 'site/spy.js', 'site/.nojekyll']) check(existsSync(f), `${f} exists`);
check(existsSync('site/CNAME') && readFileSync('site/CNAME', 'utf8').trim() === 'code.wus-technik.com', 'site/CNAME is code.wus-technik.com');
for (const f of ['package-lock.json', 'astro.config.mjs', 'tsconfig.json', 'src', 'public']) check(!existsSync(f), `${f} is gone`);
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
check(!pkg.dependencies && !pkg.devDependencies, 'package.json has no dependencies');
const wf = readFileSync('.github/workflows/deploy.yml', 'utf8').replace(/^\s*#.*$/gm, '');
check(!/setup-node|npm (ci|install|run build)|ubuntu-latest/.test(wf), 'workflow: no setup-node, no install/build, pinned runner');
check(wf.includes('actions/checkout@v7') && /folder:\s*site\b/.test(wf), 'workflow: checkout@v7, deploys site/');

if (failures.length) {
  for (const f of failures) console.error(`FAIL: ${f}`);
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('check-site: all checks passed');
