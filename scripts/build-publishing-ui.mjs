import {readdir,readFile} from 'node:fs/promises';
import {writeFile} from './write-public-file.mjs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url), scope = {};
vm.runInNewContext(await readFile(new URL('assets/js/core-ui.js', root), 'utf8'), scope);
const {buildToolNoticeHtml, buildSmartDisclaimerHtml} = scope.SimuLab;
const check = process.argv.includes('--check');
const familyCategories=JSON.parse(await readFile(new URL('data/family-info/schedule.json',root),'utf8')).categories;
const familyPages=['family-info-calendar',...familyCategories.filter(c=>!['brand-sales','festivals'].includes(c.id)).map(c=>c.id)];
const block = (name, html) => `<!-- GENERATED:${name}:START -->\n${html}\n<!-- GENERATED:${name}:END -->`;

async function update(file, transform) {
  const url = new URL(file, root), current = await readFile(url, 'utf8');
  const clean = current.replace(/\r\n/g, '\n').replace(/[ \t]*<!-- GENERATED:(USE-NOTICE|DISCLAIMER|AD-PLACEMENT):START -->[\s\S]*?<!-- GENERATED:\1:END -->[ \t]*\n?/g, '');
  const next = transform(clean).replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
  if (check && current !== next) {
    const index = [...current].findIndex((char, i) => char !== next[i]);
    throw new Error('Publishing UI needs rebuilding: ' + file + '\n' + JSON.stringify({current:current.slice(index-35,index+100),expected:next.slice(index-35,index+100)}));
  }
  if (!check && current !== next) await writeFile(url, next);
}

await update('index.html', html => html);

let count = 0;
for (const entry of await readdir(new URL('tools/', root), {withFileTypes:true})) {
  if (!entry.isDirectory() || entry.name === 'admin-dashboard') continue;
  const name = entry.name;
  await update(`tools/${name}/index.html`, html => {
    // Retire the old dummy AdSense units. "auto" was not a real ad unit ID.
    html = html.replace(/<(div|aside)\b[^>]*class=["'](?:ad-slot|ad-slot-wrapper)["'][^>]*>[\s\S]*?<\/\1>\s*/g, '');
    html = html.replace(/<(div|section)\b[^>]*id=["'](?:legal-disclaimer|disclaimer-container)["'][^>]*>\s*<\/\1>\s*/g, '');
    if (/data-ad-slot|id=["'](?:legal-disclaimer|disclaimer-container)["']/.test(html)) throw new Error('Unexpected legacy container: ' + name);
    const notice = block('USE-NOTICE', buildToolNoticeHtml(name));
    const title = /<h1\b[^>]*>[\s\S]*?<\/h1>(?:\s*<p\b[^>]*>[\s\S]*?<\/p>)?/;
    if (familyPages.includes(name)) {
      if (!html.includes('<div id="family-notice-anchor"></div>')) throw new Error('Missing family notice anchor');
      html = html.replace('<div id="family-notice-anchor"></div>', '<div id="family-notice-anchor"></div>\n' + notice);
    } else if (name === 'kids-outing-calendar') {
      if (!html.includes('<section id="event-finder"')) throw new Error('Missing calendar notice anchor');
      html = html.replace('<section id="event-finder"', notice + '\n    <section id="event-finder"');
    } else if (['working-parents-guide','pay-work-guide','living-cost-guide'].includes(name)) {
      if (!html.includes('<div id="guide-notice-anchor"></div>')) throw new Error('Missing guide notice anchor');
      html = html.replace('<div id="guide-notice-anchor"></div>', '<div id="guide-notice-anchor"></div>\n' + notice);
    } else if (name === 'parenting-deals') {
      if (!html.includes('<div id="sale-notice-anchor"></div>')) throw new Error('Missing sale notice anchor');
      html = html.replace('<div id="sale-notice-anchor"></div>', '<div id="sale-notice-anchor"></div>\n' + notice);
    } else {
      if (!title.test(html)) throw new Error('Missing page title: ' + name);
      html = html.replace(title, match => match + '\n    ' + notice + '\n\n');
    }
    const disclaimer = block('DISCLAIMER', '<aside id="legal-disclaimer" class="legal-disclaimer-box" data-notice-version="1" aria-label="이용 범위와 면책고지">' + buildSmartDisclaimerHtml(name, '../../') + '</aside>');
    html = html.replace('</main>', '\n\n  ' + disclaimer + '\n  </main>');
    return html;
  });
  count++;
}
console.log(`Publishing UI ${check ? 'checked' : 'built'}: ${count} tool notices; empty advertisement placeholders removed.`);
