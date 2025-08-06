'use client';

import { useState } from 'react';

export default function FilterLinksClient() {
  const [selected, setSelected] = useState({
    region: [],
    lessonType: [],
    format: [],
    service: [],
  });

  const filterGroups = [
    { title: '지역', param: 'region', options: ['전체', '강남', '분당', '부산', '온라인'] },
    { title: '수업 방식', param: 'lessonType', options: ['1:1', '그룹', '인강'] },
    { title: '수업 형태', param: 'format', options: ['대면', '온라인'] },
    { title: '추가 과목', param: 'service', options: ['AP', 'ACT', 'IB', 'GCSE', 'TOEFL', '컨설팅'] },
  ];

  const handleFilterChange = (param, option) => {
    const allOpts = filterGroups.find(g => g.param === param)?.options.filter(opt => opt !== '전체') || [];
    const values = selected[param] || [];
    const isAllSelected = values.length === 0 || values.length === allOpts.length;

    let updatedValues = [];

    if (option === '전체') {
      // 전체 selects all or clears
      updatedValues = isAllSelected ? [] : allOpts;
    } else {
      // toggle this option
      updatedValues = values.includes(option)
        ? values.filter(v => v !== option)
        : [...values, option];
    }

    setSelected(prev => ({
      ...prev,
      [param]: updatedValues
    }));

    // Apply filters immediately
    applyFilters({ ...selected, [param]: updatedValues });
  };

  const applyFilters = (filters) => {
    const cards = Array.from(document.querySelectorAll('[data-hagwon]'));
    
    cards.forEach(card => {
      const cardRegion = card.dataset.region || '';
      const cardLessonType = card.dataset.lessontype?.split(',') || [];
      const cardFormat = card.dataset.format?.split(',') || [];
      const cardService = card.dataset.service?.split(',') || [];

      const matches =
        (filters.region.length === 0 || filters.region.some(r => cardRegion.includes(r))) &&
        (filters.lessonType.length === 0 || filters.lessonType.every(l => cardLessonType.includes(l))) &&
        (filters.format.length === 0 || filters.format.every(f => cardFormat.includes(f))) &&
        (filters.service.length === 0 || filters.service.every(s => cardService.includes(s)));

      card.style.display = matches ? 'block' : 'none';
    });
  };

  return (
    <section className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex flex-wrap gap-x-[4em] gap-y-[3em] justify-center md:justify-start my-[1em]">
      {filterGroups.map(({ title, param, options }) => {
        const allOpts = options.filter(opt => opt !== '전체');
        const values = selected[param] || [];
        const isAllSelected = values.length === 0 || values.length === allOpts.length;
        
        return (
          <div key={param}>
            <h3 className="font-bold text-sm text-gray-800 mb-[1em] md:mb-[0.5em]">{title}</h3>
            <div className="flex flex-col md:flex-row gap-y-[0.75em] md:gap-x-[0.25em] min-w-[5em]">
              {options.map(option => {
                // Determine active styling
                const isActive =
                  option === '전체' ? isAllSelected : values.includes(option);

                return (
                  <button
                    key={`${param}-${option}`}
                    onClick={() => handleFilterChange(param, option)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition font-medium shadow-sm whitespace-nowrap flex items-center gap-1 ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'text-gray-600 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                    }`}
                  >
                    {isActive ? (
                      // Active
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-check-icon mr-[0.25em]"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : (
                      // Inactive
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-icon lucide-circle mr-[0.25em]"><circle cx="12" cy="12" r="10"/></svg>
                    )}
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}