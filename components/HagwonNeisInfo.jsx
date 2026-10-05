// Server component: registered fees (NEIS) shown in a hagwon card's expanded section.
import {
  getNeisEntry, feeRange, formatManwon, formatWon, formatPeriod,
  establishedYear, fieldLabel, formatDate, neisUpdatedAt,
} from '@/lib/hagwonNeis';

const REASONS = [
  ['등록 기준', '교습비는 교육지원청이 정한 분당 교습비 기준 이내에서 등록됩니다.'],
  ['수업 형태', '등록 금액은 주로 단체 수업 기준이며, 1:1·소수 정예 수업은 금액이 다를 수 있습니다.'],
  ['특강', '단기 특강과 방학 집중 과정은 정규 과정과 금액이 다를 수 있습니다.'],
  ['교습시간', '총 교습시간에 자습 시간이 포함된 경우, 수업 시간당 금액은 더 높을 수 있습니다.'],
  ['기타경비', '교재비, 모의고사비 등은 교습비와 별도로 청구될 수 있습니다.'],
  ['컨설팅', '입시 컨설팅 비용은 일반적으로 교습비에 포함되지 않습니다.'],
];

function rangeText(entry) {
  const { min, max } = feeRange(entry);
  return min === max ? `${formatManwon(min)}원` : `${formatManwon(min)}~${formatManwon(max)}원`;
}

function Chevron() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400 transition-transform group-open:rotate-180" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
  );
}

// Accordion row: a full-width clickable summary with a chevron.
function Row({ title, children }) {
  return (
    <details className="group border-t border-gray-200">
      <summary className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-gray-50 text-sm font-medium text-gray-800">
        {title}
        <Chevron />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

export default function HagwonFeeDetails({ neis }) {
  const entry = getNeisEntry(neis);
  if (!entry) {
    return <p className="mb-4 text-sm text-gray-800"><strong>수업료:</strong> 학원 문의</p>;
  }

  const year = establishedYear(entry);
  const field = fieldLabel(entry);
  const showOtherFee = entry.courses.some(c => c.otherFee);

  return (
    <div className="mb-4 rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3">
        <p className="m-0 text-xs text-gray-500">수업료</p>
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <p className="m-0 text-base font-bold text-gray-900">{rangeText(entry)}</p>
          <span className="text-xs text-gray-500">교육청 등록 교습비 기준 · {formatDate(neisUpdatedAt)}</span>
        </div>
        {(year || field) && (
          <div className="flex gap-1.5 flex-wrap mt-2">
            {year && <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5">{year}년 개원</span>}
            {field && <span className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5">{field}</span>}
          </div>
        )}
      </div>

      <Row title={`강좌별 교습비 (${entry.courses.length}개)`}>
        <div className="max-h-80 overflow-auto rounded-lg border border-gray-200">
          <table className="w-full text-xs text-left text-gray-700 m-0 [&_th]:px-2 sm:[&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:whitespace-nowrap [&_td]:px-2 sm:[&_td]:px-3 [&_td]:py-1.5 [&_td]:whitespace-nowrap [&_tbody_tr]:border-t [&_tbody_tr]:border-gray-100 [&_.num]:text-right">
            <caption className="sr-only">{entry.name} 교육청 등록 교습비</caption>
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
              {entry.courses.map((c, i) => (
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
        </div>
        <p className="mt-2 mb-0 text-xs text-gray-400">출처: 교육청 학원·교습소 정보 ({entry.name})</p>
      </Row>

      <Row title="수업료 참고 사항">
        <dl className="m-0 divide-y divide-gray-100 text-xs">
          {REASONS.map(([term, text]) => (
            <div key={term} className="flex gap-3 py-2">
              <dt className="w-16 shrink-0 font-semibold text-gray-700">{term}</dt>
              <dd className="m-0 text-gray-600 leading-relaxed">{text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 mb-0 text-xs text-gray-500">정확한 수업료는 학원 상담 시 확인하시기 바랍니다.</p>
      </Row>
    </div>
  );
}
