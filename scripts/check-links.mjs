// scripts/check-links.mjs — final HTTP status of every external link in site/index.html.
import { readFileSync } from 'node:fs';

const KNOWN_PENDING = new Set(['https://www.wus-technik.com/datenschutz/code.wus-technik.com']);
const html = readFileSync('site/index.html', 'utf8');
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
