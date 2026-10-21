/**
 * ==========================================================================
 * [별별 통계] 대한민국 평균 vs 나 (직장인 스펙 대조기) UI 컨트롤러 (app.js)
 * --------------------------------------------------------------------------
 * Canvas 레이더 차트 시각화, 연령대 셀렉트박스 실시간 연동, 페르소나 리포트 출력
 * ==========================================================================
 */

import { AvgCompareLogic } from './logic.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM 요소
    const ageSelect = document.getElementById('ageSelect');
    const inputSalary = document.getElementById('inputSalary');
    const inputSavings = document.getElementById('inputSavings');
    const inputHours = document.getElementById('inputHours');
    const inputLunch = document.getElementById('inputLunch');
    const inputEntryAge = document.getElementById('inputEntryAge');
    const btnCompare = document.getElementById('btnCompare');

    // 결과 요소
    const resultSection = document.getElementById('resultSection');
    const personaBadge = document.getElementById('personaBadge');
    const personaDesc = document.getElementById('personaDesc');
    const radarCanvas = document.getElementById('radarCanvas');
    const comparisonList = document.getElementById('comparisonList');
    const btnCopyUrl = document.getElementById('btnCopyUrl');

    // 2. 비교 실행 함수
    function runCompare(shouldScroll = false) {
        const ageGroup = ageSelect ? ageSelect.value : '30s';
        const userInput = {
            salary: parseInt(inputSalary.value, 10) || 4000,
            monthlySavings: parseInt(inputSavings.value, 10) || 100,
            weeklyWorkHours: parseFloat(inputHours.value) || 40,
            lunchCost: parseInt(inputLunch.value, 10) || 10000,
            entryAge: parseFloat(inputEntryAge.value) || 28
        };

        const result = AvgCompareLogic.calculateScores(ageGroup, userInput);

        // 페르소나 출력
        if (personaBadge) {
            personaBadge.textContent = result.persona.title;
        }
        if (personaDesc) {
            personaDesc.textContent = result.persona.desc;
        }

        // 비교 테이블/목록 출력
        renderComparisonList(result.radarData, result.benchmark.label);

        // 레이더 차트 렌더링
        drawRadarChart(result.radarData);

        if (resultSection) {
            resultSection.style.display = 'block';
            if (shouldScroll) {
                resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        if (window.SimuLabTracker && window.SimuLabTracker.trackEvent) {
            window.SimuLabTracker.trackEvent('compare_avg_vs_me', `${ageGroup}_${userInput.salary}`);
        }
    }

    // 3. 비교 리스트 렌더링
    function renderComparisonList(radarData, groupLabel) {
        if (!comparisonList) return;
        comparisonList.innerHTML = '';

        radarData.forEach(item => {
            const diffScore = item.user - item.avg;
            let statusBadge = '';
            if (diffScore >= 10) {
                statusBadge = `<span style="color:#10b981; font-weight:750;">우수 (+${diffScore}점)</span>`;
            } else if (diffScore <= -10) {
                statusBadge = `<span style="color:#ef4444; font-weight:750;">개선 필요 (${diffScore}점)</span>`;
            } else {
                statusBadge = `<span style="color:#64748b; font-weight:600;">평균 수준</span>`;
            }

            const div = document.createElement('div');
            div.className = 'compare-row';
            div.innerHTML = `
                <div style="font-weight:750; font-size:0.9rem;">${item.label}</div>
                <div style="font-size:0.85rem; color:var(--text-secondary);">
                    나: <strong style="color:var(--accent-color, #4f46e5);">${item.userRaw}</strong> / 
                    <span style="font-size:0.8rem; color:var(--text-muted);">${groupLabel}:</span> <span>${item.avgRaw}</span>
                </div>
                <div style="font-size:0.82rem; text-align:right;">${statusBadge}</div>
            `;
            comparisonList.appendChild(div);
        });
    }

    // 4. 고정밀 Canvas 오각형 레이더 차트
    function drawRadarChart(radarData) {
        if (!radarCanvas) return;
        const ctx = radarCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const rect = radarCanvas.getBoundingClientRect();
        radarCanvas.width = rect.width * dpr;
        radarCanvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(centerX, centerY) - 35;
        const numSides = radarData.length;
        const angleStep = (Math.PI * 2) / numSides;

        ctx.clearRect(0, 0, width, height);

        // 4-1. 배경 그리드 망 (다각형 원형 5단계: 20%, 40%, 60%, 80%, 100%)
        const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
        gridLevels.forEach((level, idx) => {
            ctx.beginPath();
            for (let i = 0; i < numSides; i++) {
                const angle = i * angleStep - Math.PI / 2;
                const r = maxRadius * level;
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = idx === 4 ? '#cbd5e1' : '#e2e8f0';
            ctx.lineWidth = idx === 4 ? 1.5 : 1;
            ctx.stroke();
        });

        // 4-2. 중심 축선 (5개 축)
        for (let i = 0; i < numSides; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * maxRadius;
            const y = centerY + Math.sin(angle) * maxRadius;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 4-3. 대한민국 평균 기준선 (모두 50점 기준 - 회색 점선)
        ctx.beginPath();
        for (let i = 0; i < numSides; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const r = maxRadius * (50 / 100);
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]); // 원복

        // 4-4. 내 지표 다각형 (보라색 그라디언트 채움)
        ctx.beginPath();
        const userPoints = [];
        for (let i = 0; i < numSides; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const score = radarData[i].user;
            const r = maxRadius * (score / 100);
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            userPoints.push({ x, y, score });
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 4-5. 각 꼭짓점 원형 포인트
        userPoints.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#4f46e5';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // 4-6. 라벨 텍스트 렌더링
        ctx.font = '700 12px Pretendard, -apple-system, sans-serif';
        ctx.fillStyle = '#334155';
        for (let i = 0; i < numSides; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = maxRadius + 22;
            const x = centerX + Math.cos(angle) * labelRadius;
            const y = centerY + Math.sin(angle) * labelRadius;

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(radarData[i].label, x, y);
        }
    }

    // 5. 이벤트 리스너 등록
    // 5-1. 연령대 셀렉트박스 변경 시 즉시 재계산 및 화면 갱신
    if (ageSelect) {
        ageSelect.addEventListener('change', () => runCompare(false));
    }

    // 5-2. 버튼 클릭 시 재계산 및 스크롤
    if (btnCompare) {
        btnCompare.addEventListener('click', () => runCompare(true));
    }

    // 5-3. URL 공유 버튼
    if (btnCopyUrl) {
        btnCopyUrl.addEventListener('click', () => {
            const url = window.location.href;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(() => {
                    alert('스펙 대조기 링크가 복사되었습니다!');
                });
            } else {
                alert('주소창 링크를 복사하여 공유해 보세요!');
            }
        });
    }

    // 기본 1회 자동 실행 (페이지 진입 시 스크롤 이동 방지)
    runCompare(false);
});
