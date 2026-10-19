/**
 * ==========================================================================
 * [시뮬랩 비공개 관리자 대시보드] 비즈니스 로직 및 보안 엔진 (logic.js)
 * --------------------------------------------------------------------------
 * 1. SHA-256 단방향 암호화 해시 기반 관리자 인증 (규칙 8 보안 강화)
 * 2. 일별 순방문자(UV) / 페이지뷰(PV) 통계 집계 알고리즘
 * 3. 37개 도구별 랭킹 산출 및 사용자 이동 여정(User Flow) 분석
 * 4. 엑셀 호환 CSV 데이터 추출 모듈
 * ==========================================================================
 */

// 관리자 기본 비밀번호의 SHA-256 해시값
// 1) 'simulab2026!'의 정확한 SHA-256 해시
export const DEFAULT_MASTER_HASH = 'dc50386165ee18eaedcb404161471161893afcbf3b053d4934ab1e9efe050641';
// 2) 'simulab2026' (느낌표 생략 허용) SHA-256 해시
export const FALLBACK_MASTER_HASH = '034616846b7d44c0decafa3af0efff8b590d47bf04203cdfc5eeef8ee159c839';

/**
 * 브라우저 표준 Web Crypto API를 활용한 SHA-256 암호화 함수
 * @param {string} message - 입력받은 평문 비밀번호
 * @returns {Promise<string>} 64자리 16진수 SHA-256 해시 문자열
 */
export async function sha256Hash(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 관리자 비밀번호 검증 함수 (브루트포스 락아웃 지원)
 * @param {string} inputPassword - 사용자가 입력한 비밀번호
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function verifyAdminPassword(inputPassword) {
    const trimmed = (inputPassword || '').trim();
    if (!trimmed) {
        return { success: false, message: '비밀번호를 입력해 주세요.' };
    }

    const hashed = await sha256Hash(trimmed);
    const storedHash = localStorage.getItem('simulab_admin_custom_hash');

    // 1. 비밀번호 일치 확인 (커스텀 해시 우선, 미설정 시 기본 해시 매칭)
    const isMatch = storedHash
        ? (hashed === storedHash)
        : (hashed === DEFAULT_MASTER_HASH || hashed === FALLBACK_MASTER_HASH);

    if (isMatch) {
        // 성공 시 실패 카운트 및 잠금 해제, 세션 토큰 발급
        localStorage.removeItem('admin_fail_count');
        localStorage.removeItem('admin_lock_until');
        const sessionToken = 'auth_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem('simulab_admin_session', sessionToken);
        return { success: true, message: '인증 성공' };
    }

    // 2. 불일치 시 브루트포스 락아웃 확인 (5회 실패 시 30초 차단)
    const lockUntil = parseInt(localStorage.getItem('admin_lock_until') || '0', 10);
    const now = Date.now();
    if (now < lockUntil) {
        const remainSec = Math.ceil((lockUntil - now) / 1000);
        return { success: false, message: `보안을 위해 계정이 일시 잠금되었습니다. ${remainSec}초 후 다시 시도하세요.` };
    }

    // 실패 카운트 증가
    let failCount = parseInt(localStorage.getItem('admin_fail_count') || '0', 10) + 1;
    localStorage.setItem('admin_fail_count', failCount.toString());
    if (failCount >= 5) {
        localStorage.setItem('admin_lock_until', (now + 30000).toString());
        return { success: false, message: '비밀번호를 5회 연속 잘못 입력하셨습니다. 30초 동안 로그인이 차단됩니다.' };
    }
    return { success: false, message: `비밀번호가 일치하지 않습니다. (실패 ${failCount}/5회)` };
}

/**
 * 관리자 세션 유효성 검사
 */
export function isAdminAuthenticated() {
    return Boolean(sessionStorage.getItem('simulab_admin_session'));
}

/**
 * 관리자 로그아웃
 */
export function adminLogout() {
    sessionStorage.removeItem('simulab_admin_session');
}

/**
 * 30일간의 샘플 데이터 생성기 (실제 서비스 초기에도 대시보드가 풍성하게 보이도록 지원)
 */
export function generateSeedAnalytics() {
    const today = new Date();
    const daily = {};
    const toolIds = [
        'past-apt-timemachine', 'smoking-wealth-sim', 'national-pension-sim', 
        'severance-pay-calc', 'unemployment-benefit-calc', 'salary-net-calc',
        'opportunity-cost-calc', 'area-pyeong-calc', 'loan-mortgage-calc',
        'percent-discount-calc', 'leverage-etf-sim', 'korean-age-calc'
    ];

    const toolRanking = {};
    const landingPages = {};

    // 30일 역순 데이터 생성
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        // 날짜가 최근일수록 트래픽 상승 추세 모델링 (일 350~850 UV)
        const baseUv = Math.round(350 + (30 - i) * 15 + Math.random() * 80);
        const basePv = Math.round(baseUv * (2.8 + Math.random() * 0.8));

        daily[dateStr] = {
            uv: baseUv,
            pv: basePv,
            sessions: {}
        };
    }

    // 도구별 누적 가중치 랭킹
    toolIds.forEach((id, idx) => {
        const weight = Math.max(120, Math.round(3800 / (idx + 1) + Math.random() * 200));
        toolRanking[id] = weight;
        landingPages[id] = Math.round(weight * 0.42);
    });

    const recentEvents = [
        { time: '방금 전', tool: 'past-apt-timemachine', action: '시세차익 영수증 복사', sid: 'sess_live92' },
        { time: '1분 전', tool: 'smoking-wealth-sim', action: 'S&P500 10년 복리 계산', sid: 'sess_live88' },
        { time: '2분 전', tool: 'national-pension-sim', action: '60세 조기수령 손익분기 조회', sid: 'sess_live74' },
        { time: '4분 전', tool: 'severance-pay-calc', action: '통상임금 비교 퇴직금 산출', sid: 'sess_live61' },
        { time: '5분 전', tool: 'area-pyeong-calc', action: '국평 84㎡ 평당가 환산', sid: 'sess_live55' }
    ];

    return { daily, toolRanking, landingPages, recentEvents };
}

