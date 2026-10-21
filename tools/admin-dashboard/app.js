/**
 * ==========================================================================
 * [시뮬랩 비공개 관리자 대시보드] UI 컨트롤러 & 차트 렌더러 (app.js)
 * --------------------------------------------------------------------------
 * 1. SHA-256 인증 모달 제어 (비밀번호 일치 시 대시보드 노출)
 * 2. Supabase 실시간 클라우드 및 순수 로컬스토리지 하이브리드 연동
 * 3. Canvas 기반 듀얼 트렌드 차트 (일별 UV / PV)
 * 4. 42개 계산기 & 미니게임 실시간 랭킹 & 첫 방문 유입 경로 시각화
 * 5. 실시간 라이브 이벤트 피드 및 CSV 엑셀 내보내기
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

    // 전체 42개 도구 및 미니게임 한글 명칭 매핑 사전
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
        'game-tetris': '레트로 테트리스 🕹️',
        'game-dodge': '미사일 피하기 닷지 🚀',
        'game-typing': '스피드 타자 산성비 🌧️',
        'game-brick-breaker': '네온 벽돌 깨기 🧱',
        'ladder-draw-game': '인터랙티브 사다리타기 🪜',
        'lotto-draw-sim': '로또 1등 당첨 시뮬레이터 🎰',
        'lotto-tax-interest-calc': '로또 세후 수령액 & 이자 💵',
        'alcohol-widmark-calc': '음주 알코올 분해시간 🍺',
        'caffeine-sleep-calc': '카페인 반감기 & 꿀잠 ☕',
        'coffee-opportunity-calc': '커피값 투자 기회비용 ☕',
        'diet-bmr-tdee-calc': '다이어트 BMR·TDEE 🥗',
        'dividend-goal-calc': '월 배당 목표금액 계산기 🎯',
        'dividend-tax-sim': '배당 복리 & 세금 계산기 📊',
        'dutch-pay-roulette': '센스있는 더치페이 계산기 💳',
        'hourly-labor-value-calc': '나의 진짜 시급 가치 ⏱️',
        'inflation-purchasing-power-calc': '화폐가치 하락 인플레 📉',
        'invest-animal-mbti': '투자 성향 동물 MBTI 🦁',
        'jeonse-wolse-sim': '전세 vs 월세 손익 비교 ⚖️',
        'life-hourglass-sim': '내 인생의 모래시계 ⏳',
        'logistics-roi-calc': '물류 자동화 ROI 분석 📦',
        'love-animal-attachment': '연애 동물 애착 심리테스트 🐱',
        'missed-investment-calc': '과거 그때 샀더라면 📈',
        'retirement-survival-sim': '은퇴자금 조기소진 계산기 🏖️',
        'running-zone-calc': '러닝 Zone 2 심박수 🏃',
        'saju-wealth-sim': '사주 오행 & 재물운 분석 🔮',
        'stock-profit-calc': '주식 실질 수익률 계산기 💹',
        'stock-target-compound-calc': '목표가 & 복리 수익 🎯',
        'stock-water-ride-calc': '주식 평단가 물타기 📉',
        'capital-gains-tax-sim': '부동산 양도세 계산기 🏠',
        'home-portal': '메인 포털 허브 (홈) 🏠'
    };

    let currentRangeDays = 7; // 기본 7일 보기
    let latestAnalyticsData = null;

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

    // 3. 메인 대시보드 렌더링 함수 (비동기 실시간 조회 지원)
    async function renderDashboard() {
        if (btnRefresh) btnRefresh.textContent = '🔄 동기화 중...';

        const data = await getAnalyticsData(currentRangeDays);
        latestAnalyticsData = data;
        const kpis = calculateKpis(data);

        // 상단 상태 뱃지 업데이트
        const statusBadge = document.querySelector('.admin-title-group span[style*="font-size: 0.78rem"]');
        if (statusBadge) {
            if (kpis.isCloud) {
                statusBadge.innerHTML = '● 실시간 클라우드 (Supabase)';
                statusBadge.style.color = '#10b981';
            } else {
                statusBadge.innerHTML = '💾 로컬 보관 모드 (진짜 방문자 실시간 카운트)';
                statusBadge.style.color = '#64748b';
            }
        }

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

        if (btnRefresh) btnRefresh.textContent = '🔄 새로고침';
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

        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        // 데이터가 없거나 0일 때의 기본 축 그리기
        const uvValues = sliceDates.map(d => (dailyData[d] && dailyData[d].uv) || 0);
        const pvValues = sliceDates.map(d => (dailyData[d] && dailyData[d].pv) || 0);
        const maxVal = Math.max(...pvValues, 10); // 최소 눈금 10

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

        if (sliceDates.length === 0) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px -apple-system, sans-serif';
            ctx.fillText('아직 집계된 방문자 트렌드 데이터가 없습니다.', width / 2, height / 2);
            return;
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
        if (entries.length === 0) {
            toolRankingList.innerHTML = `
                <div style="text-align:center; padding:2rem 1rem; color:#94a3b8; font-size:0.85rem; background:#f8fafc; border-radius:10px;">
                    ✨ 아직 집계된 계산기 사용 기록이 없습니다.<br/>방문자가 도구를 사용하면 실시간으로 1위부터 순위가 표시됩니다!
                </div>
            `;
            return;
        }

        const maxVal = entries[0][1] || 1;

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
        if (entries.length === 0) {
            landingPageList.innerHTML = `
                <div style="text-align:center; padding:1.5rem 1rem; color:#94a3b8; font-size:0.85rem; background:#f8fafc; border-radius:10px;">
                    아직 유입된 첫 방문자 기록이 없습니다.
                </div>
            `;
            return;
        }

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

        if (!events || events.length === 0) {
            liveEventList.innerHTML = `
                <li style="text-align:center; padding:1.5rem 1rem; color:#94a3b8; font-size:0.85rem; list-style:none; background:#f8fafc; border-radius:10px;">
                    방문자가 사이트에서 활동하면 여기에 실시간으로 표시됩니다.
                </li>
            `;
            return;
        }

        events.slice(0, 8).forEach(ev => {
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
        const data = latestAnalyticsData || getAnalyticsData();
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
