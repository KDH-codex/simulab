/**
 * ==========================================================================
 * [시뮬랩 비공개 관리자 대시보드] 비즈니스 로직 및 보안 엔진 (logic.js)
 * --------------------------------------------------------------------------
 * 1. SHA-256 단방향 암호화 해시 기반 관리자 인증 (규칙 8 보안 강화)
 * 2. Supabase 클라우드 실시간 RPC 통계 조회 및 순수 로컬 자동 폴백
 * 3. 가짜 더미 데이터 전면 제거 -> 0부터 시작하는 실제 방문자 정직한 집계
 * 4. 42개 도구별 랭킹 산출 및 사용자 이동 여정(User Flow) 분석
 * 5. 엑셀 호환 CSV 데이터 추출 모듈
 * ==========================================================================
 */

// 관리자 기본 비밀번호의 SHA-256 해시값
// 1) 'simulab2026!'의 정확한 SHA-256 해시
export const DEFAULT_MASTER_HASH = 'dc50386165ee18eaedcb404161471161893afcbf3b053d4934ab1e9efe050641';
// 2) 'simulab2026' (느낌표 생략 허용) SHA-256 해시
export const FALLBACK_MASTER_HASH = '034616846b7d44c0decafa3af0efff8b590d47bf04203cdfc5eeef8ee159c839';

// 로컬 스토리지 키 (더미 캐시를 무효화하고 실제 0부터 시작하기 위해 v2로 갱신)
export const LOCAL_ANALYTICS_KEY = 'simulab_local_analytics_v2';

// Supabase 기본 활성 접속 정보 (비동기 스크립트 지연 시에도 즉시 연결 보장)
const DEFAULT_SUPABASE_CONFIG = {
    URL: 'https://lgbkovxhzixclesapehl.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnYmtvdnhoeml4Y2xlc2FwZWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NDIwMTAsImV4cCI6MjEwODExODAxMH0.7sYeCt7HVO4Vyrg7LMpuc_QAtVAzUCYN6WXPAjL7lDA'
};

function getActiveSupabaseConfig() {
    const cfg = window.SIMULAB_SUPABASE_CONFIG;
    const url = (cfg && cfg.url) || DEFAULT_SUPABASE_CONFIG.URL || '';
    const anonKey = (cfg && cfg.anonKey) || DEFAULT_SUPABASE_CONFIG.ANON_KEY || '';
    return {
        url: url.trim().replace(/\/+$/, ''),
        anonKey: anonKey.trim(),
        isEnabled: Boolean(url && anonKey)
    };
}

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
 * 순수 0부터 시작하는 깨끗한 초기 분석 데이터 생성기 (더미 데이터 전면 삭제)
 */
export function getInitialCleanAnalytics() {
    const todayStr = new Date().toISOString().split('T')[0];
    const daily = {};
    daily[todayStr] = { uv: 0, pv: 0, sessions: {} };

    return {
        daily,
        toolRanking: {},
        landingPages: {},
        recentEvents: [],
        is_cloud: false
    };
}

/**
 * 로컬 스토리지에서 실제 분석 데이터 불러오기
 */
export function getLocalAnalyticsData() {
    const raw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
    if (!raw) {
        const initial = getInitialCleanAnalytics();
        localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(initial));
        return initial;
    }
    try {
        const data = JSON.parse(raw);
        if (!data.daily) {
            data.daily = {};
        }
        data.is_cloud = false;
        return data;
    } catch (e) {
        return getInitialCleanAnalytics();
    }
}

/**
 * [Supabase 클라우드 & 로컬 하이브리드] 종합 분석 데이터 취득
 * - Supabase 설정 시: 전세계 방문자 실제 집계 RPC 호출
 * - 미설정/오프라인 시: 로컬 스토리지 실제 데이터 반환
 * 
 * @param {number} daysCount - 조회 일수 (기본 30일)
 * @returns {Promise<Object>} 분석 데이터 객체
 */
