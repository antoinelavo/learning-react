'use client';

import { useState, useEffect } from 'react';

const FILTERS = {
  subject: [],
  lessonType: ['비대면', '대면'],
  gender: ['남', '여'],
  ib: ['이수', '미이수'],
};

export default function FilterPanel({ filters, setFilters, allSubjects }) {
  const [popupType, setPopupType] = useState(null);

  const openPopup = (type) => setPopupType(type);
  const closePopup = () => setPopupType(null);

  const handleCheckboxChange = (category, value) => {
    setFilters(prev => {
      const updated = prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value];
      return { ...prev, [category]: updated };
    });
  };

  const isChecked = (category, value) => filters[category]?.includes(value);

  return (
    <>
      {/* 🖥️ Desktop filters */}
      <div className="
      +        hidden 
      +        md:flex md:flex-col md:w-fit 
      +        md:sticky md:top-20 
      +        border p-6 rounded-xl bg-white mb-6
      +      ">        
        <FilterGroup title="과목" category="subject" options={allSubjects} isChecked={isChecked} onChange={handleCheckboxChange} />
        <FilterGroup title="수업 방식" category="lessonType" options={FILTERS.lessonType} isChecked={isChecked} onChange={handleCheckboxChange} />
        <FilterGroup title="성별" category="gender" options={FILTERS.gender} isChecked={isChecked} onChange={handleCheckboxChange} />
        <FilterGroup title="IB 이수 여부" category="ib" options={FILTERS.ib} isChecked={isChecked} onChange={handleCheckboxChange} />
      </div>

      {/* 📱 Mobile filter buttons */}
      <div className="md:hidden flex justify-center gap-3 text-sm font-medium mb-4">
        {['subject', 'lessonType', 'gender', 'ib'].map(type => (
          <button
            key={type}
            className="teacherBlock text-gray-700 border px-3 py-1 rounded-lg"
            onClick={() => openPopup(type)}
          >
            {type === 'subject' ? '과목' :
             type === 'lessonType' ? '수업 방식' :
             type === 'gender' ? '성별' : 'IB 이수 여부'} ▼
          </button>
        ))}
      </div>

      {/* 📱 Mobile popup */}
      {popupType && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[90vw] max-w-xs">
            <h3 className="font-bold mb-4 text-center">
              {popupType === 'subject' ? '과목 선택' :
               popupType === 'lessonType' ? '수업 방식' :
               popupType === 'gender' ? '성별' : 'IB 이수 여부'}
            </h3>
            <FilterGroup
              category={popupType}
              options={popupType === 'subject' ? allSubjects : FILTERS[popupType]}
              isChecked={isChecked}
              onChange={handleCheckboxChange}
            />
            <button onClick={closePopup} className="block w-full mt-6 bg-black text-white py-2 rounded">적용</button>
          </div>
        </div>
      )}
    </>
  );
}

function FilterGroup({ title, category, options, isChecked, onChange }) {
  return (
    <div className="flex flex-col gap-2 min-w-[120px]">
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      {options.map(option => (
        <label key={option} className="text-sm text-gray-800 flex items-center gap-2">
          <input
            type="checkbox"
            checked={isChecked(category, option)}
            onChange={() => onChange(category, option)}
          />
          {option}
        </label>
      ))}
    </div>
  );
}
