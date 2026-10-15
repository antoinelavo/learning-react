'use client';

import { useState } from 'react';
import ScrollFade from '@/components/ScrollFade.client';
import { Button } from '@/components/ui';
import { formatPeriod, formatWon } from '@/lib/hagwonFormat';

// 강좌별 교습비 accordion row. The table is fetched the first time the row is
// opened (from /api/hagwon-fees/<id>), so the hagwon pages stay small.
export default function HagwonFeeCourses({ neisId, name, count, title, chevron, summaryClassName }) {
  const [courses, setCourses] = useState(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (courses || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/hagwon-fees/${encodeURIComponent(neisId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCourses((await res.json()).courses);
    } catch (err) {
      console.error('Failed to load hagwon fees', err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const showOtherFee = courses?.some(c => c.otherFee);

  return (
    <details className="group border-t border-gray-200" onToggle={e => { if (e.currentTarget.open) load(); }}>
      <summary className={summaryClassName}>
        {title}
        {chevron}
      </summary>
      <div className="px-4 pb-4">
        {courses ? (
          <ScrollFade className="max-h-80 overflow-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs text-left text-gray-700 m-0 [&_th]:px-2 sm:[&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:whitespace-nowrap [&_td]:px-2 sm:[&_td]:px-3 [&_td]:py-1.5 [&_td]:whitespace-nowrap [&_tbody_tr]:border-t [&_tbody_tr]:border-gray-100 [&_.num]:text-right">
              <caption className="sr-only">{name} 교육청 등록 교습비</caption>
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col">과목</th>
                  <th scope="col">기간 · 총 시간</th>
                  {showOtherFee && <th scope="col" className="num">교습비</th>}
                  {showOtherFee && <th scope="col" className="num">기타경비</th>}
                  <th scope="col" className="num">합계</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c, i) => (
                  <tr key={i}>
                    <td className="!whitespace-normal min-w-[5.5rem]">{c.subject || '-'}</td>
                    <td>
                      {formatPeriod(c.period)}
                      {c.hours != null && <span className="block text-gray-400">{c.hours}시간</span>}
                    </td>
                    {showOtherFee && <td className="num">{c.fee != null ? formatWon(c.fee) : '-'}</td>}
                    {showOtherFee && <td className="num">{c.otherFee != null ? formatWon(c.otherFee) : '-'}</td>}
                    <td className="num">{c.total != null ? formatWon(c.total) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollFade>
        ) : failed ? (
          <div className="flex items-center gap-3">
            <p className="m-0 text-xs text-gray-500">교습비 표를 불러오지 못했습니다.</p>
            <Button type="button" variant="secondary" size="sm" onClick={load}>다시 시도</Button>
          </div>
        ) : (
          <p className="m-0 text-xs text-gray-400">{count}개 강좌 불러오는 중…</p>
        )}
        <p className="mt-2 mb-0 text-xs text-gray-400">출처: 교육청 학원·교습소 정보 ({name})</p>
      </div>
    </details>
  );
}
