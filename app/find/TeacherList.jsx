'use client';

import { useState, useEffect, useRef } from 'react';
import TeacherCard from '@/components/TeacherCard';
import { supabase } from '@/lib/supabase';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { Button, Input, buttonClasses, chipClasses } from '@/components/ui';

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 수업료 slider bounds, in 만원/시간. The ends are open: the bottom value means
// "and below", the top "and above".
const RATE_MIN = 2;
const RATE_MAX = 15;

function formatRate(value) {
  return value >= RATE_MAX ? `${RATE_MAX}만원+` : `${value}만원`;
}

function hasRate(teacher) {
  return typeof teacher.rate === 'number' && teacher.rate > 0;
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
// Changes apply immediately; 완료 / the backdrop just close.
function FilterDropdown({ label, chipLabel, active, isOpen, onOpenChange, onClear, renderBody }) {

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
        {chipLabel}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Desktop dropdown */}
          <div className="hidden sm:block absolute z-30 top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-lg p-2">
            {renderBody('desktop')}
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
              {renderBody('mobile')}
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

function RateSlider({ value, onChange }) {
  return (
    <div className="px-3 pt-4 pb-2">
      <div className="px-2">
        <Slider
          range
          min={RATE_MIN}
          max={RATE_MAX}
          step={1}
          value={value}
          onChange={onChange}
          allowCross={false}
          trackStyle={[{ backgroundColor: '#2686D1', height: 6 }]}
          railStyle={{ backgroundColor: '#e5e7eb', height: 6 }}
          handleStyle={[
            { borderColor: '#2686D1', backgroundColor: '#fff', width: 24, height: 24, marginTop: -9, opacity: 1 },
            { borderColor: '#2686D1', backgroundColor: '#fff', width: 24, height: 24, marginTop: -9, opacity: 1 },
          ]}
        />
      </div>
      <p className="text-center text-base font-semibold text-blue-700 mt-5 mb-1">
        {formatRate(value[0])} – {formatRate(value[1])}
      </p>
      <p className="text-center text-xs text-gray-400 m-0">시간당 수업료</p>
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
  const [search, setSearch] = useState('');
  const [rateRange, setRateRange] = useState([RATE_MIN, RATE_MAX]);
  const [showChipFade, setShowChipFade] = useState(false);
  const containerRef = useRef(null);

  // Show the right-edge fade only while more chips are off-screen.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setShowChipFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
    // Chip labels change width as filters are set, so re-check then too.
  }, [loading, filters, rateRange, search]);

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
    setSearch('');
    setRateRange([RATE_MIN, RATE_MAX]);
  }

  const rateActive = rateRange[0] > RATE_MIN || rateRange[1] < RATE_MAX;

  const hasActiveFilters =
    filters.subjects.length > 0 ||
    filters.lessonTypes.length > 0 ||
    filters.genders.length > 0 ||
    filters.ib.length > 0 ||
    search.trim() !== '' ||
    rateActive;

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
      const withPremium = teachers.map(t => ({ ...t, isPremium: premiumIds.includes(t.id) }));
      // Shuffle once per visit (premium first) so the order stays put while
      // the visitor types or adjusts filters.
      const processed = [
        ...shuffle(withPremium.filter(t => t.isPremium)),
        ...shuffle(withPremium.filter(t => !t.isPremium)),
      ];

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
    const query = search.trim().toLowerCase();
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
      if (query) {
        const haystack = [
          teacher.name,
          teacher.school,
          teacher.shortintroduction,
          ...(teacher.subjects || []),
          teacher.extra_subject,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    if (rateActive) {
      // Teachers in range first; teachers who never entered a rate stay
      // visible after them. Other rates are hidden.
      const [lo, hi] = rateRange;
      const inRange = filtered.filter(t => hasRate(t) && (lo <= RATE_MIN || t.rate >= lo) && (hi >= RATE_MAX || t.rate <= hi));
      const noRate = filtered.filter(t => !hasRate(t));
      filtered = [...inRange, ...noRate];
    }

    setFilteredTeachers(filtered);
  }, [filters, allTeachers, search, rateRange, rateActive]);

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

      {/* Search */}
      <div className="relative mb-3">
        <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" strokeWidth={2} />
          <path strokeLinecap="round" strokeWidth={2} d="M20 20l-3.5-3.5" />
        </svg>
        <Input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="이름, 학교, 과목으로 검색"
          aria-label="선생님 검색"
          className="pl-11"
        />
      </div>

      {/* Filter bar: one swipeable row on phones, wrapping on desktop */}
      <div className="relative mb-4">
        <div
          ref={containerRef}
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto sm:overflow-visible sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {filterConfigs.map(({ key, label, options }) => (
            <div key={key} className="shrink-0">
              <FilterDropdown
                label={label}
                chipLabel={filters[key].length ? `${label} (${filters[key].length})` : label}
                active={filters[key].length > 0}
                isOpen={openDropdown === key}
                onOpenChange={open => setOpenDropdown(open ? key : null)}
                onClear={() => clearCategory(key)}
                renderBody={variant => (
                  <FilterOptions
                    options={options}
                    selected={filters[key]}
                    onToggle={value => toggleFilter(key, value)}
                    scrollClass={variant === 'desktop' ? 'max-h-80' : 'max-h-[50vh]'}
                  />
                )}
              />
            </div>
          ))}

          <div className="shrink-0">
            <FilterDropdown
              label="수업료"
              chipLabel={rateActive ? `${rateRange[0]}–${rateRange[1] >= RATE_MAX ? `${RATE_MAX}+` : rateRange[1]}만원` : '수업료'}
              active={rateActive}
              isOpen={openDropdown === 'rate'}
              onOpenChange={open => setOpenDropdown(open ? 'rate' : null)}
              onClear={() => setRateRange([RATE_MIN, RATE_MAX])}
              renderBody={() => <RateSlider value={rateRange} onChange={setRateRange} />}
            />
          </div>

          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="shrink-0 whitespace-nowrap text-sm text-gray-500 hover:text-red-500 transition-colors ml-1 pr-4 sm:pr-0">
              필터 초기화
            </button>
          )}
        </div>
        {showChipFade && (
          <div className="sm:hidden pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-gray-50 to-transparent" aria-hidden="true" />
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
