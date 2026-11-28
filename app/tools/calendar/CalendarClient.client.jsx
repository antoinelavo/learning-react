'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Chip, Notice } from '@/components/ui';
import { EVENT_CATEGORIES } from '@/data/exam-events';
import {
  eventCountdown,
  formatEventDate,
  googleCalendarUrl,
  kstToday,
  readSelectedEventId,
  resolveTargetEvent,
  upcomingEvents,
  writeSelectedEventId,
} from '@/lib/examCalendar';

const CATEGORY_COLOR = { IB: 'blue', SAT: 'orange', ADMISSION: 'green' };
const CATEGORY_LABEL = Object.fromEntries(EVENT_CATEGORIES.map((c) => [c.value, c.label]));

function monthKey(event) {
  return event.start.slice(0, 7);
}

function monthLabel(ym) {
  const [y, m] = ym.split('-');
  return `${y}년 ${Number(m)}월`;
}

const pad = (n) => String(n).padStart(2, '0');
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// Month grid: days inside an IB or 입시 range are tinted, SAT dates get an
// orange ring. The whole of a multi-week range (e.g. IB May) is highlighted.
function MonthGrid({ ym, events, today }) {
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  const classify = (date) => {
    let tint = '';
    let sat = false;
    for (const e of events) {
      const end = e.end || e.start;
      if (date < e.start || date > end) continue;
      if (e.category === 'IB') tint = 'ib';
      else if (e.category === 'ADMISSION' && tint !== 'ib') tint = 'adm';
      else if (e.category === 'SAT') sat = true;
    }
    return { tint, sat };
  };

  return (
    <div className="grid grid-cols-7 gap-1 mb-3 text-center text-xs" role="img" aria-label={`${monthLabel(ym)} 달력`}>
      {WEEKDAYS.map((d) => (
        <div key={d} className="text-gray-400 py-1">{d}</div>
      ))}
      {cells.map((d, i) => {
        if (d == null) return <div key={`e${i}`} />;
        const date = `${ym}-${pad(d)}`;
        const { tint, sat } = classify(date);
        return (
          <div
            key={date}
            className={[
              'rounded-md py-1.5',
              tint === 'ib' ? 'bg-blue-100 text-blue-800 font-semibold' : '',
              tint === 'adm' ? 'bg-green-100 text-green-800 font-semibold' : '',
              !tint ? 'text-gray-600' : '',
              sat ? 'ring-2 ring-orange-400' : '',
              date === today ? 'outline outline-2 outline-gray-800' : '',
            ].join(' ')}
          >
            {d}
          </div>
        );
      })}
    </div>
  );
}

export default function CalendarClient({ initialToday }) {
  const [today, setToday] = useState(initialToday);
  const [filter, setFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    setToday(kstToday());
    setSelectedId(readSelectedEventId());
  }, []);

  const target = resolveTargetEvent(selectedId, today);
  const events = useMemo(
    () => upcomingEvents(today).filter((e) => filter === 'ALL' || e.category === filter),
    [today, filter]
  );
  const groups = useMemo(() => {
    const map = new Map();
    events.forEach((e) => {
      const key = monthKey(e);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });
    return Array.from(map.entries());
  }, [events]);

  const chooseTarget = (id) => {
    setSelectedId(id);
    writeSelectedEventId(id);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-1">시험·입시 일정 캘린더</h1>
      <p className="text-sm text-gray-600 mb-4">
        SAT 시험과 대학 입시 일정을 한곳에서 확인하세요. 모든 일정에 공식 출처와 확인일이 있습니다.
      </p>

      {target && (
        <Card padding="sm" className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 m-0">내 D-day</p>
            <p className="font-semibold m-0 truncate">{target.title}</p>
          </div>
          <span className="text-2xl font-bold text-blue-600 shrink-0">{eventCountdown(target, today)}</span>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="일정 종류">
        <Chip selected={filter === 'ALL'} onClick={() => setFilter('ALL')}>전체</Chip>
        {EVENT_CATEGORIES.map((c) => (
          <Chip key={c.value} selected={filter === c.value} onClick={() => setFilter(c.value)}>
            {c.label}
          </Chip>
        ))}
      </div>

      {groups.length === 0 ? (
        <Card padding="sm" className="text-center text-gray-600">예정된 일정이 없습니다.</Card>
      ) : (
        groups.map(([month, list]) => (
          <section key={month} className="mb-6">
            <h2 className="text-base font-bold mb-2">{monthLabel(month)}</h2>
            <MonthGrid ym={month} events={events} today={today} />
            <ul className="space-y-3 list-none p-0 m-0">
              {list.map((e) => {
                const isTarget = target?.id === e.id;
                return (
                  <li key={e.id}>
                    <Card padding="sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge color={CATEGORY_COLOR[e.category]}>{CATEGORY_LABEL[e.category]}</Badge>
                            {isTarget && <Badge color="gray">내 D-day</Badge>}
                          </div>
                          <p className="font-semibold m-0">{e.title}</p>
                          <p className="text-sm text-gray-600 m-0 mt-0.5">{formatEventDate(e)}</p>
                          {e.note && <p className="text-xs text-gray-500 m-0 mt-1">{e.note}</p>}
                        </div>
                        <span className="text-lg font-bold text-blue-600 shrink-0">
                          {eventCountdown(e, today)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Button href={googleCalendarUrl(e)} external target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
                          Google 캘린더에 추가
                        </Button>
                        {e.target && !isTarget && (
                          <Button variant="tinted" size="sm" onClick={() => chooseTarget(e.id)}>
                            D-day로 설정
                          </Button>
                        )}
                        <a
                          href={e.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 underline ml-auto"
                        >
                          출처 · {e.lastVerified} 확인
                        </a>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
