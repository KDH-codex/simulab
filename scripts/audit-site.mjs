// Static inventory only. This does not verify rendering, indexation or formulas.
import { readdir, readFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const pages = [];
for (const entry of await readdir(new URL('tools/', root), {withFileTypes:true})) {
  if (!entry.isDirectory() || entry.name === 'admin-dashboard') continue;
  const file = 'tools/' + entry.name + '/index.html';
  try {
    const html = await readFile(new URL(file, root),'utf8');
    pages.push({file,
      h1Count:(html.match(/<h1\b/gi)||[]).length,
      canonical:/<link\b[^>]*rel=["']canonical["']/i.test(html),
      description:/<meta\b[^>]*name=["']description["']/i.test(html),
      jsonLd:/application\/ld\+json/.test(html),
      zoomDisabled:/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?[",\s]/i.test(html),
      tailwindCdn:/cdn\.tailwindcss\.com/.test(html),
      trackerScript:/<script[^>]+src=["'][^"']*tracker\.js/.test(html)
    });
  } catch(error) { if(error.code !== 'ENOENT') throw error; }
}
const count = key => pages.filter(p=>p[key]).length;
console.log(JSON.stringify({publicToolPages:pages.length,withCanonical:count('canonical'),withDescription:count('description'),withJsonLd:count('jsonLd'),zoomDisabled:count('zoomDisabled'),tailwindCdn:count('tailwindCdn'),explicitTracker:count('trackerScript'),incorrectH1:pages.filter(p=>p.h1Count!==1).map(p=>p.file)},null,2));
