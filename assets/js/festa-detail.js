/**
 * FESTA CALENDAR - 축제 상세 페이지 인터랙션 스크립트
 * 시뮬랩(Simulab) 전국 축제 상세 인터랙션 (북마크, .ics 캘린더 다운로드, 체크리스트, 공유)
 */

// 로컬 스토리지 키 정의
const STORAGE_KEY_SAVED = 'festa_saved_events';
const STORAGE_KEY_CHECKLIST_PREFIX = 'festa_checklist_';

// 현재 이벤트 메타데이터 추출
const eventId = document.body.dataset.eventId || '';
const eventTitle = document.body.dataset.eventTitle || document.title;
const eventStart = document.body.dataset.eventStart || '';
const eventEnd = document.body.dataset.eventEnd || '';
const eventLocation = document.body.dataset.eventLocation || '';

// 토스트 메시지 표시 함수
let toastTimer = null;
function showToast(message) {
  let toastEl = document.getElementById('festa-toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'festa-toast';
    toastEl.className = 'festa-toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  toastEl.hidden = false;
  requestAnimationFrame(() => {
    toastEl.classList.add('is-visible');
  });

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('is-visible');
    setTimeout(() => { toastEl.hidden = true; }, 250);
  }, 2400);
}

// ----------------------------------------------------------------------------
// 1. 북마크(찜) 관리 및 UI 동기화
// ----------------------------------------------------------------------------
function getSavedList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setSavedList(ids) {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

function syncBookmarkUI() {
  const ids = getSavedList();
  const isSaved = ids.includes(eventId);

  document.querySelectorAll('[data-save-event]').forEach(btn => {
    btn.setAttribute('aria-pressed', String(isSaved));
    const icon = btn.querySelector('.material-symbols-outlined') || btn.querySelector('span');
    const label = btn.querySelector('.save-label');
    if (isSaved) {
      btn.classList.add('is-saved');
      if (icon) icon.textContent = 'favorite';
      if (label) label.textContent = '저장됨';
    } else {
      btn.classList.remove('is-saved');
      if (icon) icon.textContent = 'favorite_border';
      if (label) label.textContent = '일정 저장';
    }
  });

  // 모바일 하단 탭 바 찜 배지 동기화
  document.querySelectorAll('[data-saved-count-badge]').forEach(el => {
    el.textContent = String(ids.length);
    el.hidden = ids.length === 0;
  });
}

function toggleBookmark() {
  const ids = getSavedList();
  const isSaved = ids.includes(eventId);
  let nextIds;

  if (isSaved) {
    nextIds = ids.filter(x => x !== eventId);
    showToast('일정 보관함에서 삭제되었습니다.');
  } else {
    nextIds = [...ids, eventId];
    showToast('일정 보관함에 저장되었습니다! ❤️');
  }

  setSavedList(nextIds);
  syncBookmarkUI();
}

// ----------------------------------------------------------------------------
// 2. iCalendar (.ics) 파일 다운로드 (구글·애플 캘린더 일정 등록)
// ----------------------------------------------------------------------------
function downloadIcsFile() {
  if (!eventStart) {
    showToast('축제 일정 정보가 없습니다.');
    return;
  }

  // YYYYMMDD 포맷 변환
  const sDate = eventStart.replace(/-/g, '');
  // 종료일이 없거나 같으면 당일 하루 종일
  const eDate = eventEnd ? eventEnd.replace(/-/g, '') : sDate;

  // ICS 파일 내용 조합
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Simulab//FESTA CALENDAR//KO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:festa-${eventId}@simulab.kr`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;VALUE=DATE:${sDate}`,
    `DTEND;VALUE=DATE:${eDate}`,
    `SUMMARY:${eventTitle}`,
    `LOCATION:${eventLocation}`,
    `DESCRIPTION:${eventTitle} 안내 링크: ${window.location.href}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${eventTitle.replace(/[^가-힣a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  showToast('캘린더 일정 파일(.ics)을 내려받았습니다 📅');
}

// ----------------------------------------------------------------------------
// 3. 웹 공유 및 링크 복사
// ----------------------------------------------------------------------------
async function shareEvent() {
  const shareData = {
    title: eventTitle,
    text: `${eventTitle} - ${eventLocation} (${eventStart} ~ ${eventEnd})`,
    url: window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (e) {
      if (e.name !== 'AbortError') {
        copyToClipboard();
      }
    }
  } else {
    copyToClipboard();
  }
}

function copyToClipboard() {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('축제 링크가 클립보드에 복사되었습니다 🔗');
    }).catch(() => {
      showToast('주소창의 링크를 복사해주세요.');
    });
  } else {
    showToast('주소창의 링크를 복사해주세요.');
  }
}

// ----------------------------------------------------------------------------
// 4. 대화형 준비물 체크리스트 관리
// ----------------------------------------------------------------------------
function initChecklist() {
  const checklistKey = STORAGE_KEY_CHECKLIST_PREFIX + eventId;
  const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
  const countBadge = document.getElementById('checklist-count-badge');
  if (!checkboxes.length) return;

  // 저장된 체크 상태 복원
  let savedChecked = [];
  try {
    const raw = localStorage.getItem(checklistKey);
    if (raw) savedChecked = JSON.parse(raw);
  } catch (e) {
    savedChecked = [];
  }

  checkboxes.forEach((cb, idx) => {
    if (savedChecked.includes(idx)) {
      cb.checked = true;
      cb.closest('.checklist-item')?.classList.add('is-done');
    }

    cb.addEventListener('change', () => {
      const item = cb.closest('.checklist-item');
      if (cb.checked) {
        item?.classList.add('is-done');
      } else {
        item?.classList.remove('is-done');
      }

      // 상태 저장
      const nowChecked = [];
      checkboxes.forEach((c, i) => { if (c.checked) nowChecked.push(i); });
      try {
        localStorage.setItem(checklistKey, JSON.stringify(nowChecked));
      } catch (err) {}

      // 카운트 갱신
      if (countBadge) {
        countBadge.textContent = `${nowChecked.length}/${checkboxes.length} 완료`;
      }
    });
  });

  if (countBadge) {
    countBadge.textContent = `${savedChecked.length}/${checkboxes.length} 완료`;
  }
}

// ----------------------------------------------------------------------------
// 5. 스티키 서브탭 스크롤 스파이 (ScrollSpy)
// ----------------------------------------------------------------------------
function initScrollSpy() {
  const tabs = document.querySelectorAll('.detail-tabs a[href^="#"]');
  if (!tabs.length || !('IntersectionObserver' in window)) return;

  const sectionIds = Array.from(tabs).map(t => t.getAttribute('href').slice(1));
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        tabs.forEach(tab => {
          const match = tab.getAttribute('href') === `#${id}`;
          tab.classList.toggle('active', match);
          tab.setAttribute('aria-selected', String(match));
        });
      }
    });
  }, {
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0.1
  });

  sections.forEach(sec => observer.observe(sec));
}

// ----------------------------------------------------------------------------
// 6. 이벤트 리스너 바인딩 및 초기화
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // 찜 버튼 이벤트
  document.querySelectorAll('[data-save-event]').forEach(btn => {
    btn.addEventListener('click', toggleBookmark);
  });

  // 공유 버튼 이벤트
  document.querySelectorAll('[data-share-event]').forEach(btn => {
    btn.addEventListener('click', shareEvent);
  });

  // 캘린더 .ics 다운로드 버튼 이벤트
  document.querySelectorAll('[data-download-ics]').forEach(btn => {
    btn.addEventListener('click', downloadIcsFile);
  });

  // 타임테이블 알림 벨 토글
  document.querySelectorAll('.timetable-alert-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isSet = btn.classList.toggle('is-set');
      btn.title = isSet ? '공연 알림 설정됨' : '공연 알림 받기';
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.textContent = isSet ? 'notifications_active' : 'notifications';
      }
      showToast(isSet ? '공연 알림이 등록되었습니다 🔔' : '공연 알림이 해제되었습니다.');
    });
  });

  syncBookmarkUI();
  initChecklist();
  initScrollSpy();
});
