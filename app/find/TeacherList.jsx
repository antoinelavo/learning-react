'use client';

import { useState, useEffect } from 'react';
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

export default function TeacherList({ initialTeachers = [] }) {
  const [teachers, setTeachers] = useState((initialTeachers));
  const [loading, setLoading] = useState(false);

  // filters state
  const [filters, setFilters] = useState({
    subjects: [],
    lessonTypes: [],
    genders: [],
    ib: [],
  });

  const [subjectOptions, setSubjectOptions] = useState([]);

  // which filter‐panels are open (mobile only)
  const [openGroups, setOpenGroups] = useState({
    subjects: false,
    lessonTypes: false,
    genders: false,
    ib: false,
  });

  function toggleGroup(group) {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  }

  function toggleFilter(category, value) {
    setFilters(prev => {
      const arr = prev[category];
      const next = arr.includes(value)
        ? arr.filter(v => v !== value)
        : [...arr, value];
      return { ...prev, [category]: next };
    });
  }

  // load distinct subjects
  useEffect(() => {
    async function loadSubjects() {
      const { data, error } = await supabase
        .from('teachers')
        .select('subjects')
        .eq('status', 'approved')
        .not('subjects', 'is', null);
      if (error) {
        console.error(error);
        return;
      }
      const all = data.flatMap(r => r.subjects || []);
      setSubjectOptions(Array.from(new Set(all)).sort());
    }
    loadSubjects();
  }, []);

  // re-fetch when filters change
  useEffect(() => {
    async function fetchTeachers() {
      setLoading(true);
      let q = supabase.from('teachers').select('*').eq('status', 'approved');

      if (filters.subjects.length)
        q = q.contains('subjects', filters.subjects);
      if (filters.lessonTypes.length)
        q = q.overlaps('lesson_type', filters.lessonTypes);
      if (filters.genders.length)
        q = q.in('gender', filters.genders);
      if (filters.ib.length === 1) q = q.eq('IB', filters.ib[0]);

      const { data, error } = await q;
      if (error) console.error(error);
      else setTeachers((data || []));
      setLoading(false);
    }
    fetchTeachers();
  }, [filters]);

  return (
    <>
      {/* Filters & UI */}
      <aside className="md:w-1/4 h-fit md:sticky top-[5em] bg-white border border-gray-200 rounded-xl shadow-md p-6 mb-6 md:mb-0 md:mr-6">
        {/* Subject Filter */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <p className="font-semibold">과목</p>
            <button
              className="md:hidden text-blue-600 text-sm"
              onClick={() => toggleGroup('subjects')}
            >
              {openGroups.subjects ? '숨기기' : '보기'}
            </button>
          </div>
          <div className={`${openGroups.subjects ? 'block' : 'hidden'} md:block mt-2`}>
            <div className="overflow-y-scroll max-h-40 border border-gray-300 rounded p-2 subject-scroll">
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                {subjectOptions.map(subj => (
                  <label key={subj} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.subjects.includes(subj)}
                      onChange={() => toggleFilter('subjects', subj)}
                      className="form-checkbox"
                    />
                    <span className="ml-1 text-sm">{subj}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Type Filter */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <p className="font-semibold">수업 방식</p>
            <button
              className="md:hidden text-blue-600 text-sm"
              onClick={() => toggleGroup('lessonTypes')}
            >
              {openGroups.lessonTypes ? '숨기기' : '보기'}
            </button>
          </div>
          <div className={`${openGroups.lessonTypes ? 'block' : 'hidden'} md:block mt-2`}>
            {['비대면', '대면'].map(lt => (
              <label key={lt} className="inline-flex items-center mr-4">
                <input
                  type="checkbox"
                  checked={filters.lessonTypes.includes(lt)}
                  onChange={() => toggleFilter('lessonTypes', lt)}
                  className="form-checkbox"
                />
                <span className="ml-1 text-sm">{lt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Gender Filter */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <p className="font-semibold">성별</p>
            <button
              className="md:hidden text-blue-600 text-sm"
              onClick={() => toggleGroup('genders')}
            >
              {openGroups.genders ? '숨기기' : '보기'}
            </button>
          </div>
          <div className={`${openGroups.genders ? 'block' : 'hidden'} md:block mt-2`}>
            {['남', '여'].map(g => (
              <label key={g} className="inline-flex items-center mr-4">
                <input
                  type="checkbox"
                  checked={filters.genders.includes(g)}
                  onChange={() => toggleFilter('genders', g)}
                  className="form-checkbox"
                />
                <span className="ml-1 text-sm">{g}</span>
              </label>
            ))}
          </div>
        </div>

        {/* IB Completion Filter */}
        <div>
          <div className="flex justify-between items-center">
            <p className="font-semibold">IB 이수 여부</p>
            <button
              className="md:hidden text-blue-600 text-sm"
              onClick={() => toggleGroup('ib')}
            >
              {openGroups.ib ? '숨기기' : '보기'}
            </button>
          </div>
          <div className={`${openGroups.ib ? 'block' : 'hidden'} md:block mt-2`}>
            <label className="inline-flex items-center mr-4">
              <input
                type="checkbox"
                checked={filters.ib.includes(true)}
                onChange={() => toggleFilter('ib', true)}
                className="form-checkbox"
              />
              <span className="ml-1 text-sm">이수</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={filters.ib.includes(false)}
                onChange={() => toggleFilter('ib', false)}
                className="form-checkbox"
              />
              <span className="ml-1 text-sm">미이수</span>
            </label>
          </div>
        </div>
      </aside>

      {/* Results Section */}
      <section className="flex-1">
        {loading && !teachers.length ? (
          <p className="text-center">불러오는 중…</p>
        ) : !teachers.length ? (
          <p className="text-center">조건에 맞는 선생님이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 bg-white border border-gray-200 rounded-xl divide-y divide-gray-200 overflow-hidden shadow-lg p-0">
            {teachers.map((t, i) => (
              <TeacherCard key={t.id} {...t} priority={i === 0} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}