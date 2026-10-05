// Server component: registered fees and info for one hagwon card.
// The course table sits in a <details> element so it is in the page HTML even when closed.
import {
  getNeisEntry, feeRange, formatManwon, formatWon, formatPeriod,
  establishedYear, fieldLabel, formatDate, neisUpdatedAt,
} from '@/lib/hagwonNeis';
import HagwonFeeDisclaimer from '@/components/HagwonFeeDisclaimer';

export default function HagwonNeisInfo({ neis }) {
  const entry = getNeisEntry(neis);

  if (!entry) {
    return (
      <p className="mt-4 mb-0 text-sm text-gray-800">
        <strong>수업료:</strong> 학원 문의
      </p>
    );
  }

  const { min, max } = feeRange(entry);
  const range = min === max ? `${formatManwon(min)}원` : `${formatManwon(min)}~${formatManwon(max)}원`;
  const year = establishedYear(entry);
  const field = fieldLabel(entry);
  const meta = [year && `${year}년 개원`, field].filter(Boolean).join(' · ');
  const showOtherFee = entry.courses.some(c => c.otherFee);

  return (
    <div className="mt-4 text-sm">
      <p className="m-0 text-gray-800">
        <strong>교육청 등록 교습비:</strong> {range}
      </p>
      {meta && <p className="m-0 mt-1 text-gray-500">{meta}</p>}

      <details className="mt-2">
        <summary className="cursor-pointer text-blue-600 hover:underline w-fit">등록 교습비 상세 보기</summary>
        <div className="mt-2 max-h-80 overflow-auto rounded-lg border border-gray-200">
          <table className="w-full text-xs text-left text-gray-700 m-0 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:whitespace-nowrap [&_td]:px-3 [&_td]:py-1.5 [&_td]:whitespace-nowrap [&_tbody_tr]:border-t [&_tbody_tr]:border-gray-100 [&_.num]:text-right">
            <caption className="sr-only">{entry.name} 교육청 등록 교습비</caption>
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th scope="col">과목</th>
                <th scope="col">교습기간</th>
                <th scope="col">총 교습시간</th>
                {showOtherFee && <th scope="col" className="num">교습비</th>}
                {showOtherFee && <th scope="col" className="num">기타경비</th>}
                <th scope="col" className="num">합계</th>
              </tr>
            </thead>
            <tbody>
              {entry.courses.map((c, i) => (
                <tr key={i}>
                  <td className="!whitespace-normal">{c.subject || '-'}</td>
                  <td>{formatPeriod(c.period)}</td>
                  <td>{c.hours != null ? `${c.hours}시간` : '-'}</td>
                  {showOtherFee && <td className="num">{c.fee != null ? formatWon(c.fee) : '-'}</td>}
                  {showOtherFee && <td className="num">{c.otherFee != null ? formatWon(c.otherFee) : '-'}</td>}
                  <td className="num">{c.total != null ? formatWon(c.total) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 mb-0 text-xs text-gray-500">
          출처: 교육청 학원·교습소 정보 ({entry.name}, {formatDate(neisUpdatedAt)} 기준).
        </p>
      </details>
      <HagwonFeeDisclaimer className="mt-1" />
    </div>
  );
}
