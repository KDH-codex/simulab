import test from 'node:test';
import assert from 'node:assert/strict';
import {BASE_TAGS,normalizeHashtags,planHashtags} from '../scripts/family-info/blog-tags.mjs';
import {draftMarkdown} from '../scripts/family-info/blog.mjs';
const post={categoryId:'kids-popups',title:'티니핑 팝업 안내',records:[{title:'2026년 캐치티니핑 팝업 · 현대 프리미엄아울렛 김포점',location:'현대 프리미엄아울렛 김포점',region:'경기',summary:'쥬얼스타캐치티니핑 포토타임과 캐릭터 포토존, 굿즈와 키링을 만나는 팝업입니다.',audience:'공식 공지 참고',feeText:'공지 참고',conditions:[],canonicalUrl:'https://example.org/event',siteUrl:'/tools/kids-popups/',verifiedAt:'2026-10-29'}]};
test('tags preserve the base and extract thirty distinct keywords from the actual subject',()=>{
 const plan=planHashtags(post);assert.equal(plan.tagCount,30);assert.equal(plan.tagStatus,'complete');assert.equal(new Set(plan.hashtags).size,30);assert.deepEqual(plan.hashtags.slice(0,8),BASE_TAGS.map(t=>'#'+t));
 for(const tag of ['#캐치티니핑','#쥬얼스타캐치티니핑','#포토타임','#현대프리미엄아울렛김포점'])assert.ok(plan.hashtags.includes(tag),tag);
 assert.ok(!plan.hashtags.some(tag=>/제주|해리포터|무료|예약가능|2026|^#년/u.test(tag)));assert.ok(plan.requiresTagReview);
 assert.equal(draftMarkdown(post).trim().split('\n').at(-1),plan.hashtags.join(' '));
});
test('normalization removes equivalent tags, banned defaults and invalid URL/number candidates',()=>{
 assert.deepEqual(normalizeHashtags(['#캐치 티니핑','＃캐치티니핑','캐치-티니핑','ACC','acc','or','AND','#직장인아빠','51개월육아','2026','https://example.org/a']),['#캐치티니핑','#ACC']);
});
test('grouped posts include subjects from every record before filling with keyword variations',()=>{
 const group={...post,records:[...post.records,{...post.records[0],title:'타이니빌 팝업 · 대전신세계',location:'대전신세계',region:'대전',summary:'산리오와 디즈니 캐릭터 굿즈'}]};
 const tags=planHashtags(group).hashtags;assert.ok(tags.some(t=>t.includes('타이니빌')));assert.ok(tags.some(t=>t.includes('캐치티니핑')));
});
test('thin content remains incomplete rather than receiving unrelated filler tags',()=>{
 const plan=planHashtags({categoryId:'kids-popups',records:[]});assert.equal(plan.tagStatus,'needs-keywords');assert.ok(plan.tagCount<30);assert.ok(!plan.hashtags.some(t=>/티니핑|포토존|무료|예약가능/u.test(t)));
});
