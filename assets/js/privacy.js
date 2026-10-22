(function (global) {
  'use strict';
  const KEY = 'simulab_privacy_v3';
  const settings = global.SIMULAB_SITE_SETTINGS || {};
  let preferences = { analytics: false }, hasChoice = false;
  try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved?.version === 3) { preferences.analytics = saved.analytics === true; hasChoice = true; } } catch {}
  const ready = settings.analyticsEnabled === true && Boolean(settings.contactEmail && settings.databaseRegion);
  function save(analytics) {
    preferences = { analytics: ready && analytics === true }; hasChoice = true;
    try { localStorage.setItem(KEY, JSON.stringify({version:3,...preferences})); } catch {}
    global.dispatchEvent(new CustomEvent('simulab:privacychange'));
  }
  function openPreferences() {
    if (document.getElementById('privacy-dialog')) return;
    const dialog = document.createElement('dialog'); dialog.id = 'privacy-dialog'; dialog.className = 'privacy-dialog';
    dialog.setAttribute('aria-labelledby','privacy-title');
    dialog.innerHTML = '<h2 id="privacy-title">개인정보 설정</h2><p>즐겨찾기와 게임 기록의 기기 저장은 서비스 기능에 사용됩니다. 선택 통계는 허용한 경우에만 전송합니다.</p>' +
      (ready ? '<label class="privacy-option"><input type="checkbox" id="privacy-analytics"> 방문 통계 허용</label><p>페이지와 도구 이용 횟수를 분석합니다. 계산 입력값과 이름 검색어는 전송하지 않습니다.</p>' : '<p class="privacy-note">방문 통계의 신규 전송은 운영 정보 확인을 마칠 때까지 보류 중입니다.</p>') +
      '<p>광고는 현재 준비 중입니다. 개인정보 설정은 언제든지 다시 열 수 있습니다.</p><div class="privacy-actions"><button type="button" data-save="no">필수 기능만 사용</button><button type="button" data-save="yes">설정 저장</button><button type="button" data-close>닫기</button></div>';
    document.body.append(dialog);
    const checkbox=dialog.querySelector('input'); if(checkbox) checkbox.checked=preferences.analytics;
    dialog.querySelectorAll('[data-save]').forEach(button=>button.addEventListener('click',()=>{save(button.dataset.save==='yes' && checkbox?.checked);dialog.close();}));
    dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>dialog.remove(),{once:true}); dialog.showModal();
  }
  global.SimuLabPrivacy = { analyticsAllowed:()=>ready && preferences.analytics, openPreferences };
  document.querySelectorAll('[data-privacy-settings]').forEach(button=>button.addEventListener('click',openPreferences));
  document.querySelectorAll('[data-contact-email]').forEach(element=>{
    if(settings.contactEmail) { element.textContent=settings.contactEmail; element.setAttribute('href','mailto:'+settings.contactEmail); }
    else { element.textContent='문의 이메일 준비 중'; element.removeAttribute('href'); }
  });
  if (ready && !hasChoice && !/\/(legal|admin)\/|\/admin-dashboard\//.test(location.pathname)) {
    const banner=document.createElement('aside'); banner.className='privacy-banner'; banner.setAttribute('aria-label','방문 통계 선택');
    banner.innerHTML='<p>도구 이용 통계를 허용하시겠어요? 계산 입력값은 전송하지 않습니다.</p><div><button type="button" data-no>필수 기능만</button><button type="button" data-yes>방문 통계 허용</button></div>';
    banner.querySelector('[data-no]').addEventListener('click',()=>{save(false);banner.remove();});
    banner.querySelector('[data-yes]').addEventListener('click',()=>{save(true);banner.remove();}); document.body.append(banner);
  }
})(window);
