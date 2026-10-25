import test from 'node:test';
import assert from 'node:assert/strict';
import {noticeKey,researchCoverage} from '../scripts/family-info/research.mjs';
const now=new Date('2026-10-26T06:00:00Z');
const row={categoryId:'kids-programs',title:'공식 체험 공지',canonicalUrl:'https://official.example/program?id=1',reviewedAt:'2026-10-26',runId:'baseline',detailReviewed:true,outcome:'verified',summary:'공식 상세의 기간과 조건을 대조'};
test('minimum research counts distinct reviewed notices and never mere directories or blocked access',()=>{
 const rows=Array.from({length:15},(_,n)=>({...row,canonicalUrl:'https://official.example/program?id='+n}));
 assert.equal(researchCoverage('kids-programs',rows,{now}).targetMet,true);
 rows[0].outcome='blocked';rows[1].detailReviewed=false;rows[2].canonicalUrl=rows[3].canonicalUrl+'#top';
 const result=researchCoverage('kids-programs',rows,{now});assert.equal(result.detailedReviewed,12);assert.equal(result.shortfall,3);assert.equal(result.targetMet,false);
});
test('research scope preserves category, run and actual confirmation date',()=>{
 const rows=[row,{...row,categoryId:'family-culture',canonicalUrl:'https://official.example/2'},{...row,runId:'older',canonicalUrl:'https://official.example/3'},{...row,reviewedAt:'2026-10-01',canonicalUrl:'https://official.example/4'},{...row,reviewedAt:'2026-10-27',canonicalUrl:'https://official.example/5'}];
 assert.equal(researchCoverage('kids-programs',rows,{now,runId:'baseline'}).detailedReviewed,1);
 assert.equal(noticeKey('https://official.example/p?b=2&utm_source=test&a=1#x'),'https://official.example/p?a=1&b=2');
});
test('one notice in multiple navigation sections or one grouped campaign counts once',()=>{
 const rows=[{...row,canonicalUrl:'https://culture.seoul.go.kr/view.do?cultcode=1&menuNo=200008'},{...row,canonicalUrl:'https://culture.seoul.go.kr/view.do?menuNo=200009&cultcode=1'},{...row,canonicalUrl:'https://official.example/session1',reviewUnit:'same-program'},{...row,canonicalUrl:'https://official.example/session2',reviewUnit:'same-program'}];
 assert.equal(researchCoverage('kids-programs',rows,{now}).detailedReviewed,2);
});
