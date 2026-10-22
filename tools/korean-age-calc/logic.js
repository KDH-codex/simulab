/**
 * ==========================================================================
 * SimuLab - 만나이 & 띠 계산기 로직 엔진
 * 파일 경로: tools/korean-age-calc/logic.js
 * --------------------------------------------------------------------------
 * 1. 2023년 6월 28일 개정 행정기본법 및 민법 기준 공식 만나이
 *    - 현재 날짜가 생일 당일이거나 지난 경우: 현재연도 - 출생연도
 *    - 아직 생일이 지나지 않은 경우: 현재연도 - 출생연도 - 1
 * 2. 12간지 띠 (입춘 기준 또는 간지 주기)
 * 3. 살아온 총 일수 및 다음 생일까지 잔여 D-Day
 * 4. 주요 법정 연령 자격 도달 여부
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const AgeLogic = {};

  // 12간지 동물 띠 목록 (기준: 서기 4년 = 갑자년 쥐띠)
  AgeLogic.ZODIAC_ANIMALS = [
    { name: '원숭이띠', icon: '🐵', desc: '지혜롭고 다재다능한 원숭이' }, // 0
    { name: '닭띠', icon: '🐔', desc: '부지런하고 신의가 두터운 닭' },     // 1
    { name: '개띠', icon: '🐶', desc: '충직하고 정의로운 백구' },         // 2
    { name: '돼지띠', icon: '🐷', desc: '복이 많고 너그러운 돼지' },       // 3
    { name: '쥐띠', icon: '🐭', desc: '영리하고 근면한 쥐' },             // 4
    { name: '소띠', icon: '🐮', desc: '우직하고 성실한 황소' },           // 5
    { name: '호랑이띠', icon: '🐯', desc: '용맹하고 추진력 넘치는 범' },    // 6
    { name: '토끼띠', icon: '🐰', desc: '온화하고 착실한 토끼' },         // 7
    { name: '용띠', icon: '🐲', desc: '웅장하고 이상이 높은 청룡' },       // 8
    { name: '뱀띠', icon: '🐍', desc: '통찰력 있고 지혜로운 뱀' },         // 9
    { name: '말띠', icon: '🐴', desc: '활동적이고 진취적인 명마' },        // 10
    { name: '양띠', icon: '🐑', desc: '평화롭고 배려심 깊은 양' }          // 11
  ];

  function parseDay(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value ? date : null;
  }
  AgeLogic.calculate = function (birthDateStr,targetDateStr) {
    const targetText=targetDateStr || new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
    const birth=parseDay(birthDateStr),target=parseDay(targetText);
    if(!birth || !target || birth>target) return null;
    const birthYear=birth.getUTCFullYear(),birthMonth=birth.getUTCMonth(),birthDay=birth.getUTCDate();
    const targetYear=target.getUTCFullYear(),targetMonth=target.getUTCMonth(),targetDay=target.getUTCDate();
    const passed=targetMonth>birthMonth || (targetMonth===birthMonth && targetDay>=birthDay);
    const yearAge=targetYear-birthYear;
    let nextBday=new Date(Date.UTC(targetYear,birthMonth,birthDay));
    if(nextBday<target)nextBday=new Date(Date.UTC(targetYear+1,birthMonth,birthDay));
    return {birthYear,birthMonth:birthMonth+1,birthDay,internationalAge:yearAge-(passed?0:1),yearAge,koreanAge:yearAge+1,isBirthdayPassed:passed,zodiac:AgeLogic.ZODIAC_ANIMALS[birthYear%12],livedDays:Math.floor((target-birth)/86400000),daysUntilNextBday:Math.round((nextBday-target)/86400000),legalRights:[]};
  };

  global.AgeLogic = AgeLogic;
})(typeof window !== 'undefined' ? window : globalThis);
