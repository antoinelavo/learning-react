import HagwonCard from '@/components/HagwonCard';
import { useState, useEffect } from 'react';

export default function HagwonsPage({ hagwons }) {
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedLessonType, setSelectedLessonType] = useState([]);
  const [selectedLessonFormat, setSelectedLessonFormat] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [filteredData, setFilteredData] = useState(hagwons);

  const handleCheckboxChange = (setter, value) => {
    setter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleRadioChange = (setter, value) => {
    setter(value);
  };

  useEffect(() => {
    const filtered = hagwons.filter(card => {
      const regionMatch =
        selectedRegions.length === 0 ||
        selectedRegions.some(region => card.region.includes(region));

      const lessonTypeMatch =
        selectedLessonType.length === 0 ||
        (Array.isArray(card.lessonType) &&
          selectedLessonType.some(type => card.lessonType.includes(type)));

      const lessonFormatMatch =
        selectedLessonFormat.length === 0 ||
        (Array.isArray(card.format) &&
          selectedLessonFormat.some(format => card.format.includes(format)));

      const services = card.services?.split(',') || [];
      const servicesMatch =
        selectedServices.length === 0 ||
        (card.ia_ee_tok && selectedServices.every(s => ['IA', 'EE', 'TOK'].includes(s)));

      return regionMatch && lessonTypeMatch && lessonFormatMatch && servicesMatch;
    });

    setFilteredData(filtered);
  }, [selectedRegions, selectedLessonType, selectedLessonFormat, selectedServices, hagwons]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">SAT 학원 29곳 추천 및 비교 [2025년 최신]</h1>

      <article className="prose lg:prose-base max-w-none space-y-4 text-gray-500">
        <p><strong>최신 업데이트:</strong> 2025년 6월 16일</p>
        <p>
          IB 학원은 IB 과정을 이수 중이거나 준비 중인 학생들에게 집중적인 도움을 제공합니다.
          본 페이지는 학부모와 학생들이 신뢰할 수 있는 IB 학원을 선택할 수 있도록 도움을 주는 것을 목적으로 하며,
          학원 선택 시 고려해야 할 요소, 수업 구성, 과외와의 차이점 등을 상세히 안내합니다.
        </p>
      </article>

      {/* Filters */}
      <section className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex flex-wrap gap-10 justify-center md:justify-between my-[1em]">
        <FilterGroup
          title="지역"
          options={["강남", "서초", "제주", "부산", "해외"]}
          selected={selectedRegions}
          onChange={value => handleCheckboxChange(setSelectedRegions, value)}
        />
        <FilterGroup
          title="수업 방식"
          options={["전체", "개인", "그룹"]}
          selected={selectedLessonType}
          onChange={value =>
            value === "전체"
              ? setSelectedLessonType([])
              : handleCheckboxChange(setSelectedLessonType, value)
          }
          allValue="전체"
        />
        <FilterGroup
          title="수업 형태"
          options={["전체", "대면", "온라인"]}
          selected={selectedLessonFormat}
          onChange={value =>
            value === "전체"
              ? setSelectedLessonFormat([])
              : handleCheckboxChange(setSelectedLessonFormat, value)
          }
          allValue="전체"
        />
        <FilterGroup
          title="추가 과목"
          options={["IA", "EE", "TOK"]}
          selected={selectedServices}
          onChange={value => handleCheckboxChange(setSelectedServices, value)}
        />
      </section>

      {/* Cards */}
      <div className="space-y-5 flex flex-col">
        {filteredData.map(card => (
          <div key={card.id}>
            <HagwonCard {...card} />
          </div>
        ))}
      </div>
    </main>
  );
}

// 📦 Static pre-rendered data
export async function getStaticProps() {
  const hagwons = (await import('@/data/hagwons')).default;

  return {
    props: {
      hagwons,
    },
    revalidate: 3600, // re-build every hour
  };
}

// ✅ Reusable filter section
function FilterGroup({ title, options, selected, onChange, allValue = null }) {
  return (
    <div className="flex flex-col gap-2 min-w-[120px]">
      <h3 className="font-bold text-sm text-gray-800 mb-1">{title}</h3>
      {options.map(option => (
        <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={
              allValue && option === allValue
                ? selected.length === 0
                : selected.includes(option)
            }
            onChange={() => onChange(option)}
          />
          {option}
        </label>
      ))}
    </div>
  );
}
