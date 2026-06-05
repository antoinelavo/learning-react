'use client';

import { useState, useEffect, useRef } from 'react';
import TeacherCard from '@/components/TeacherCard';
import { supabase } from '@/lib/supabase';

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function FilterDropdown({ label, activeCount, isOpen, onToggle, children }) {
  const active = activeCount > 0;
  return (
    <div className="relative filter-dropdown">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
          active
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
        }`}
      >
        {label}{active ? ` (${activeCount})` : ''}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 min-w-[140px] filter-dropdown">
          {children}
        </div>
      )}
    </div>
  );
}

function PillOption({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
      }`}
    >
      {label}
    </button>
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
        .eq('status', 'approved');

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

  return (
    <main className="max-w-3xl mx-auto px-3 py-3 min-h-screen">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 mb-3 text-center">
        <p className="text-sm text-gray-700 mb-2">
          간단한 질문 몇 개만 답하면, 선생님이 직접 연락드립니다. (약 30초 소요)
        </p>
        <a
          href="/students/new"
          className="inline-block px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          질문 보기
        </a>
      </div>

      {/* Page title */}
      <div className="mb-3">
        <h1 className="text-base font-bold text-gray-900">IB 과외 선생님 찾기</h1>
        <p className="text-xs text-gray-500">과외 글 게시, 열람 비용 없이 원하는 IB 과외 선생님을 찾아보세요.</p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap mb-3" ref={containerRef}>
        {/* 과목 */}
        <FilterDropdown
          label="과목"
          activeCount={filters.subjects.length}
          isOpen={openDropdown === 'subjects'}
          onToggle={() => setOpenDropdown(openDropdown === 'subjects' ? null : 'subjects')}
        >
          <div className="max-h-48 overflow-y-auto">
            {subjectOptions.map(subj => (
              <button
                key={subj}
                onClick={() => toggleFilter('subjects', subj)}
                className={`w-full text-left px-2 py-1.5 text-sm rounded-lg transition-colors ${
                  filters.subjects.includes(subj)
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* 수업 방식 */}
        <FilterDropdown
          label="수업 방식"
          activeCount={filters.lessonTypes.length}
          isOpen={openDropdown === 'lessonTypes'}
          onToggle={() => setOpenDropdown(openDropdown === 'lessonTypes' ? null : 'lessonTypes')}
        >
          <div className="flex gap-2 p-1">
            {['비대면', '대면'].map(lt => (
              <PillOption key={lt} label={lt} active={filters.lessonTypes.includes(lt)} onClick={() => toggleFilter('lessonTypes', lt)} />
            ))}
          </div>
        </FilterDropdown>

        {/* 성별 */}
        <FilterDropdown
          label="성별"
          activeCount={filters.genders.length}
          isOpen={openDropdown === 'genders'}
          onToggle={() => setOpenDropdown(openDropdown === 'genders' ? null : 'genders')}
        >
          <div className="flex gap-2 p-1">
            {['남', '여'].map(g => (
              <PillOption key={g} label={g} active={filters.genders.includes(g)} onClick={() => toggleFilter('genders', g)} />
            ))}
          </div>
        </FilterDropdown>

        {/* IB 이수 여부 */}
        <FilterDropdown
          label="IB 이수"
          activeCount={filters.ib.length}
          isOpen={openDropdown === 'ib'}
          onToggle={() => setOpenDropdown(openDropdown === 'ib' ? null : 'ib')}
        >
          <div className="flex gap-2 p-1">
            {[{ label: '이수', value: true }, { label: '미이수', value: false }].map(({ label, value }) => (
              <PillOption key={label} label={label} active={filters.ib.includes(value)} onClick={() => toggleFilter('ib', value)} />
            ))}
          </div>
        </FilterDropdown>

        {/* Clear */}
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1">
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
          <div className="flex gap-4 mb-2">
            <p className="text-xs text-gray-500">총 검색된 선생님 수: {filteredTeachers.length}명</p>
            <p className="text-xs text-gray-400">지난달 조회수: {process.env.NEXT_PUBLIC_MONTHLY_VIEWS || '0'}회</p>
          </div>

          <div className="flex flex-col bg-white border-t border-gray-200 sm:border sm:border-gray-200 sm:rounded-xl divide-y divide-gray-200 overflow-hidden sm:shadow-lg">
            {filteredTeachers.map((t, i) => (
              <div key={t.id}>
                <TeacherCard {...t} badge={t.isPremium ? '추천' : null} priority={i === 0} />
                {i === 5 && filteredTeachers.length > 6 && (
                  <div className="px-4 py-5 bg-blue-50 text-center">
                    <p className="text-sm text-gray-700 mb-3">
                      간단한 질문 몇 개만 답하면, 선생님이 직접 연락드립니다. (약 30초 소요)
                    </p>
                    <a href="/students/new" className="inline-block px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                      질문 보기
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
