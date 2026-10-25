import {readdir, readFile, writeFile} from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url), scope = {};
vm.runInNewContext(await readFile(new URL('assets/js/core-ui.js', root), 'utf8'), scope);
const {buildToolNoticeHtml, buildSmartDisclaimerHtml} = scope.SimuLab;
const check = process.argv.includes('--check');
const block = (name, html) => `<!-- GENERATED:${name}:START -->\n${html}\n<!-- GENERATED:${name}:END -->`;
const advertisement = block('AD-PLACEMENT', '<aside class="ad-placement" aria-label="광고 게재 준비 영역" data-ad-state="pending"><span class="ad-placement-label">광고</span><p>광고 게재 준비 중</p></aside>');

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

await update('index.html', html => {
  if (!html.includes('<section class="weekend-section"')) throw new Error('Missing home ad placement anchor');
  return html.replace('<section class="weekend-section"', advertisement + '\n<section class="weekend-section"');
});

let count = 0, adCount = 1;
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
    if (name === 'kids-outing-calendar') {
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
    if (['alcohol-widmark-calc','game-tetris'].includes(name)) return html;
    adCount++;
    if (name === 'kids-outing-calendar') html = html.replace(/<section\b[^>]*id="source-policy"[^>]*>/, match => advertisement + '\n    ' + match);
    else if (name === 'parenting-deals') html = html.replace(/([ \t]*)<section id="publishing-policy"/, (_, indent) => indent + advertisement + '\n' + indent + '<section id="publishing-policy"');
    else if (['working-parents-guide','pay-work-guide','living-cost-guide'].includes(name)) html = html.replace('<section id="guide-source-policy"', advertisement + '\n<section id="guide-source-policy"');
    else if (/<article\b/.test(html)) html = html.replace(/([ \t]*)<article\b/, (_, indent) => indent + advertisement + '\n' + indent + '<article');
    else html = html.replace('<!-- GENERATED:DISCLAIMER:START -->', advertisement + '\n    <!-- GENERATED:DISCLAIMER:START -->');
    return html;
  });
  count++;
}
console.log(`Publishing UI ${check ? 'checked' : 'built'}: ${count} tool notices, ${adCount} pending ad placements (home included; closed tools excluded). No ad requests enabled.`);
