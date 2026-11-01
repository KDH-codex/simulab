import test from 'node:test';
import assert from 'node:assert/strict';
import {challenges,judge,winner} from '../scripts/arena-rules.mjs';
test('logic and information trap require unambiguous exact answers',()=>{
 assert.equal(judge(challenges[0],'4').pass,true);assert.equal(judge(challenges[0],'b=4').pass,false);
 assert.equal(judge(challenges[2],'모릅니다').pass,true);assert.equal(judge(challenges[2],'저자는 김철수').pass,false);
});
test('constraint uses Unicode length, no digits, one line and exact final word',()=>{
 assert.equal(judge(challenges[1],'정답은 사과').pass,true);
 for(const x of ['정답 1 사과','사과입니다','가'.repeat(29)+'사과','안녕\n사과'])assert.equal(judge(challenges[1],x).pass,false);
});
test('score ties are explicit',()=>{assert.equal(winner({GPT:2,Gemini:2}),'무승부');assert.equal(winner({GPT:3,Gemini:2}),'GPT')});
test('comedy waits for human judgment and is not automatically scored',()=>{assert.equal(judge(challenges[3],'한 줄 개그').pass,null)});
