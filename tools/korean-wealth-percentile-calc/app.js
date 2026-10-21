/**
 * ==========================================================================
 * [별별 통계] 대한민국 순자산 백분위 계산기 UI 컨트롤러 (app.js)
 * --------------------------------------------------------------------------
 * 사용자 입력 제어, Canvas 분포 곡선 시각화, 지표 카드 렌더링, 공유 기능
 * ==========================================================================
 */

import { WealthLogic } from './logic.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM 요소 취득
    const ageSelect = document.getElementById('ageGroupSelect');
    const wealthInput = document.getElementById('netWorthInput');
    const btnCalc = document.getElementById('btnCalculate');
    const quickChips = document.querySelectorAll('.quick-chip-btn');
    const resultCard = document.getElementById('resultCard');

    // 결과 텍스트 요소
    const resAllPct = document.getElementById('resAllPct');
    const resAgePct = document.getElementById('resAgePct');
    const resTierBadge = document.getElementById('resTierBadge');
    const resFeedbackText = document.getElementById('resFeedbackText');
    const resMeanDiff = document.getElementById('resMeanDiff');
    const resMedianDiff = document.getElementById('resMedianDiff');

    // 캔버스 차트
    const curveCanvas = document.getElementById('wealthCurveCanvas');

    // 공유 및 복사 버튼
    const btnShareKakao = document.getElementById('btnShareKakao');
    const btnCopyUrl = document.getElementById('btnCopyUrl');

    // 2. 퀵 칩(Quick Chips) 버튼 클릭 이벤트 (금액 더하기)
    quickChips.forEach(btn => {
        btn.addEventListener('click', () => {
            const addVal = parseInt(btn.dataset.add, 10);
            if (btn.dataset.action === 'reset') {
                wealthInput.value = '0';
            } else {
                const current = parseInt(wealthInput.value.replace(/,/g, '') || '0', 10);
                wealthInput.value = (current + addVal).toLocaleString('ko-KR');
            }
            updateRealtimeDisplay();
        });
    });

    // 숫자 콤마 자동 포맷팅
    wealthInput.addEventListener('input', () => {
        let raw = wealthInput.value.replace(/[^0-9-]/g, '');
        if (raw) {
            const num = parseInt(raw, 10);
            wealthInput.value = isNaN(num) ? '' : num.toLocaleString('ko-KR');
        }
        updateRealtimeDisplay();
    });

    function getNetWorthValue() {
        const raw = wealthInput.value.replace(/,/g, '');
        return parseInt(raw, 10) || 0;
    }

    function updateRealtimeDisplay() {
        const val = getNetWorthValue();
        const hintEl = document.getElementById('inputKoreanHint');
        if (hintEl) {
            hintEl.textContent = `입력 금액: ${WealthLogic.formatCurrency(val)}`;
        }
    }

    // 3. 계산 및 시각화 실행 함수
    function runCalculation() {
        const ageGroup = ageSelect.value;
        const netWorth = getNetWorthValue();

        // 1) 전체 가구 기준 백분위 계산
        const statAll = WealthLogic.calculatePercentile('all', netWorth);
        // 2) 해당 연령대 기준 백분위 계산
        const statAge = WealthLogic.calculatePercentile(ageGroup, netWorth);
        // 3) 총평 문구
        const feedback = WealthLogic.getFeedbackText(statAll.topRate, statAge.topRate, ageGroup);

        // 결과 UI 업데이트
        resAllPct.textContent = `상위 ${statAll.topRate}%`;
        resAgePct.textContent = `상위 ${statAge.topRate}%`;
        resTierBadge.textContent = `${feedback.emoji} ${feedback.tier}`;
        resFeedbackText.textContent = feedback.desc;

        // 평균 및 중위값 비교
        const meanDiff = netWorth - statAge.mean;
        const medianDiff = netWorth - statAge.median;
        
        resMeanDiff.innerHTML = `${statAge.groupLabel} 평균(<strong>${WealthLogic.formatCurrency(statAge.mean)}</strong>)보다 <span style="color:${meanDiff >= 0 ? '#10b981' : '#ef4444'}; font-weight:750;">${meanDiff >= 0 ? '+' : ''}${WealthLogic.formatCurrency(meanDiff)}</span>`;
        resMedianDiff.innerHTML = `${statAge.groupLabel} 중위값(<strong>${WealthLogic.formatCurrency(statAge.median)}</strong>)보다 <span style="color:${medianDiff >= 0 ? '#10b981' : '#ef4444'}; font-weight:750;">${medianDiff >= 0 ? '+' : ''}${WealthLogic.formatCurrency(medianDiff)}</span>`;

        // 분포 곡선 캔버스 그리기
        drawWealthDistributionCurve(statAll.percentile, statAge.percentile, statAge.groupLabel);

        // 결과 영역 표시
        resultCard.style.display = 'block';
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // 이벤트 추적
        if (window.SimuLabTracker && window.SimuLabTracker.trackEvent) {
            window.SimuLabTracker.trackEvent('calculate_wealth_percentile', `${ageGroup}_${netWorth}`);
        }
    }

    // 4. 고정밀 Canvas 자산 분포 곡선 시각화
    function drawWealthDistributionCurve(userAllPercentile, userAgePercentile, groupLabel) {
        if (!curveCanvas) return;
        const ctx = curveCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const rect = curveCanvas.getBoundingClientRect();
        curveCanvas.width = rect.width * dpr;
        curveCanvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = { top: 30, right: 25, bottom: 45, left: 25 };
        const plotW = width - padding.left - padding.right;
        const plotH = height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, width, height);

        // 정규분포 + 롱테일 형태의 곡선 생성
        const totalPoints = 100;
        const curvePoints = [];

        for (let i = 0; i <= totalPoints; i++) {
            const xPct = i / totalPoints; // 0.0 ~ 1.0 (백분위)
            // 비대칭 로그정규 자산 분포 근사식 (왼쪽으로 치우치고 오른쪽으로 긴 꼬리)
            const z = (xPct - 0.28) / 0.22;
            const yNormalized = Math.exp(-0.5 * z * z);
            const x = padding.left + xPct * plotW;
            const y = padding.top + plotH - (yNormalized * plotH * 0.9);
            curvePoints.push({ x, y, pct: i });
        }

        // 1) 곡선 아래 배경 그라데이션 채우기
        const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotH);
        grad.addColorStop(0, 'rgba(99, 102, 241, 0.28)');
        grad.addColorStop(1, 'rgba(99, 102, 241, 0.02)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + plotH);
        curvePoints.forEach((pt, idx) => {
            if (idx === 0) ctx.lineTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        });
        ctx.lineTo(padding.left + plotW, padding.top + plotH);
        ctx.closePath();
        ctx.fill();

        // 2) 메인 분포선 그리기
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        curvePoints.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // 3) 기준 축 및 레이블 렌더링
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + plotH);
        ctx.lineTo(padding.left + plotW, padding.top + plotH);
        ctx.stroke();

        // X축 분위 안내 (하위 10%, 중위 50%, 상위 10%, 상위 1%)
        ctx.fillStyle = '#64748b';
        ctx.font = '11px -apple-system, sans-serif';
        ctx.textAlign = 'center';

        const labels = [
            { pct: 0.1, text: '하위 10%' },
            { pct: 0.5, text: '중위(50%)' },
            { pct: 0.9, text: '상위 10%' },
            { pct: 0.99, text: '상위 1%' }
        ];

        labels.forEach(item => {
            const lx = padding.left + item.pct * plotW;
            ctx.fillText(item.text, lx, padding.top + plotH + 20);

            // 가이드 점선
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(lx, padding.top + plotH);
            ctx.lineTo(lx, padding.top + 10);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // 4) 사용자 내 위치 마커 (핀포인트 강조)
        const userXPct = Math.min(0.99, Math.max(0.01, userAgePercentile / 100));
        const userX = padding.left + userXPct * plotW;
        
        // 해당 x위치에서의 곡선 y값 찾기
        const ptIndex = Math.round(userXPct * totalPoints);
        const userY = curvePoints[ptIndex] ? curvePoints[ptIndex].y : padding.top + plotH * 0.5;

        // 세로 강조선
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(userX, padding.top + plotH);
        ctx.lineTo(userX, userY - 12);
        ctx.stroke();

        // 사용자 위치 원형 핀
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(userX, userY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(userX, userY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 상단 '내 위치' 툴팁 박스 렌더링
        const topRate = (100 - userAgePercentile).toFixed(1);
        const tagText = `📍 내 위치: 상위 ${topRate}%`;
        ctx.font = 'bold 11px -apple-system, sans-serif';
        const tagW = ctx.measureText(tagText).width + 16;
        const tagX = Math.min(width - tagW / 2 - 10, Math.max(tagW / 2 + 10, userX));

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(tagX - tagW / 2, userY - 32, tagW, 22, 6);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(tagText, tagX, userY - 17);
    }

    // 5. 버튼 이벤트 바인딩
    btnCalc.addEventListener('click', runCalculation);

    // Enter 키로 계산 실행
    wealthInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            runCalculation();
        }
    });

    // 6. 카카오톡 및 URL 공유
    if (btnCopyUrl) {
        btnCopyUrl.addEventListener('click', () => {
            const url = window.location.href;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                    alert('시뮬레이터 주소가 클립보드에 복사되었습니다!\n원하는 곳에 붙여넣어 공유하세요.');
                }).catch(() => {
                    fallbackCopy(url);
                });
            } else {
                fallbackCopy(url);
            }
        });
    }

    function fallbackCopy(text) {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('주소가 복사되었습니다!');
    }

    // 초기 표시 갱신
    updateRealtimeDisplay();
});
