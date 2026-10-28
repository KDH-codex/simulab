import {criteria,models,readBallots,saveBallot,validBallot} from './debate-verdict.js';
let browserStorage;try{browserStorage=window.localStorage;}catch{browserStorage=null;}
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const turns = [...document.querySelectorAll('[data-step]')];
  const total = turns.length;

  let started = false;
  let mode = 'step';
  let shown = 1;
  let saved = null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function goTo(element) { element.scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'}); }
  function render() {
    $('#waiting-message').hidden = started;
    turns.forEach((turn, index) => {turn.hidden = !started || (mode === 'step' && index >= shown);});
    $('#closings').hidden = !started || (mode === 'step' && shown < 7);
    $('#closing-vote-call').hidden = !started || (mode === 'step' && shown < total);
    $('#turn-controls').hidden = !started;
    $('#previous-button').disabled = mode === 'all' || shown <= 1;
    $('#next-button').textContent = mode === 'all' || shown === total ? '투표하러 가기 →' : shown === 6 ? '100자 최후변론 →' : shown === 7 ? 'GPT의 마지막 한마디 →' : '다음 발언 →';
    $('#progress-text').textContent = !started ? '시작 전' : mode === 'all' ? `전체 보기 · 본 토론 6 + 최후 2` : shown <= 6 ? `본 토론 ${shown} / 6 · 전체 ${shown} / ${total}` : `최후변론 ${shown-6} / 2 · 전체 ${shown} / ${total}`;
    $('#progress-fill').style.width = `${!started ? 0 : mode === 'all' ? 100 : shown / total * 100}%`;
    $('#mode-toggle').textContent = mode === 'all' ? '한 차례씩 보기' : '전체 펼치기';
    $('#mode-toggle').setAttribute('aria-pressed', String(mode === 'all'));
    document.querySelectorAll('[data-round]').forEach(button => {
      const active = started && (mode === 'all' || Number(button.dataset.round) === Math.ceil(shown / 2));
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  function start(all = false) {started = true; mode = all ? 'all' : 'step'; if (!all) shown = 1; render(); goTo($('#debate'));}
  $('#start-button').addEventListener('click', () => start());
  $('#show-all-top').addEventListener('click', () => start(true));
  $('#mode-toggle').addEventListener('click', () => {started = true; mode = mode === 'all' ? 'step' : 'all'; render();});
  $('#next-button').addEventListener('click', () => {
    if (mode === 'all' || shown === total) {goTo($('#jury')); return;}
    shown++; render(); goTo(turns[shown - 1]);
  });
  $('#previous-button').addEventListener('click', () => {shown = Math.max(1, shown - 1); render(); goTo(turns[shown - 1]);});
  document.querySelectorAll('[data-round]').forEach(button => button.addEventListener('click', () => {
    started = true; shown = (Number(button.dataset.round) - 1) * 2 + 1; render(); goTo(turns[shown - 1]);
  }));
  const comment = $('#verdict-comment');
  comment.addEventListener('input', () => {comment.setCustomValidity(''); $('#comment-count').textContent = `${comment.value.length} / 300`;});
  function renderOutcomes(){for(const [id] of criteria){const selected=document.querySelector('input[name="'+id+'"]:checked');document.querySelectorAll('input[name="'+id+'"]').forEach(input=>{input.closest('label').querySelector('.outcome').textContent=selected?(input.checked?'승리':'패배'):'승리로 선택';});}}
document.querySelectorAll('.criterion input').forEach(input=>input.addEventListener('change',renderOutcomes));
function renderSaved(){const valid=validBallot(saved);$('#saved-verdict').hidden=!valid;$('#verdict-form').hidden=valid;if(valid){$('#saved-model').textContent='세 가지 판정 완료';$('#saved-breakdown').replaceChildren(...criteria.map(([id,label])=>{const p=document.createElement('p');p.textContent=label+' · '+saved[id]+' 승리 / '+models.find(model=>model!==saved[id])+' 패배';return p;}));$('#saved-comment').textContent=saved.comment;}}
saved=readBallots(browserStorage).find(b=>b.episodeId==='001')||null;renderSaved();
$('#verdict-form').addEventListener('submit',event=>{event.preventDefault();const selections=Object.fromEntries(criteria.map(([id])=>[id,document.querySelector('input[name="'+id+'"]:checked')?.value]));saved={episodeId:'001',...selections,comment:comment.value.trim(),createdAt:new Date().toISOString()};if(!validBallot(saved))return;let stored=true;try{saveBallot(browserStorage,saved);}catch{stored=false;}renderSaved();$('#form-status').textContent=stored?'세 항목의 판정을 이 브라우저에 저장했습니다. 대시보드에서 내 전적을 확인하세요.':'브라우저 저장이 제한되어 현재 탭에만 임시 표시합니다.';});
$('#edit-verdict').addEventListener('click',()=>{if(saved){for(const [id]of criteria)document.querySelector('input[name="'+id+'"][value="'+saved[id]+'"]').checked=true;comment.value=saved.comment;$('#comment-count').textContent=comment.value.length+' / 300';}renderOutcomes();$('#saved-verdict').hidden=true;$('#verdict-form').hidden=false;$('#form-status').textContent='';});
  const dialog = $('#results-dialog');
  $('#results-button').addEventListener('click', () => dialog.showModal());
  $('#close-dialog').addEventListener('click', () => dialog.close());
  $('#confirm-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {if (event.target === dialog) {const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();}});
  const dock = $('.topic-dock');
  const updateOffset = () => document.documentElement.style.setProperty('--topic-offset', `${Math.ceil(dock.getBoundingClientRect().height)+14}px`);
  new ResizeObserver(updateOffset).observe(dock);
  updateOffset();
  render();
})();
