'use client';

import { useState, useEffect } from 'react';
import { chipClasses } from '@/components/ui';

export default function FilterLinksClient() {
  const [selected, setSelected] = useState({
    region: [],
    lessonType: [],
    format: [],
    service: [],
  });

  const [openDropdown, setOpenDropdown] = useState(null);

  const filterGroups = [
    { title: '지역', param: 'region', options: ['전체', '강남', '분당', '부산', '온라인'] },
    { title: '수업 방식', param: 'lessonType', options: ['1:1', '그룹', '인강'] },
    { title: '수업 형태', param: 'format', options: ['대면', '온라인'] },
    { title: '추가 과목', param: 'service', options: ['AP', 'ACT', 'IB', 'GCSE', 'TOEFL', '컨설팅'] },
  ];

  useEffect(() => {
    function handleClick(e) {
      if (!e.target.closest('.filter-dropdown')) setOpenDropdown(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleFilterChange = (param, option) => {
    const allOpts = filterGroups.find(g => g.param === param)?.options.filter(opt => opt !== '전체') || [];
    const values = selected[param] || [];
    const isAllSelected = values.length === 0 || values.length === allOpts.length;

    let updatedValues = [];
    if (option === '전체') {
      updatedValues = isAllSelected ? [] : allOpts;
    } else {
      updatedValues = values.includes(option)
        ? values.filter(v => v !== option)
        : [...values, option];
    }

    setSelected(prev => ({ ...prev, [param]: updatedValues }));
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
    <div className="flex items-center gap-2 flex-wrap my-3">
      {filterGroups.map(({ title, param, options }) => {
        const allOpts = options.filter(opt => opt !== '전체');
        const values = selected[param] || [];
        const isAllSelected = values.length === 0 || values.length === allOpts.length;
        const activeCount = isAllSelected ? 0 : values.length;
        const isOpen = openDropdown === param;

        return (
          <div key={param} className="relative filter-dropdown">
            <button
              onClick={() => setOpenDropdown(isOpen ? null : param)}
              className={chipClasses({ selected: !isAllSelected, soft: true })}
            >
              {title}{!isAllSelected ? ` (${activeCount})` : ''}
              <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex flex-wrap gap-1.5 filter-dropdown min-w-[120px]">
                {options.map(option => {
                  const isActive = option === '전체' ? isAllSelected : values.includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => handleFilterChange(param, option)}
                      className={chipClasses({ selected: isActive })}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
