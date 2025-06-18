import { useState, useMemo } from 'react';
import Head from 'next/head';
import HagwonCard from '@/components/HagwonCard';

export default function HagwonsPage({ hagwons }) {
  const [selected, setSelected] = useState({
    region: [],
    lessonType: [],
    format: [],
    service: [],
  });

  const filteredHagwons = useMemo(() => {
    return hagwons.filter(h => {
      const matchRegion =
        selected.region.length === 0 || selected.region.some(r => h.region.includes(r))

      const matchType =
        selected.lessonType.length === 0 ||
        (Array.isArray(h.lessonType) && selected.lessonType.some(type => h.lessonType.includes(type)));

      const matchFormat =
        selected.format.length === 0 ||
        (Array.isArray(h.format) && selected.format.some(f => h.format.includes(f)));

      const matchService =
        selected.service.length === 0 ||
        (h.ia_ee_tok && selected.service.every(s => ['IA', 'EE', 'TOK'].includes(s)));

      return matchRegion && matchType && matchFormat && matchService;
    });
  }, [hagwons, selected]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold mb-6">IB 학원 29곳 추천 및 비교 [2025년 최신]</h1>
        <article className="prose lg:prose-base max-w-none space-y-4 text-gray-500 mb-6">
          <p><strong>최신 업데이트:</strong> 2025년 6월 16일</p>
          <p>
            IB 학원은 IB 과정을 이수 중이거나 준비 중인 학생들에게 집중적인 도움을 제공합니다.
            본 페이지는 학부모와 학생들이 신뢰할 수 있는 IB 학원을 선택할 수 있도록 도움을 주는 것을 목적으로 하며,
            학원 선택 시 고려해야 할 요소, 수업 구성, 과외와의 차이점 등을 상세히 안내합니다.
          </p>
        </article>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-10">


        <FilterLinks selected={selected} setSelected={setSelected} />

        <div className="space-y-5 flex flex-col mt-6">
          {filteredHagwons.length === 0 ? (
            <p className="text-gray-500 text-sm">조건에 맞는 학원이 없습니다.</p>
          ) : (
            filteredHagwons.map((card, i) => (
              <HagwonCard key={card.id} {...card} priority={i === 0} />
            ))
          )}
        </div>
      </main>
    </>
  );
}

// Static generation (no server-side filtering)
export async function getStaticProps() {
  const hagwons = (await import('@/data/hagwons')).default;

  return {
    props: { hagwons },
    revalidate: 3600,
  };
}

// Filter UI component
function FilterLinks({ selected, setSelected }) {
  return (
    <section className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex flex-wrap gap-10 justify-center md:justify-between my-[1em]">
      <FilterGroup
        title="지역"
        options={["강남", "서초", "제주", "부산", "해외"]}
        selected={selected.region}
        onChange={value => handleToggle(selected, setSelected, 'region', value)}
      />
      <FilterGroup
        title="수업 방식"
        options={["개인", "그룹"]}
        selected={selected.lessonType}
        onChange={value => handleToggle(selected, setSelected, 'lessonType', value)}
      />
      <FilterGroup
        title="수업 형태"
        options={["대면", "온라인"]}
        selected={selected.format}
        onChange={value => handleToggle(selected, setSelected, 'format', value)}
      />
      <FilterGroup
        title="추가 과목"
        options={["IA", "EE", "TOK"]}
        selected={selected.service}
        onChange={value => handleToggle(selected, setSelected, 'service', value)}
      />
    </section>
  );
}

function FilterGroup({ title, options, selected, onChange }) {
  return (
    <div className="flex flex-col gap-2 min-w-[120px]">
      <h3 className="font-bold text-sm text-gray-800 mb-1">{title}</h3>
      {options.map(option => (
        <label key={option} className="text-sm text-gray-700 flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => onChange(option)}
          />
          {option}
        </label>
      ))}
    </div>
  );
}

function handleToggle(selected, setSelected, key, value) {
  setSelected(prev => {
    const list = prev[key];
    const newList = list.includes(value)
      ? list.filter(v => v !== value)
      : [...list, value];
    return { ...prev, [key]: newList };
  });
}
