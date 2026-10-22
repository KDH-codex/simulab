(function (global) {
  'use strict';
  // Fill verified operating details before enabling optional analytics or ads.
  global.SIMULAB_SITE_SETTINGS = Object.freeze({
    contactEmail: '', operatorName: 'SimuLab 운영팀',
    analyticsEnabled: false, analyticsRetentionDays: 30, databaseRegion: 'ap-south-1',
    rankingRemoteEnabled: false,
    adsEnabled: false, adsenseClient: 'ca-pub-9815778998394475',
    policyUpdatedAt: '2026-10-23'
  });
})(typeof window !== 'undefined' ? window : globalThis);
