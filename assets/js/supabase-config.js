/**
 * ==========================================================================
 * [시뮬랩 공통 Supabase 클라우드 설정 파일] (assets/js/supabase-config.js)
 * --------------------------------------------------------------------------
 * 사용자 안내:
 * 본인의 Supabase 프로젝트를 생성하신 후 아래 2개 항목에 복사한 값을 넣어주시면,
 * 1) 미니게임 실시간 랭킹 (명예의 전당)
 * 2) 방문자 행동 분석 및 관리자 대시보드 (Admin Dashboard)
 * 가 자동으로 전세계 실시간 온라인 모드로 활성화됩니다!
 * 
 * ※ 아무것도 입력하지 않아도 사이트는 브라우저 로컬 저장소 모드로 안전하게 작동합니다.
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // 1. Supabase 접속 정보 (대시보드 > Project Settings > API 에서 확인)
  const CONFIG = {
    // 예: 'https://xyzabcdefghijklmnop.supabase.co'
    URL: '',
    
    // Project API keys 중 'anon' (public) 공개 키를 붙여넣으세요.
    ANON_KEY: ''
  };

  // 2. 전역 네임스페이스 등록
  global.SIMULAB_SUPABASE_CONFIG = {
    get url() {
      return (CONFIG.URL || '').trim().replace(/\/+$/, '');
    },
    get anonKey() {
      return (CONFIG.ANON_KEY || '').trim();
    },
    // 클라우드가 활성화되어 있는지 여부
    get isEnabled() {
      return Boolean(this.url && this.anonKey);
    },
    // 외부에서 동적으로 키를 주입할 수 있는 헬퍼
    set: function (newUrl, newKey) {
      if (newUrl) CONFIG.URL = newUrl;
      if (newKey) CONFIG.ANON_KEY = newKey;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
