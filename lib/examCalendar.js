// Date helpers for the exam calendar and the dashboard D-day card.
// Dates are plain YYYY-MM-DD strings in Korea time; no timezone math is done
// on the event data itself.
import { EXAM_EVENTS } from '@/data/exam-events';

export const SELECTED_EVENT_KEY = 'ibmaster.examTarget';

// Today's date in Korea (YYYY-MM-DD), whatever the viewer's timezone.
export function kstToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function toUtcMs(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

// Whole days from `today` until `dateStr` (negative once it has passed).
export function daysUntil(dateStr, today) {
  return Math.round((toUtcMs(dateStr) - toUtcMs(today)) / 86400000);
}

export function ddayLabel(days) {
  if (days === 0) return 'D-Day';
  return days > 0 ? `D-${days}` : `D+${-days}`;
}

export function eventEnd(event) {
  return event.end || event.start;
}

// "D-12", "D-Day", or "진행 중" while a multi-day event is under way.
export function eventCountdown(event, today) {
  const days = daysUntil(event.start, today);
  if (days < 0 && eventEnd(event) >= today) return '진행 중';
  return ddayLabel(days);
}

// Events that have not finished yet, soonest first.
export function upcomingEvents(today, events = EXAM_EVENTS) {
  return events
    .filter((e) => eventEnd(e) >= today)
    .sort((a, b) => (a.start === b.start ? a.id.localeCompare(b.id) : a.start < b.start ? -1 : 1));
}

export function targetEvents(today, events = EXAM_EVENTS) {
  return upcomingEvents(today, events).filter((e) => e.target);
}

// The saved target if it is still upcoming, otherwise the next upcoming
// target. IB events come first once they exist (the default is "the next IB
// session"); until then the next target of any category is used.
export function resolveTargetEvent(selectedId, today, events = EXAM_EVENTS) {
  const targets = targetEvents(today, events);
  const saved = targets.find((e) => e.id === selectedId);
  if (saved) return saved;
  return targets.find((e) => e.category === 'IB') || targets[0] || null;
}

function fmtDate(dateStr, withYear) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return withYear ? `${y}년 ${m}월 ${d}일` : `${m}월 ${d}일`;
}

export function formatEventDate(event) {
  if (!event.end || event.end === event.start) return fmtDate(event.start, true);
  const sameYear = event.start.slice(0, 4) === event.end.slice(0, 4);
  return `${fmtDate(event.start, true)} ~ ${fmtDate(event.end, !sameYear)}`;
}

function compact(dateStr) {
  return dateStr.replace(/-/g, '');
}

function nextDay(dateStr) {
  const d = new Date(toUtcMs(dateStr) + 86400000);
  return d.toISOString().slice(0, 10);
}

// All-day event link; Google Calendar's end date is exclusive.
export function googleCalendarUrl(event) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${compact(event.start)}/${compact(nextDay(eventEnd(event)))}`,
    details: [event.note, `출처: ${event.sourceUrl}`].filter(Boolean).join('\n'),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// localStorage is a convenience only; every access can throw.
export function readSelectedEventId() {
  try {
    return window.localStorage.getItem(SELECTED_EVENT_KEY);
  } catch {
    return null;
  }
}

export function writeSelectedEventId(id) {
  try {
    if (id) window.localStorage.setItem(SELECTED_EVENT_KEY, id);
    else window.localStorage.removeItem(SELECTED_EVENT_KEY);
  } catch {
    // ignore
  }
}
