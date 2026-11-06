const installButton=document.querySelector('.header-install');
const guide=document.getElementById('install-guide');
let installPrompt;
let installed=false;

function showGuide() {
  const title=guide.querySelector('#install-guide-title');
  const instructions=guide.querySelector('[data-bookmark-instructions]');
  const iosInstall=guide.querySelector('[data-ios-install]');
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  iosInstall.hidden=true;
  if(standalone||installed) {
    title.textContent='앱 설치 상태';
    instructions.textContent=standalone?'이미 이번주 축제를 앱으로 열고 있어요.':'이번주 축제를 앱으로 설치했어요.';
    guide.showModal();
    return;
  }
  title.textContent='북마크 저장';
  const {userAgent,platform,maxTouchPoints}=navigator;
  const ios=/iPhone|iPad|iPod/.test(userAgent)||(platform==='MacIntel'&&maxTouchPoints>1);
  if(ios) {
    instructions.textContent='Safari에서 공유 버튼 → 책갈피 추가를 선택하세요. 다른 브라우저에서는 메뉴의 북마크 추가를 선택하세요.';
    iosInstall.hidden=false;
  } else if(/Android/.test(userAgent)) {
    instructions.textContent='브라우저 더보기 메뉴(⋮)에서 별표 또는 북마크 추가를 누르세요.';
  } else {
    const shortcut=/Mac/.test(platform)?'⌘ + D':'Ctrl + D';
    instructions.textContent=shortcut+'를 누르거나 주소창의 별표로 이 페이지를 북마크에 추가하세요.';
  }
  guide.showModal();
}

if(installButton&&guide) {
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    installPrompt=event;
  });
  window.addEventListener('appinstalled',()=>{
    installPrompt=undefined;
    installed=true;
  });
  installButton.addEventListener('click',async()=>{
    const prompt=installPrompt;
    if(!prompt) {
      showGuide();
      return;
    }
    installPrompt=undefined;
    installButton.disabled=true;
    try {
      await prompt.prompt();
    } catch {
      showGuide();
    } finally {
      installButton.disabled=false;
    }
  });
  if(window.isSecureContext&&'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  }
}
