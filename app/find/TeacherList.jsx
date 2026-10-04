'use client';

import { useState, useEffect, useRef } from 'react';
import TeacherCard from '@/components/TeacherCard';
import { supabase } from '@/lib/supabase';
import { Button, buttonClasses, chipClasses } from '@/components/ui';

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FilterOptions({ options, selected, onToggle, scrollClass }) {
  return (
    <div className={`flex flex-col gap-1 overflow-y-auto ${scrollClass}`}>
      {options.map(({ label, value }) => {
        const active = selected.includes(value);
        return (
          <button
            key={label}
            type="button"
            onClick={() => onToggle(value)}
            className={`flex items-center justify-between w-full min-h-[48px] px-4 py-3 rounded-xl text-base text-left transition-colors ${
              active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-800 hover:bg-gray-50'
            }`}
          >
            {label}
            {active && <CheckIcon />}
          </button>
        );
      })}
    </div>
  );
}

// Filter chip that opens a dropdown on desktop and a bottom sheet on mobile.
// Options apply immediately; 완료 / the backdrop just close.
function FilterDropdown({ label, options, selected, isOpen, onOpenChange, onToggle, onClear }) {
  const active = selected.length > 0;

  // Lock page scroll behind the mobile sheet.
  useEffect(() => {
    if (!isOpen || !window.matchMedia('(max-width: 639px)').matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  return (
    <div className="relative filter-dropdown">
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className={chipClasses({ selected: active, soft: true, compact: true })}
      >
        {label}{active ? ` (${selected.length})` : ''}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Desktop dropdown */}
          <div className="hidden sm:block absolute z-30 top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-lg p-2">
            <FilterOptions options={options} selected={selected} onToggle={onToggle} scrollClass="max-h-80" />
          </div>

          {/* Mobile bottom sheet */}
          <div className="sm:hidden fixed inset-0 z-[1100] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} aria-hidden="true" />
            <div
              role="dialog"
              aria-label={label}
              className="filter-dropdown relative bg-white rounded-t-3xl shadow-xl px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] animate-slide-up"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300" aria-hidden="true" />
              <h3 className="text-lg font-bold text-gray-900 mt-0 mb-3 px-1">{label}</h3>
              <FilterOptions options={options} selected={selected} onToggle={onToggle} scrollClass="max-h-[50vh]" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={onClear} disabled={!active}>초기화</Button>
                <Button onClick={() => onOpenChange(false)}>완료</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function QuestionCta() {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-5 text-center">
      <p className="text-sm text-gray-700 mt-0 mb-3">
        간단한 질문 몇 개만 답하면, 선생님이 직접 연락드립니다. (약 30초 소요)
      </p>
      <a href="/students/new" className={buttonClasses()}>
        질문 보기
      </a>
    </div>
  );
}

function TeacherGroup({ teachers, startIndex = 0 }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-200">
      {teachers.map((t, i) => (
        <TeacherCard key={t.id} {...t} badge={t.isPremium ? '추천' : null} priority={startIndex + i === 0} />
      ))}
    </div>
  );
}

export default function TeacherList() {
  const [allTeachers, setAllTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ subjects: [], lessonTypes: [], genders: [], ib: [] });
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (!e.target.closest('.filter-dropdown')) setOpenDropdown(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggleFilter(category, value) {
    setFilters(prev => {
      const arr = prev[category];
      const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
      return { ...prev, [category]: next };
    });
  }

  function clearCategory(category) {
    setFilters(prev => ({ ...prev, [category]: [] }));
  }

  function clearFilters() {
    setFilters({ subjects: [], lessonTypes: [], genders: [], ib: [] });
  }

  const hasActiveFilters =
    filters.subjects.length > 0 ||
    filters.lessonTypes.length > 0 ||
    filters.genders.length > 0 ||
    filters.ib.length > 0;

  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      const { data: teachers, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('status', 'approved')
        .eq('is_test', false);

      if (error) { console.error(error); setLoading(false); return; }

      const now = new Date().toISOString();
      const { data: premiumData } = await supabase
        .from('teacher_premium')
        .select('teacher_id, subject')
        .lte('start_date', now)
        .gte('end_date', now);

      const premiumIds = premiumData ? premiumData.map(p => p.teacher_id) : [];
      const processed = teachers.map(t => ({ ...t, isPremium: premiumIds.includes(t.id) }));

      setAllTeachers(processed);
      setFilteredTeachers(processed);

      const allSubjects = teachers.flatMap(t => t.subjects || []);
      setSubjectOptions(Array.from(new Set(allSubjects)).sort());
      setLoading(false);
    }
    loadAllData();
  }, []);

  useEffect(() => {
    if (!allTeachers.length) return;
    let filtered = allTeachers.filter(teacher => {
      if (filters.subjects.length > 0) {
        if (!filters.subjects.every(s => teacher.subjects?.includes(s))) return false;
      }
      if (filters.lessonTypes.length > 0) {
        if (!filters.lessonTypes.every(t => teacher.lesson_type?.includes(t))) return false;
      }
      if (filters.genders.length > 0) {
        if (!filters.genders.includes(teacher.gender)) return false;
      }
      if (filters.ib.length > 0) {
        if (!filters.ib.includes(teacher.IB)) return false;
      }
      return true;
    });
    const premium = shuffle(filtered.filter(t => t.isPremium));
    const normal = shuffle(filtered.filter(t => !t.isPremium));
    setFilteredTeachers([...premium, ...normal]);
  }, [filters, allTeachers]);

  const filterConfigs = [
    { key: 'subjects', label: '과목', options: subjectOptions.map(subj => ({ label: subj, value: subj })) },
    { key: 'lessonTypes', label: '수업 방식', options: ['비대면', '대면'].map(v => ({ label: v, value: v })) },
    { key: 'genders', label: '성별', options: ['남', '여'].map(v => ({ label: v, value: v })) },
    { key: 'ib', label: 'IB 이수', options: [{ label: '이수', value: true }, { label: '미이수', value: false }] },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen">
      {/* Top CTA */}
      <div className="mb-6">
        <QuestionCta />
      </div>

      {/* Page title */}
      <div className="mb-4">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 mt-0 mb-1 leading-snug">IB 과외 선생님 찾기</h1>
        <p className="text-sm text-gray-500 m-0">과외 글 게시, 열람 비용 없이 원하는 IB 과외 선생님을 찾아보세요.</p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap mb-4" ref={containerRef}>
        {filterConfigs.map(({ key, label, options }) => (
          <FilterDropdown
            key={key}
            label={label}
            options={options}
            selected={filters[key]}
            isOpen={openDropdown === key}
            onOpenChange={open => setOpenDropdown(open ? key : null)}
            onToggle={value => toggleFilter(key, value)}
            onClear={() => clearCategory(key)}
          />
        ))}

        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-sm text-gray-500 hover:text-red-500 transition-colors ml-1">
            필터 초기화
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-center text-sm text-gray-400 mt-10">불러오는 중…</p>
      ) : !filteredTeachers.length ? (
        <p className="text-center text-sm text-gray-400 mt-10">조건에 맞는 선생님이 없습니다.</p>
      ) : (
        <div>
          <div className="flex gap-4 mb-2 px-1">
            <p className="text-xs text-gray-500 m-0">총 검색된 선생님 수: {filteredTeachers.length}명</p>
            <p className="text-xs text-gray-400 m-0">지난달 조회수: {process.env.NEXT_PUBLIC_MONTHLY_VIEWS || '0'}회</p>
          </div>

          {filteredTeachers.length > 6 ? (
            <div className="flex flex-col gap-4">
              <TeacherGroup teachers={filteredTeachers.slice(0, 6)} />
              <QuestionCta />
              <TeacherGroup teachers={filteredTeachers.slice(6)} startIndex={6} />
            </div>
          ) : (
            <TeacherGroup teachers={filteredTeachers} />
          )}
        </div>
      )}
    </main>
  );
}