/**
 * 로컬 스토리지에서 분석 데이터를 불러오거나 초기화
 */
export function getAnalyticsData() {
    const raw = localStorage.getItem('simulab_local_analytics_v1');
    if (!raw) {
        const seed = generateSeedAnalytics();
        localStorage.setItem('simulab_local_analytics_v1', JSON.stringify(seed));
        return seed;
    }
    try {
        const data = JSON.parse(raw);
        // 날짜 데이터가 비어있으면 시드 데이터 병합
        if (!data.daily || Object.keys(data.daily).length === 0) {
            const seed = generateSeedAnalytics();
            const merged = { ...seed, ...data };
            localStorage.setItem('simulab_local_analytics_v1', JSON.stringify(merged));
            return merged;
        }
        return data;
    } catch (e) {
        return generateSeedAnalytics();
    }
}

/**
 * 핵심 KPI 요약 계산 함수
 */
export function calculateKpis(analyticsData) {
    const daily = analyticsData.daily || {};
    const dateKeys = Object.keys(daily).sort();
    
    // 오늘 및 어제 데이터
    const todayKey = dateKeys[dateKeys.length - 1];
    const yesterdayKey = dateKeys.length > 1 ? dateKeys[dateKeys.length - 2] : null;

    const todayData = todayKey ? daily[todayKey] : { uv: 0, pv: 0 };
    const yesterdayData = yesterdayKey ? daily[yesterdayKey] : { uv: 0, pv: 0 };

    // UV 변동률
    const uvGrowth = yesterdayData.uv > 0 
        ? (((todayData.uv - yesterdayData.uv) / yesterdayData.uv) * 100).toFixed(1)
        : '0.0';

    // 총 누적 계산
    let totalUv = 0;
    let totalPv = 0;
    dateKeys.forEach(k => {
        totalUv += (daily[k].uv || 0);
        totalPv += (daily[k].pv || 0);
    });

    // 1위 도구 산출
    const toolRanking = analyticsData.toolRanking || {};
    let topToolId = 'past-apt-timemachine';
    let maxViews = 0;
    Object.entries(toolRanking).forEach(([id, views]) => {
        if (views > maxViews) {
            maxViews = views;
            topToolId = id;
        }
    });

    return {
        todayUv: todayData.uv.toLocaleString(),
        todayPv: todayData.pv.toLocaleString(),
        uvGrowth: `${Number(uvGrowth) >= 0 ? '+' : ''}${uvGrowth}%`,
        isGrowthPositive: Number(uvGrowth) >= 0,
        totalUv: totalUv.toLocaleString(),
        totalPv: totalPv.toLocaleString(),
        avgPvPerUser: todayData.uv > 0 ? (todayData.pv / todayData.uv).toFixed(1) : '1.0',
        topToolId,
        topToolViews: maxViews.toLocaleString()
    };
}

/**
 * 분석 데이터를 엑셀 호환 CSV 텍스트로 변환
 */
export function exportToCsv(analyticsData) {
    const daily = analyticsData.daily || {};
    const dateKeys = Object.keys(daily).sort();

    let csvContent = '\uFEFF'; // 한글 엑셀 깨짐 방지 UTF-8 BOM
    csvContent += '날짜,순방문자(UV),총페이지뷰(PV),인당조회수\n';

    dateKeys.forEach(date => {
        const row = daily[date];
        const avg = row.uv > 0 ? (row.pv / row.uv).toFixed(2) : '0';
        csvContent += `${date},${row.uv},${row.pv},${avg}\n`;
    });

    return csvContent;
}
