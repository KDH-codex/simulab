const key='simulab:saved-events:v1';
const id=document.body.dataset.eventId,title=document.body.dataset.eventTitle;
const buttons=[...document.querySelectorAll('[data-save-event]')];
const feedback=document.querySelector('[data-feedback]');
const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]').filter(x=>typeof x==='string')}catch{return []}};
const write=ids=>{try{localStorage.setItem(key,JSON.stringify(ids));return true}catch{return false}};
function sync(){
  const saved=read().includes(id);
  for(const b of buttons){b.setAttribute('aria-pressed',String(saved));b.textContent=saved?'♥ 저장됨':'♡ 일정 저장'}
}
buttons.forEach(b=>b.addEventListener('click',()=>{
  const current=read(),saved=current.includes(id),next=saved?current.filter(x=>x!==id):[...current,id];
  feedback.textContent=write(next)?(saved?'저장을 해제했습니다.':'이 기기의 일정 보관함에 저장했습니다.'):'브라우저 저장소를 사용할 수 없습니다.';
  sync();
}));
document.querySelector('[data-share-event]')?.addEventListener('click',async()=>{
  try{
    if(navigator.share)await navigator.share({title,url:location.href});
    else if(navigator.clipboard){await navigator.clipboard.writeText(location.href);feedback.textContent='링크를 복사했습니다.'}
    else feedback.textContent='주소창의 링크를 복사해 공유해 주세요.';
  }catch(error){if(error?.name!=='AbortError')feedback.textContent='공유 기능을 사용할 수 없습니다.'}
});
sync();
