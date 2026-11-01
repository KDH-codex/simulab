import { KidsOutingLogic, THEMES, SEARCH_REGIONS, REGION_SOURCES, DATA_REVIEWED_AT, normalizeSearchRegion, sourcesForRegionGroup, koreaToday, shiftDate, weekendRange, monthRange, filterEvents, occursOn, groupedCoverageForRange, isStale, isDate, escapeHtml as esc, safeUrl, eventStatus } from './logic.js?v=20261023_verified1';

function init() {
  const $ = id => document.getElementById(id);
  let today = koreaToday();
  const initialWeekend = weekendRange(today);
  let [year, month] = initialWeekend.start.split('-').map(Number);
  let rangeMode = 'weekend';
  let selectedDate = today;
  let view = matchMedia('(max-width: 760px)').matches ? 'list' : 'calendar';
  let region = '전체', theme = 'all', onlyFree = false, includeEnded = false;
  const params = new URLSearchParams(location.search);
  if (/^20\d{2}-(0[1-9]|1[0-2])$/.test(params.get('month') || '')) [year, month] = params.get('month').split('-').map(Number);
  if (['weekend', 'today', 'month', 'day', 'upcoming'].includes(params.get('range'))) rangeMode = params.get('range');
  if (isDate(params.get('date')) && params.get('date') >= '2000-01-01' && params.get('date') <= '2099-12-31') selectedDate = params.get('date'); else if (rangeMode === 'day') rangeMode = 'month';
  region = normalizeSearchRegion(params.get('region')) || '전체';
  if (Object.hasOwn(THEMES, params.get('theme'))) theme = params.get('theme');
  if (['list', 'calendar'].includes(params.get('view'))) view = params.get('view');
  onlyFree = params.get('free') === '1';
  includeEnded = params.get('ended') === '1';
  if (rangeMode === 'today' || rangeMode === 'weekend' || rangeMode === 'day') {
    const date = rangeMode === 'weekend' ? initialWeekend.start : rangeMode === 'today' ? today : selectedDate;
    [year, month] = date.split('-').map(Number);
  }

  $('themeChips').innerHTML = Object.entries(THEMES).map(([value, label]) => '<button type="button" data-theme="' + value + '">' + label + '</button>').join('');

  function range() {
    if (rangeMode === 'upcoming') return { start: today, end: shiftDate(today, 60) };
    if (rangeMode === 'today') return { start: today, end: today };
    if (rangeMode === 'weekend') return weekendRange(today);
    if (rangeMode === 'day') return { start: selectedDate, end: selectedDate };
    return monthRange(year, month);
  }
  function options() { return { region, theme, onlyFree, includeEnded, today }; }
  function renderCoverage() {
    const bounds=range(),records=KidsOutingLogic.getAllFestivals();
    const coverage=groupedCoverageForRange(records,bounds.start,bounds.end,today,{includeEnded});
    const total=coverage.reduce((sum,r)=>sum+r.count,0);
    $('coverageSummary').textContent=coverage.filter(r=>r.count).length+'개 권역 · '+total+'개 일정';
    $('regionCoverage').innerHTML=[{region:'전체',count:total},...coverage].map(r=>'<button type="button" data-region="'+esc(r.region)+'" aria-pressed="'+String(region===r.region)+'"><span>'+esc(r.region==='전체'?'전국':r.region)+'</span><strong>'+r.count+'</strong></button>').join('');
    const row=coverage.find(r=>r.region===region);
    const links=sourcesForRegionGroup(region,REGION_SOURCES).map(s=>'<a href="'+esc(safeUrl(s.url))+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(s.region+' '+s.publisher+' 공식 안내 새 창에서 보기')+'">'+esc(s.region)+' 공식 안내 ↗</a>').join(' · ');
    $('regionContext').hidden=region==='전체';
    $('regionContext').innerHTML=region==='전체'?'':
      '<strong>'+esc(region)+'</strong> · 선택 기간 '+row.count+'개 / 앞으로 60일 '+row.upcomingCount+'개'+(row.nextDate?' · 다음 수록일 '+esc(row.nextDate):'')+'<br>'+links;
  }
  function syncControls() {
    $('onlyFree').checked = onlyFree; $('includeEnded').checked = includeEnded;
    document.querySelectorAll('[data-theme]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.theme === theme)));
    document.querySelectorAll('[data-range]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.range === rangeMode)));
    document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    $('calendarPanel').hidden = view !== 'calendar';
  }
  function renderCalendar() {
    $('currentMonthHeading').textContent = year + '년 ' + month + '월';
    $('btnPrevMonth').disabled = year === 2000 && month === 1;
    $('btnNextMonth').disabled = year === 2099 && month === 12;
    const grid = $('calendarUnifiedGrid');
    grid.replaceChildren();
    const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
    weekdays.forEach((name, i) => { const cell = document.createElement('div'); cell.className = 'outing-weekday ' + (i === 5 ? 'sat' : i === 6 ? 'sun' : ''); cell.textContent = name; grid.append(cell); });
    const bounds = monthRange(year, month);
    const offset = (new Date(bounds.start + 'T00:00:00Z').getUTCDay() + 6) % 7;
    const days = Number(bounds.end.slice(-2));
    const total = Math.ceil((offset + days) / 7) * 7;
    const monthEvents = filterEvents({ ...bounds, ...options() });
    const selected = range();
    for (let index = 0; index < total; index++) {
      const day = index - offset + 1;
      if (day < 1 || day > days) { const empty = document.createElement('div'); empty.className = 'outing-day outside'; empty.setAttribute('aria-hidden', 'true'); grid.append(empty); continue; }
      const date = bounds.start.slice(0, 8) + String(day).padStart(2, '0');
      const events = monthEvents.filter(event => occursOn(event, date));
      const cell = document.createElement('button');
      cell.type = 'button'; cell.className = 'outing-day';
      if (index % 7 === 5) cell.classList.add('sat');
      if (index % 7 === 6) cell.classList.add('sun');
      if (date < today) cell.classList.add('past');
      if (date === today) { cell.classList.add('today'); cell.setAttribute('aria-current', 'date'); }
      const active = date >= selected.start && date <= selected.end;
      cell.classList.toggle('selected', active); cell.setAttribute('aria-pressed', String(active));
      cell.dataset.date = date;
      cell.setAttribute('aria-label', year + '년 ' + month + '월 ' + day + '일 ' + weekdays[index % 7] + '요일, 확인한 행사 ' + events.length + '개');
      cell.innerHTML = '<span class="outing-day-number"><span>' + day + '</span>' + (events.length ? '<small>' + events.length + '개</small>' : '') + '</span>' +
        events.slice(0, 2).map(event => '<span class="outing-day-event ' + event.theme + '">' + esc(event.title.replace(/^20\d{2}\s+/, '')) + '</span>').join('') +
        (events.length > 2 ? '<span class="outing-more">+' + (events.length - 2) + '개 더</span>' : '');
      grid.append(cell);
    }
  }
  function card(event) {
    const period = event.startDate === event.endDate ? event.startDate : event.startDate + ' ~ ' + event.endDate;
    const source = event.sources[0];
    const rows = [['장소', event.location], ['시간', event.time], ['비용', event.fee], ['예약', event.booking]];
    return '<article class="outing-event">' +
      '<div class="outing-event-meta"><span>' + esc(event.region) + '</span><span>' + esc(THEMES[event.theme]) + '</span><span class="status">' + esc(eventStatus(event, today)) + '</span></div>' +
      '<h4>' + esc(event.title) + '</h4><p class="outing-event-period">' + esc(period) + '</p>' +
      (event.scheduleNote ? '<p class="outing-event-notes"><strong>'+(event.scheduleType==='period'?'개최기간 안내':'운영일 안내')+'</strong><br>' + esc(event.scheduleNote) + '</p>' : '') +
      '<dl>' + rows.map(([label, value]) => '<dt>' + label + '</dt><dd>' + esc(value) + '</dd>').join('') + '</dl>' +
      '<p class="outing-event-notes"><strong>' + esc(event.program) + '</strong><br>' + esc(event.familyNote) + '</p>' +
      '<div class="outing-event-source"><p>출처: ' + event.sources.map(s => '<a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(s.publisher) + '</a>').join(' · ') +
      '<br>확인일 ' + esc(event.checkedAt) + (isStale(event.checkedAt, today) ? ' · 확인 후 7일 경과, 최신 공지 재확인 필요' : ' · 일정·장소 확인') + '</p>' +
      '<a class="outing-official-link" href="' + esc(safeUrl(source.url)) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(event.title) + ' 공식 안내 새 창에서 보기">공식 안내 · 예약 조건 확인 ↗</a></div></article>';
  }
  function renderResults() {
    const bounds = range();
    const events = filterEvents({ ...bounds, ...options() });
    const labels = { weekend: '이번 주말', today: '오늘', month: '선택한 달', day: '선택한 날짜', upcoming:'앞으로 60일' };
    $('rangeCaption').textContent = labels[rangeMode] + ' · ' + bounds.start + (bounds.end !== bounds.start ? ' ~ ' + bounds.end : '');
    $('resultsTitle').textContent = (region === '전체' ? '전국' : region) + ' 행사 ' + events.length + '개';
    $('resultsStatus').textContent = '일정순 · ' + (includeEnded ? '지난 행사 포함' : '종료된 행사 제외') + ' · 개최기간 표시가 매일 운영을 뜻하지는 않습니다.';
    $('festivalCardsGrid').innerHTML = events.length ? events.map(card).join('') :
      '<div class="outing-empty"><h4>이 조건에 수록한 일정이 아직 없습니다</h4><p>실제로 행사가 없다는 뜻은 아닙니다.<br>앞으로의 일정을 보거나 위 지역별 공식 안내를 확인해 보세요.</p><button type="button" data-action="upcoming">앞으로 60일 보기</button><button type="button" data-action="reset">조건 초기화</button></div>';
  }
  function render() {
    today = koreaToday();
    syncControls(); renderCoverage(); renderCalendar(); renderResults();
    const notice = $('freshnessNotice');
    notice.classList.toggle('stale', isStale(DATA_REVIEWED_AT, today));
    notice.textContent = isStale(DATA_REVIEWED_AT, today) ?
      '마지막 검토일 ' + DATA_REVIEWED_AT + '로부터 7일 이상 지났습니다. 아래 정보는 검토 당시의 기록이며, 방문 전 공식 공지를 다시 확인해 주세요.' :
      '전국 모든 행사를 담은 목록은 아닙니다. 공지 확인 이후 변경·취소될 수 있으니 출발 전 공식 안내를 확인하세요.';
  }
  function reset() {
    today = koreaToday(); region = '전체'; theme = 'all'; onlyFree = false; includeEnded = false; rangeMode = 'weekend';
    [year, month] = weekendRange(today).start.split('-').map(Number); render();
  }
  $('filterForm').addEventListener('submit', event => event.preventDefault());
  $('filterForm').addEventListener('reset', event => { event.preventDefault(); reset(); });
  $('regionCoverage').addEventListener('click',event=>{
    const button=event.target.closest('[data-region]');
    if(!button||!SEARCH_REGIONS.includes(button.dataset.region))return;
    region=button.dataset.region;render();
    document.querySelector('[data-region="'+region+'"]')?.focus({preventScroll:true});
  });
  $('onlyFree').addEventListener('change', event => { onlyFree = event.target.checked; render(); });
  $('includeEnded').addEventListener('change', event => { includeEnded = event.target.checked; render(); });
  $('themeChips').addEventListener('click', event => { const button = event.target.closest('[data-theme]'); if (button) { theme = button.dataset.theme; render(); } });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { view = button.dataset.view; render(); }));
  document.querySelectorAll('[data-range]').forEach(button => button.addEventListener('click', () => {
    rangeMode = button.dataset.range;
    if (rangeMode !== 'month') [year, month] = (rangeMode === 'weekend' ? weekendRange(koreaToday()).start : koreaToday()).split('-').map(Number);
    render();
  }));
  $('calendarUnifiedGrid').addEventListener('click', event => {
    const button = event.target.closest('[data-date]'); if (!button) return;
    selectedDate = button.dataset.date; rangeMode = 'day'; render();
    // Re-rendered controls retain keyboard focus; results are announced in the live region.
    document.querySelector('[data-date="' + selectedDate + '"]')?.focus({ preventScroll: true });
  });
  function moveMonth(delta) {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    if (next.getUTCFullYear() < 2000 || next.getUTCFullYear() > 2099) return;
    year = next.getUTCFullYear(); month = next.getUTCMonth() + 1; rangeMode = 'month';
    if (monthRange(year, month).end < today) includeEnded = true;
    render();
  }
  $('btnPrevMonth').addEventListener('click', () => moveMonth(-1));
  $('btnNextMonth').addEventListener('click', () => moveMonth(1));
  $('festivalCardsGrid').addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'reset') reset();
    if (action === 'upcoming') { rangeMode = 'upcoming'; [year,month]=today.split('-').map(Number); render(); }
  });
  $('shareFilters').addEventListener('click', async () => {
    const url = new URL(location.href); url.search = ''; url.hash = '';
    const values = { month: year + '-' + String(month).padStart(2, '0'), range: rangeMode, region, theme, view };
    if (rangeMode === 'day') values.date = selectedDate;
    if (onlyFree) values.free = '1';
    if (includeEnded) values.ended = '1';
    Object.entries(values).forEach(([key, value]) => url.searchParams.set(key, value));
    history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url.href); $('shareStatus').textContent = '선택 조건 링크를 복사했습니다.'; }
    catch { $('shareStatus').textContent = '주소창의 링크를 복사해 공유하세요: ' + url.href; }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && today !== koreaToday()) render(); });
  render();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
