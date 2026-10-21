/**
 * ==========================================================================
 * [시뮬랩 공통 Supabase 클라우드 설정 파일] (assets/js/supabase-config.js)
 * --------------------------------------------------------------------------
 * 사용자 안내:
 * 본 파일에 설정된 Supabase 접속 정보를 통해:
 * 1) 미니게임 실시간 랭킹 (명예의 전당 TOP 10)
 * 2) 방문자 행동 분석 및 관리자 대시보드 (Admin Dashboard)
 * 가 전세계 실시간 온라인 모드로 연결됩니다!
 * ==========================================================================
 */

(function (global) {
  'use strict';

  // 1. Supabase 접속 정보 (연결 완료)
  const CONFIG = {
    // Supabase Project URL (끝자리는 .co 도메인)
    URL: 'https://lgbkovxhzixclesapehl.supabase.co',
    
    // Project API keys 중 'anon' (public) 공개 키
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnYmtvdnhoeml4Y2xlc2FwZWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NDIwMTAsImV4cCI6MjEwODExODAxMH0.7sYeCt7HVO4Vyrg7LMpuc_QAtVAzUCYN6WXPAjL7lDA'
  };

  // 2. 전역 네임스페이스 등록
  global.SIMULAB_SUPABASE_CONFIG = {
    get url() {
      let raw = (CONFIG.URL || '').trim().replace(/\/+$/, '');
      // .com으로 잘못 입력된 경우 .co로 자동 보정
      if (raw.endsWith('.supabase.com')) {
        raw = raw.replace(/\.supabase\.com$/, '.supabase.co');
      }
      return raw;
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
