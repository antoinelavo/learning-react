// Server component: page-level fee overview built from the NEIS snapshot.
// Renders nothing when no listed hagwon has fee data.
import {
  getNeisEntry, feeRange, feeStats, formatManwon, establishedYear, formatDate, neisUpdatedAt,
} from '@/lib/hagwonNeis';

export default function HagwonFeeSummary({ hagwons, label }) {
  const stats = feeStats(hagwons);
  if (!stats) return null;

  const rows = hagwons
    .map(h => ({ h, entry: getNeisEntry(h.neis) }))
    .filter(({ entry }) => entry)
    .map(({ h, entry }) => ({ name: h.name, year: establishedYear(entry), ...feeRange(entry) }))
    .sort((a, b) => a.min - b.min);

  return (
    <section className="my-8">
      <h2>{label} 학원 수업료 안내</h2>
      <p>
        교육청에 등록된 {label} 학원 {stats.hagwonCount}곳의 강좌 {stats.courseCount.toLocaleString('ko-KR')}개를 기준으로,
        수업료는 강좌당 <strong>{formatManwon(stats.min)}~{formatManwon(stats.max)}원</strong>이며
        중앙값은 <strong>{formatManwon(stats.median)}원</strong>입니다.
        수업료는 교습기간(며칠 단기 특강부터 수개월 정규반까지)과 수업 시간에 따라 크게 달라지므로,
        각 학원의 &lsquo;수업료 상세 보기&rsquo;에서 강좌별 교습기간과 총 교습시간을 함께 확인하세요.
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left text-gray-700 m-0">
          <caption className="sr-only">{label} 학원별 교육청 등록 수업료 범위</caption>
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">학원</th>
              <th scope="col" className="px-3 py-2 font-semibold whitespace-nowrap">수업료 범위</th>
              <th scope="col" className="px-3 py-2 font-semibold whitespace-nowrap">개원</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.name} className="border-t border-gray-100">
                <td className="px-3 py-1.5">{r.name}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">
                  {r.min === r.max ? `${formatManwon(r.min)}원` : `${formatManwon(r.min)}~${formatManwon(r.max)}원`}
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap">{r.year ? `${r.year}년` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        출처: 교육청 학원·교습소 정보 ({formatDate(neisUpdatedAt)} 기준). 교육청에 등록된 수업료이며, 실제 수업료는 학원에 문의하세요.
      </p>
    </section>
  );
}
