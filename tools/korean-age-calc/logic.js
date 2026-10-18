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

  AgeLogic.calculate = function (birthDateStr, targetDateStr) {
    if (!birthDateStr) return null;

    const birth = new Date(birthDateStr);
    const target = targetDateStr ? new Date(targetDateStr) : new Date();

    const birthYear = birth.getFullYear();
    const birthMonth = birth.getMonth();
    const birthDay = birth.getDate();

    const targetYear = target.getFullYear();
    const targetMonth = target.getMonth();
    const targetDay = target.getDate();

    // 1. 만나이 계산 (생일 지났는지 판별)
    let internationalAge = targetYear - birthYear;
    const isBirthdayPassed =
      targetMonth > birthMonth || (targetMonth === birthMonth && targetDay >= birthDay);

    if (!isBirthdayPassed) {
      internationalAge -= 1;
    }

    // 2. 연나이 (청소년보호법/병역법)
    const yearAge = targetYear - birthYear;

    // 3. 세는 나이 (전통 한국식)
    const koreanAge = targetYear - birthYear + 1;

    // 4. 12간지 띠 계산
    const zodiacIndex = birthYear % 12;
    const zodiac = AgeLogic.ZODIAC_ANIMALS[zodiacIndex];

    // 5. 총 살아온 일수
    const diffTime = target.getTime() - birth.getTime();
    const livedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    // 6. 다음 생일까지 남은 D-Day
    let nextBday = new Date(targetYear, birthMonth, birthDay);
    if (nextBday < target) {
      nextBday = new Date(targetYear + 1, birthMonth, birthDay);
    }
    const daysUntilNextBday = Math.ceil((nextBday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    // 7. 법정 주요 자격 도달 여부
    const legalRights = [
      { title: '초등학교 입학', requiredAge: 7, eligible: internationalAge >= 7 },
      { title: '운전면허 취득 (제2종)', requiredAge: 18, eligible: internationalAge >= 18 },
      { title: '선거권 (투표)', requiredAge: 18, eligible: internationalAge >= 18 },
      { title: '청소년보호법 해제 (음주/흡연)', requiredAge: 19, eligible: yearAge >= 19 },
      { title: '워킹홀리데이 신청 (만 30세)', requiredAge: 30, eligible: internationalAge <= 30 },
      { title: '법정 정년 (만 60세)', requiredAge: 60, eligible: internationalAge >= 60 },
      { title: '기초연금 / 경로우대 (만 65세)', requiredAge: 65, eligible: internationalAge >= 65 }
    ];

    return {
      birthYear,
      birthMonth: birthMonth + 1,
      birthDay,
      internationalAge: Math.max(0, internationalAge),
      yearAge: Math.max(0, yearAge),
      koreanAge: Math.max(1, koreanAge),
      isBirthdayPassed,
      zodiac,
      livedDays,
      daysUntilNextBday,
      legalRights
    };
  };

  global.AgeLogic = AgeLogic;
})(typeof window !== 'undefined' ? window : globalThis);
