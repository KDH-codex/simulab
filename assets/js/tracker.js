/**
 * ==========================================================================
 * [시뮬랩 방문자 행동 및 사용자 여정 추적기] (assets/js/tracker.js)
 * --------------------------------------------------------------------------
 * 방문자가 어떤 계산기로 제일 먼저 들어왔는지(Landing Page),
 * 그 다음 어디로 이동했는지(User Flow), 도구별 클릭 횟수와 인터랙션을
 * 자동으로 기록하여 자체 관리자 대시보드(Supabase/로컬) 및 GA4로 전달합니다.
 * ==========================================================================
 */

(function () {
    'use strict';

    // 1. 세션 식별자 및 스토리지 키
    const SESSION_KEY = 'simulab_session_id';
    const JOURNEY_KEY = 'simulab_user_journey';
    const LOCAL_ANALYTICS_KEY = 'simulab_local_analytics_v1';

    // 2. Supabase 접속 정보 취득 헬퍼
    function getSupabaseConfig() {
        const cfg = window.SIMULAB_SUPABASE_CONFIG;
        if (cfg && cfg.isEnabled) {
            return {
                url: cfg.url,
                anonKey: cfg.anonKey
            };
        }
        return null;
    }

    /**
     * 방문자 브라우저별 고유 세션 ID 취득 (익명화)
     */
    function getSessionId() {
        let sid = sessionStorage.getItem(SESSION_KEY);
        if (!sid) {
            sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            sessionStorage.setItem(SESSION_KEY, sid);
        }
        return sid;
    }

    /**
     * 현재 도구 식별자 추출 (예: 'past-apt-timemachine')
     */
    function getCurrentToolId() {
        const path = window.location.pathname;
        const match = path.match(/tools\/([^/]+)/);
        if (match && match[1]) {
            return match[1];
        }
        if (path === '/' || path.endsWith('index.html')) {
            return 'home-portal';
        }
        return 'other';
    }

    /**
     * 사용자 이동 여정(User Journey) 기록
     */
    function recordUserJourney(toolId) {
        try {
            let journey = JSON.parse(sessionStorage.getItem(JOURNEY_KEY) || '[]');
            const lastTool = journey.length > 0 ? journey[journey.length - 1] : null;

            // 중복 연속 방문이 아닌 경우 기록
            if (lastTool !== toolId) {
                journey.push({
                    tool: toolId,
                    timestamp: Date.now()
                });
                sessionStorage.setItem(JOURNEY_KEY, JSON.stringify(journey));
            }
            return journey;
        } catch (e) {
            return [];
        }
    }

    /**
     * 로컬 분석 데이터베이스 업데이트 (관리자 대시보드 오프라인/실시간 렌더링용)
     */
    function updateLocalAnalytics(toolId, isLanding) {
        try {
            const raw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

            let data = raw ? JSON.parse(raw) : {
                daily: {},         // 일별 UV, PV
                toolRanking: {},   // 도구별 총 뷰수
                landingPages: {},  // 첫 진입 페이지별 카운트
                recentEvents: []   // 최근 발생한 실시간 이벤트 로그
            };

            // 일별 통계
            if (!data.daily[dateStr]) {
                data.daily[dateStr] = { uv: 0, pv: 0, sessions: {} };
            }
            const sid = getSessionId();
            if (!data.daily[dateStr].sessions[sid]) {
                data.daily[dateStr].sessions[sid] = true;
                data.daily[dateStr].uv = Object.keys(data.daily[dateStr].sessions).length;
            }
            data.daily[dateStr].pv += 1;

            // 도구별 순위
            data.toolRanking[toolId] = (data.toolRanking[toolId] || 0) + 1;

            // 첫 진입 페이지 집계
            if (isLanding) {
                data.landingPages[toolId] = (data.landingPages[toolId] || 0) + 1;
            }

            // 최근 이벤트 로그 (최대 100건 보관)
            data.recentEvents.unshift({
                time: now.toLocaleTimeString('ko-KR', { hour12: false }),
                tool: toolId,
                action: isLanding ? '첫 진입 (Landing)' : '페이지 조회 (PageView)',
                sid: sid.substring(0, 10)
            });
            if (data.recentEvents.length > 100) {
                data.recentEvents.pop();
            }

            localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('[SimuLab Tracker] 로컬 스토리지 기록 실패:', e);
        }
    }

    /**
     * [Supabase 클라우드] 페이지뷰 실시간 비동기 전송
     */
    async function sendPageviewToSupabase(toolId, isLanding) {
        const config = getSupabaseConfig();
        if (!config) return;

        try {
            const payload = {
                session_id: getSessionId(),
                tool_id: toolId,
                path: window.location.pathname,
                referrer: document.referrer || '',
                is_landing_page: Boolean(isLanding),
                user_agent: navigator.userAgent || ''
            };

            await fetch(`${config.url}/rest/v1/analytics_pageviews`, {
                method: 'POST',
                headers: {
                    'apikey': config.anonKey,
                    'Authorization': `Bearer ${config.anonKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            // 통계 전송 실패는 사용자 경험을 방해하지 않도록 조용히 넘김
            console.debug('[SimuLab Tracker] Supabase PV 전송 스킵:', err.message);
        }
    }

    /**
     * [Supabase 클라우드] 사용자 인터랙션 이벤트 실시간 비동기 전송
     */
    async function sendEventToSupabase(toolId, action, label, category) {
        const config = getSupabaseConfig();
        if (!config) return;

        try {
            const payload = {
                session_id: getSessionId(),
                tool_id: toolId,
                event_category: category || 'interaction',
                event_action: String(action),
                event_label: String(label || '')
            };

            await fetch(`${config.url}/rest/v1/analytics_events`, {
                method: 'POST',
                headers: {
                    'apikey': config.anonKey,
                    'Authorization': `Bearer ${config.anonKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.debug('[SimuLab Tracker] Supabase Event 전송 스킵:', err.message);
        }
    }

    // 3. 전역 트래커 인터페이스 등록
    window.SimuLabTracker = {
        // 커스텀 이벤트 기록 (계산 실행, 버튼 클릭 등)
        trackEvent: function (action, label, category = 'interaction') {
            const toolId = getCurrentToolId();
            const sid = getSessionId();

            // 1) GA4로 전송 (gtag 활성화 시)
            if (typeof window.gtag === 'function') {
                window.gtag('event', action, {
                    event_category: category,
                    event_label: label,
                    tool_id: toolId
                });
            }

            // 2) 로컬 스토리지 로그 업데이트
            try {
                const raw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
                if (raw) {
                    const data = JSON.parse(raw);
                    data.recentEvents.unshift({
                        time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
                        tool: toolId,
                        action: `${action} (${label || ''})`,
                        sid: sid.substring(0, 10)
                    });
                    if (data.recentEvents.length > 100) data.recentEvents.pop();
                    localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(data));
                }
            } catch (e) {}

            // 3) Supabase 클라우드로 실시간 전송
            sendEventToSupabase(toolId, action, label, category);
        }
    };

    // 4. 페이지 로드 시 즉시 자동 실행
    document.addEventListener('DOMContentLoaded', () => {
        const toolId = getCurrentToolId();
        const isLanding = !sessionStorage.getItem('simulab_has_visited');
        sessionStorage.setItem('simulab_has_visited', 'true');

        recordUserJourney(toolId);
        updateLocalAnalytics(toolId, isLanding);
        sendPageviewToSupabase(toolId, isLanding);

        // GA4 페이지뷰 전송
        if (typeof window.gtag === 'function') {
            window.gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
                page_path: window.location.pathname,
                tool_id: toolId,
                landing: isLanding
            });
        }
    });
})();
