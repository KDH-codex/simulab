/**
 * ==========================================================================
 * [시뮬랩 비공개 관리자 대시보드] UI 컨트롤러 & 차트 렌더러 (app.js)
 * --------------------------------------------------------------------------
 * 1. SHA-256 인증 모달 제어 (비밀번호 맞아야 대시보드 노출)
 * 2. Canvas 기반 듀얼 트렌드 차트 (일별 UV / PV)
 * 3. 37개 계산기 실시간 랭킹 & 첫 방문 유입 경로 시각화
 * 4. 실시간 라이브 이벤트 피드 및 CSV 엑셀 내보내기
 * ==========================================================================
 */

import {
    verifyAdminPassword,
    isAdminAuthenticated,
    adminLogout,
    getAnalyticsData,
    calculateKpis,
    exportToCsv
} from './logic.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM 요소 취득
    const loginModal = document.getElementById('adminLoginModal');
    const loginForm = document.getElementById('adminLoginForm');
    const passwordInput = document.getElementById('adminPasswordInput');
    const loginErrorMsg = document.getElementById('loginErrorMsg');
    const btnLogout = document.getElementById('adminLogoutBtn');

    // KPI 카드 요소들
    const kpiTodayUv = document.getElementById('kpiTodayUv');
    const kpiUvGrowth = document.getElementById('kpiUvGrowth');
    const kpiTodayPv = document.getElementById('kpiTodayPv');
    const kpiAvgPv = document.getElementById('kpiAvgPv');
    const kpiTotalUv = document.getElementById('kpiTotalUv');
    const kpiTotalPv = document.getElementById('kpiTotalPv');
    const kpiTopTool = document.getElementById('kpiTopTool');
    const kpiTopViews = document.getElementById('kpiTopViews');

    // 차트 및 필터 버튼
    const trendCanvas = document.getElementById('trendChartCanvas');
    const btnRange7 = document.getElementById('btnRange7');
    const btnRange30 = document.getElementById('btnRange30');

    // 랭킹 및 여정 리스트
    const toolRankingList = document.getElementById('toolRankingList');
    const landingPageList = document.getElementById('landingPageList');
    const liveEventList = document.getElementById('liveEventList');

    // 액션 버튼
    const btnExportCsv = document.getElementById('btnExportCsv');
    const btnRefresh = document.getElementById('btnRefresh');

    // 도구 한글 명칭 매핑
    const TOOL_TITLES = {
        'past-apt-timemachine': '그때 그 아파트 샀다면 🏢',
        'smoking-wealth-sim': '담배값 주식 투자 시뮬 🚬',
        'national-pension-sim': '국민연금 조기수령 시뮬 🏛️',
        'severance-pay-calc': '직장인 퇴직금 계산기 📋',
        'unemployment-benefit-calc': '실업급여 모의계산기 💼',
        'salary-net-calc': '월급 실수령액 계산기 💰',
        'opportunity-cost-calc': '소비 vs 투자 기회비용 ⚡',
        'area-pyeong-calc': '부동산 평수 ㎡ 환산기 📐',
        'loan-mortgage-calc': '주담대 한도 & DSR 🏠',
        'percent-discount-calc': '퍼센트 할인율 계산기 🛍️',
        'leverage-etf-sim': '주식·ETF 퀀트 시뮬레이터 📈',
        'korean-age-calc': '만나이 띠 계산기 🎂',
        'home-portal': '메인 포털 허브 (홈) 🏠'
    };

    let currentRangeDays = 7; // 기본 7일 보기

    // 2. 인증 및 모달 가드
    function checkAuth() {
        if (isAdminAuthenticated()) {
            loginModal.style.display = 'none';
            renderDashboard();
        } else {
            loginModal.style.display = 'flex';
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    // 로그인 제출 핸들러
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = passwordInput.value.trim();
        if (!pwd) return;

        loginErrorMsg.textContent = '인증 중...';
        loginErrorMsg.style.color = '#64748b';

        const res = await verifyAdminPassword(pwd);
        if (res.success) {
            loginErrorMsg.textContent = '';
            loginModal.style.display = 'none';
            renderDashboard();
        } else {
            loginErrorMsg.textContent = res.message;
            loginErrorMsg.style.color = '#ef4444';
            passwordInput.classList.add('shake-anim');
            setTimeout(() => passwordInput.classList.remove('shake-anim'), 400);
        }
    });

    // 로그아웃 핸들러
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('관리자 대시보드에서 로그아웃하시겠습니까?')) {
                adminLogout();
                checkAuth();
            }
        });
    }

    // 3. 메인 대시보드 렌더링 함수
    function renderDashboard() {
        const data = getAnalyticsData();
        const kpis = calculateKpis(data);

        // (1) KPI 카드 갱신
        kpiTodayUv.textContent = kpis.todayUv;
        kpiUvGrowth.textContent = kpis.uvGrowth;
        kpiUvGrowth.style.color = kpis.isGrowthPositive ? '#059669' : '#dc2626';

        kpiTodayPv.textContent = kpis.todayPv;
        kpiAvgPv.textContent = `인당 평균 ${kpis.avgPvPerUser}회`;

        kpiTotalUv.textContent = kpis.totalUv;
        kpiTotalPv.textContent = `총 PV ${kpis.totalPv}`;

        kpiTopTool.textContent = TOOL_TITLES[kpis.topToolId] || kpis.topToolId;
        kpiTopViews.textContent = `누적 ${kpis.topToolViews}회 방문`;

        // (2) 일별 트렌드 차트 렌더링
        renderTrendChart(data.daily, currentRangeDays);

        // (3) 인기 도구 랭킹 TOP 10 렌더링
        renderToolRankings(data.toolRanking);

        // (4) 첫 방문 유입(Landing Page) 렌더링
        renderLandingPages(data.landingPages);

        // (5) 실시간 이벤트 피드 렌더링
        renderRecentEvents(data.recentEvents);
    }

    // 4. 고정밀 Canvas 차트 그리기 (UV & PV)
    function renderTrendChart(dailyData, days) {
        if (!trendCanvas) return;
        const ctx = trendCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // 캔버스 크기 정규화
        const rect = trendCanvas.getBoundingClientRect();
        trendCanvas.width = rect.width * dpr;
        trendCanvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = { top: 20, right: 30, bottom: 40, left: 50 };

        ctx.clearRect(0, 0, width, height);

        // 날짜 데이터 슬라이싱
        const allDates = Object.keys(dailyData || {}).sort();
        const sliceDates = allDates.slice(-days);

        if (sliceDates.length === 0) return;

        const uvValues = sliceDates.map(d => dailyData[d].uv || 0);
        const pvValues = sliceDates.map(d => dailyData[d].pv || 0);

        const maxVal = Math.max(...pvValues, 100);
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        // 배경 가이드 라인 (4분할)
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px -apple-system, sans-serif';
        ctx.textAlign = 'right';

        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH / 4) * i;
            const val = Math.round(maxVal - (maxVal / 4) * i);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
            ctx.fillText(val.toLocaleString(), padding.left - 8, y + 3);
        }

        const stepX = chartW / (sliceDates.length - 1 || 1);

        // 1) PV 막대 그래프 렌더링 (연한 블루)
        ctx.fillStyle = 'rgba(59, 130, 246, 0.22)';
        const barWidth = Math.max(6, Math.min(24, stepX * 0.45));
        sliceDates.forEach((date, i) => {
            const pv = pvValues[i];
            const barH = (pv / maxVal) * chartH;
            const x = padding.left + i * stepX - barWidth / 2;
            const y = padding.top + chartH - barH;
            ctx.fillRect(x, y, barWidth, barH);
        });

        // 2) UV 꺾은선 그래프 렌더링 (진한 인디고)
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        const points = [];
        sliceDates.forEach((date, i) => {
            const uv = uvValues[i];
            const x = padding.left + i * stepX;
            const y = padding.top + chartH - (uv / maxVal) * chartH;
            points.push({ x, y, uv, pv: pvValues[i], date });
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // 3) 데이터 포인트 원형 및 X축 레이블
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.font = '11px -apple-system, sans-serif';

        points.forEach((pt, i) => {
            // 원형 점
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#4f46e5';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // X축 날짜 (MM/DD)
            const label = pt.date.substring(5).replace('-', '/');
            ctx.fillStyle = '#64748b';
            ctx.fillText(label, pt.x, height - 12);
        });
    }

    // 5. 인기 도구 순위 렌더링
    function renderToolRankings(toolRanking) {
        if (!toolRankingList) return;
        toolRankingList.innerHTML = '';

        const entries = Object.entries(toolRanking || {}).sort((a, b) => b[1] - a[1]);
        const maxVal = entries.length > 0 ? entries[0][1] : 1;

        entries.slice(0, 10).forEach(([toolId, count], idx) => {
            const pct = ((count / maxVal) * 100).toFixed(0);
            const title = TOOL_TITLES[toolId] || toolId;

            const row = document.createElement('div');
            row.className = 'ranking-row';
            row.innerHTML = `
                <div class="ranking-rank">${idx + 1}</div>
                <div class="ranking-info">
                    <div class="ranking-title-wrap">
                        <span class="ranking-title">${title}</span>
                        <span class="ranking-count">${count.toLocaleString()}회</span>
                    </div>
                    <div class="ranking-bar-track">
                        <div class="ranking-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
            toolRankingList.appendChild(row);
        });
    }

    // 6. 첫 방문 유입 경로 렌더링
    function renderLandingPages(landingPages) {
        if (!landingPageList) return;
        landingPageList.innerHTML = '';

        const entries = Object.entries(landingPages || {}).sort((a, b) => b[1] - a[1]);
        let totalLanding = 0;
        entries.forEach(e => totalLanding += e[1]);
        if (totalLanding === 0) totalLanding = 1;

        entries.slice(0, 5).forEach(([toolId, count]) => {
            const share = ((count / totalLanding) * 100).toFixed(1);
            const title = TOOL_TITLES[toolId] || toolId;

            const item = document.createElement('div');
            item.className = 'landing-item';
            item.innerHTML = `
                <div class="landing-header">
                    <span class="landing-name">${title}</span>
                    <span class="landing-pct">${share}% (${count.toLocaleString()}명)</span>
                </div>
                <div class="landing-track">
                    <div class="landing-fill" style="width: ${share}%;"></div>
                </div>
            `;
            landingPageList.appendChild(item);
        });
    }

    // 7. 실시간 이벤트 피드
    function renderRecentEvents(events) {
        if (!liveEventList) return;
        liveEventList.innerHTML = '';

        (events || []).slice(0, 8).forEach(ev => {
            const title = TOOL_TITLES[ev.tool] || ev.tool;
            const li = document.createElement('li');
            li.className = 'feed-item';
            li.innerHTML = `
                <span class="feed-time">${ev.time}</span>
                <span class="feed-badge">${title}</span>
                <span class="feed-desc">${ev.action}</span>
            `;
            liveEventList.appendChild(li);
        });
    }

    // 8. 필터 버튼 이벤트
    btnRange7.addEventListener('click', () => {
        btnRange7.classList.add('active');
        btnRange30.classList.remove('active');
        currentRangeDays = 7;
        renderDashboard();
    });

    btnRange30.addEventListener('click', () => {
        btnRange30.classList.add('active');
        btnRange7.classList.remove('active');
        currentRangeDays = 30;
        renderDashboard();
    });

    // 9. 새로고침 및 CSV 다운로드
    btnRefresh.addEventListener('click', () => {
        renderDashboard();
    });

    btnExportCsv.addEventListener('click', () => {
        const data = getAnalyticsData();
        const csv = exportToCsv(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `simulab_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // 초기 실행
    checkAuth();
});
