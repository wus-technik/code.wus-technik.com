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
