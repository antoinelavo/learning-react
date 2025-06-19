import Link from 'next/link';
import HagwonCard from '@/components/HagwonCard';
import allHagwonsData from '@/data/hagwons';

export const revalidate = 3600; // rebuild every hour
export const metadata = {
  title: 'IB 학원 29곳 추천 및 비교 [2025년 최신]',
  description: 'IB 학원 추천, 비교, 선택 가이드 – 2025년 최신 업데이트',
};

export default function HagwonsPage({ searchParams }) {
  const allHagwons = allHagwonsData;

  // Derive selected filters from searchParams
  const selected = {
    region: Array.isArray(searchParams.region)
      ? searchParams.region
      : searchParams.region
      ? [searchParams.region]
      : [],
    lessonType: Array.isArray(searchParams.lessonType)
      ? searchParams.lessonType
      : searchParams.lessonType
      ? [searchParams.lessonType]
      : [],
    format: Array.isArray(searchParams.format)
      ? searchParams.format
      : searchParams.format
      ? [searchParams.format]
      : [],
    service: Array.isArray(searchParams.service)
      ? searchParams.service
      : searchParams.service
      ? [searchParams.service]
      : [],
  };

  // Server-side filtering
  const filteredHagwons = allHagwons.filter(h => {
    const matchRegion =
      selected.region.length === 0 ||
      selected.region.some(r => h.region.includes(r));
    const matchType =
      selected.lessonType.length === 0 ||
      (Array.isArray(h.lessonType) &&
        selected.lessonType.some(t => h.lessonType.includes(t)));
    const matchFormat =
      selected.format.length === 0 ||
      (Array.isArray(h.format) &&
        selected.format.some(f => h.format.includes(f)));
    const matchService =
      selected.service.length === 0 ||
      (h.ia_ee_tok &&
        selected.service.every(s => ['IA', 'EE', 'TOK'].includes(s)));
    return matchRegion && matchType && matchFormat && matchService;
  });

  return (
    <>
      <main className="critical-container">
        <h1 className="critical-title">
          IB 학원 29곳 추천 및 비교 [2025년 최신]
        </h1>

        <article className="critical-intro">
          <p><strong>최신 업데이트:</strong> 2025년 6월 16일</p>
          <p>IB 학원은 IB 과정을 이수 중이거나 준비 중인 학생들에게 집중적인 도움을 제공합니다. 본 페이지는 학부모와 학생들이 신뢰할 수 있는 IB 학원을 선택할 수 있도록 도움을 주는 것을 목적으로 하며, 학원 선택 시 고려해야 할 요소, 수업 구성, 과외와의 차이점 등을 상세히 안내합니다。</p>
        </article>

        {/* Filter Links */}
        <FilterLinks selected={selected} />

        <div className="space-y-5 flex flex-col mt-6">
          {filteredHagwons.length === 0 ? (
            <p className="text-gray-500 text-sm">조건에 맞는 학원이 없습니다.</p>
          ) : (
            filteredHagwons.map((card, i) => (
              <HagwonCard
                key={`${card.id ?? 'hagwon'}-${i}`}
                {...card}
                priority={i === 0}
              />
            ))
          )}
        </div>
      </main>
    </>
  );
}

function FilterLinks({ selected }) {
  const base = '/hagwons';
  const filterGroups = [
    { title: '지역', param: 'region', options: ['전체', '강남', '서초', '제주', '부산', '해외'] },
    { title: '수업 방식', param: 'lessonType', options: ['전체', '개인', '그룹'] },
    { title: '수업 형태', param: 'format', options: ['대면', '온라인'] },
    { title: '추가 과목', param: 'service', options: ['IA', 'EE', 'TOK'] },
  ];

  return (
    <section className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex flex-wrap gap-10 justify-center md:justify-between my-[1em]">
      {filterGroups.map(group => (
        <div key={group.param} className="flex flex-col gap-2 min-w-[120px]">
          <h3 className="font-bold text-sm text-gray-800 mb-1">{group.title}</h3>
          {group.options.map(option => {
            const params = new URLSearchParams();
            Object.entries(selected).forEach(([key, vals]) => vals.forEach(v => params.append(key, v)));
            const isAll = option === '전체';
            const values = selected[group.param] || [];
            const isSelected = isAll ? values.length === 0 : values.includes(option);
            if (!isAll) {
              const updated = isSelected ? values.filter(o => o !== option) : [...values, option];
              params.delete(group.param);
              updated.forEach(v => params.append(group.param, v));
            } else {
              params.delete(group.param);
            }
            const href = `${base}?${params.toString()}`;
            return (
              <Link
                key={`${group.param}-${option}`}
                href={href}
                className={`text-sm px-3 py-1.5 rounded-full border transition font-medium shadow-sm whitespace-nowrap flex items-center gap-1 ${
                  isSelected ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                }`}
                scroll={false}
              >
                {option}
              </Link>
            );
          })}
        </div>
      ))}
    </section>
  );
}