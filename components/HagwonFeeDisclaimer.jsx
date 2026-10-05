// Server component: clickable explanation of why registered fees can differ from what hagwons charge.
export default function HagwonFeeDisclaimer({ className = '' }) {
  return (
    <details className={className}>
      <summary className="cursor-pointer text-gray-500 hover:underline w-fit">실제 수업료와 다른가요?</summary>
      <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs leading-relaxed text-gray-600">
        <p className="m-0 mb-2 text-xs leading-relaxed">교육청 등록 교습비는 실제로 내는 수업료와 다를 수 있습니다.</p>
        <ul className="list-disc pl-4 m-0 space-y-1">
          <li>교습비는 교육지원청이 정한 분당 교습비 기준(상한) 안에서만 등록할 수 있습니다.</li>
          <li>등록 금액은 대부분 정원 10명 안팎의 단체반 기준입니다. 1:1·소수정예 수업은 더 비쌀 수 있습니다.</li>
          <li>단기 특강, 방학 집중반, 시험 직전반 등은 정규 과정과 다른 금액으로 운영될 수 있습니다.</li>
          <li>총 교습시간에 자습시간이 포함된 경우, 실제 수업 시간 기준 단가는 더 높아집니다.</li>
          <li>교재비, 모의고사비 등 기타경비는 교습비와 별도로 청구될 수 있습니다.</li>
          <li>입시·대학 지원 컨설팅 비용은 수업료와 별도인 경우가 많습니다.</li>
          <li>등록 정보가 최근 변경 사항을 반영하지 못했을 수 있습니다.</li>
        </ul>
        <p className="m-0 mt-2 text-xs leading-relaxed">
          학원은 교육청에 등록한 금액보다 많은 교습비를 받을 수 없습니다(학원법). 정확한 수업료는 상담 시 등록 교습비와 함께 확인하고,
          차이가 있다면 관할 교육지원청에 문의할 수 있습니다.
        </p>
      </div>
    </details>
  );
}
