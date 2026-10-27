import {readFile} from 'node:fs/promises';
import {writeFile} from './write-public-file.mjs';
import {coreToolGuides} from '../data/core-tool-guides.mjs';
import {publicationCatalog} from './publication.mjs';
import {toolGuidePairs} from '../data/guides/cases.mjs';
import {editorialGuides} from '../data/guides/catalog.mjs';
import {calculateExamples} from './guide-examples.mjs';
const {tools,ids}=await publicationCatalog(),e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const [id,title,sections,sources,related] of coreToolGuides){
 if(!ids.has(id)||related.some(id=>!ids.has(id)))throw new Error('Guide links outside public catalog: '+id);
 const file=new URL('../tools/'+id+'/index.html',import.meta.url);let html=await readFile(file,'utf8');
 html=html.replace(/<!-- GENERATED:CORE-GUIDE:START -->[\s\S]*?<!-- GENERATED:CORE-GUIDE:END -->\s*/g,'');
 const block=`<!-- GENERATED:CORE-GUIDE:START --><article class="core-tool-guide" aria-labelledby="core-guide-title"><h2 id="core-guide-title">${e(title)}</h2><p class="ref-note">시뮬랩 편집팀 · 해설 검토 2026-10-27 · 예시는 별도 표기가 없으면 가상 조건입니다.</p>${sections.map(([title,body])=>`<section><h3>${e(title)}</h3><p>${e(body)}</p></section>`).join('')}<section><h3>계산 기준과 출처</h3><p>${sources.length?sources.map(([label,url])=>`<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)} ↗</a>`).join(' · '):'위 입력 설명과 예시에 계산식·비교 범위를 표시했습니다. 개별 계약·행사·상품의 현재 조건은 해당 공식 안내를 확인하세요.'}</p><p>기존 기준 자료의 확인일은 아래 안내의 날짜를 따릅니다. 해설 검토일을 통계 발표일이나 요금 확인일로 사용하지 않습니다. 오류는 <a href="/legal/about.html">운영 문의</a>로 알려 주세요.</p></section><section><h3>함께 확인할 정보</h3><p>${related.map(id=>`<a href="/tools/${id}/">${e(tools.find(t=>t.tool===id).title)}</a>`).join(' · ')}</p></section></article><!-- GENERATED:CORE-GUIDE:END -->`;
 const pair=editorialGuides.find(g=>g.slug===toolGuidePairs[id]);if(!pair)throw new Error('Missing paired editorial guide '+id);
 const examples=calculateExamples(id);
 const preview=`<section class="paired-guide" data-paired-guide="${pair.slug}"><h3>내 조건과 다른 숫자 사례도 비교해 보세요</h3><ul>${examples.slice(0,3).map(c=>`<li><strong>${e(c.label)}</strong>: ${e(c.outputs.at(-1)[0])} ${e(c.outputs.at(-1)[1])}</li>`).join('')}</ul><p>개인·상품을 식별하지 않는 가상 조건입니다. 입력 조건·나머지 결과·주의사항은 상세 가이드에서 함께 확인하세요.</p><a href="/guides/${pair.slug}/">${e(pair.title)} ↗</a></section>`;
 html=html.replace('</main>',block.replace('</article><!-- GENERATED:CORE-GUIDE:END -->',preview+'</article><!-- GENERATED:CORE-GUIDE:END -->')+'\n</main>');
 await writeFile(file,html);
}
console.log('Built '+coreToolGuides.length+' authored core calculator explanations.');