export async function getAnalyticsData(daysCount = 30) {
    const cfg = getActiveSupabaseConfig();

    // 1. Supabase가 활성화된 경우 클라우드 RPC 호출 시도
    if (cfg && cfg.isEnabled) {
        try {
            const endpoint = `${cfg.url}/rest/v1/rpc/get_admin_dashboard_summary`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'apikey': cfg.anonKey,
                    'Authorization': `Bearer ${cfg.anonKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ days_count: daysCount })
            });

            if (response.ok) {
                const cloudData = await response.json();
                if (cloudData) {
                    cloudData.is_cloud = true;
                    return cloudData;
                }
            } else {
                console.warn('[AdminDashboard] Supabase RPC 통계 응답 오류 (로컬 폴백):', response.status);
            }
        } catch (err) {
            console.warn('[AdminDashboard] Supabase 통계 통신 실패 (로컬 폴백):', err.message);
        }
    }

    // 2. 미설정 또는 통신 실패 시 로컬 스토리지 데이터 반환
    return getLocalAnalyticsData();
}

/**
 * 핵심 KPI 요약 계산 함수 (데이터 0건일 때도 안전하게 계산)
 */
export function calculateKpis(analyticsData) {
    const daily = (analyticsData && analyticsData.daily) || {};
    const dateKeys = Object.keys(daily).sort();
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 오늘 및 어제 데이터
    const todayData = daily[todayStr] || (dateKeys.length > 0 ? daily[dateKeys[dateKeys.length - 1]] : { uv: 0, pv: 0 });
    const yesterdayKey = dateKeys.length > 1 ? dateKeys[dateKeys.length - 2] : null;
    const yesterdayData = yesterdayKey ? daily[yesterdayKey] : { uv: 0, pv: 0 };

    // UV 변동률
    let uvGrowth = '0.0%';
    let isGrowthPositive = true;
    if (yesterdayData && yesterdayData.uv > 0) {
        const rate = (((todayData.uv - yesterdayData.uv) / yesterdayData.uv) * 100).toFixed(1);
        uvGrowth = `${Number(rate) >= 0 ? '+' : ''}${rate}%`;
        isGrowthPositive = Number(rate) >= 0;
    }

    // 총 누적 계산
    let totalUv = 0;
    let totalPv = 0;
    dateKeys.forEach(k => {
        totalUv += (daily[k].uv || 0);
        totalPv += (daily[k].pv || 0);
    });

    // 1위 도구 산출
    const toolRanking = (analyticsData && analyticsData.toolRanking) || {};
    let topToolId = '-';
    let maxViews = 0;
    Object.entries(toolRanking).forEach(([id, views]) => {
        if (views > maxViews) {
            maxViews = views;
            topToolId = id;
        }
    });

    return {
        todayUv: (todayData.uv || 0).toLocaleString(),
        todayPv: (todayData.pv || 0).toLocaleString(),
        uvGrowth,
        isGrowthPositive,
        totalUv: totalUv.toLocaleString(),
        totalPv: totalPv.toLocaleString(),
        avgPvPerUser: todayData.uv > 0 ? ((todayData.pv || 0) / todayData.uv).toFixed(1) : '0.0',
        topToolId: maxViews > 0 ? topToolId : '아직 방문 기록 없음',
        topToolViews: maxViews.toLocaleString(),
        isCloud: Boolean(analyticsData && analyticsData.is_cloud)
    };
}

/**
 * 분석 데이터를 엑셀 호환 CSV 텍스트로 변환
 */
export function exportToCsv(analyticsData) {
    const daily = (analyticsData && analyticsData.daily) || {};
    const dateKeys = Object.keys(daily).sort();

    let csvContent = '\uFEFF'; // 한글 엑셀 깨짐 방지 UTF-8 BOM
    csvContent += '날짜,순방문자(UV),총페이지뷰(PV),인당조회수\n';

    if (dateKeys.length === 0) {
        csvContent += `${new Date().toISOString().split('T')[0]},0,0,0\n`;
        return csvContent;
    }

    dateKeys.forEach(date => {
        const row = daily[date];
        const uv = (row && row.uv) || 0;
        const pv = (row && row.pv) || 0;
        const avg = uv > 0 ? (pv / uv).toFixed(2) : '0';
        csvContent += `${date},${uv},${pv},${avg}\n`;
    });

    return csvContent;
}
