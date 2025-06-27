'use client';

import { useEffect, useRef, useState } from 'react';
import TeacherCard from './TeacherCard';
import { supabase } from '@/supabase';

export default function TeacherList({ filters }) {
  const [teachers, setTeachers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const observerRef = useRef(null);
  const batchSize = 10;

  useEffect(() => {
    setIndex(0);
    setTeachers([]);
    setHasMore(true);
  }, [filters]);

  useEffect(() => {
    if (index === 0) fetchTeachers();
  }, [index]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && hasMore) {
        fetchTeachers();
      }
    }, { threshold: 1 });

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore]);

  async function fetchTeachers() {
    setLoading(true);

    let query = supabase.from('teachers').select('*').eq('status', 'approved');

    if (filters.gender.length > 0) query = query.in('gender', filters.gender);
    if (filters.subject.length > 0) query = query.contains('subjects', filters.subject);
    if (filters.lessonType.length > 0) query = query.overlaps('lesson_type', filters.lessonType);
    if (filters.ib.length === 1) query = query.eq('IB', filters.ib[0] === '이수');

    const { data, error } = await query.range(index, index + batchSize - 1);
    if (error) {
      console.error('Error fetching teachers:', error);
      setLoading(false);
      return;
    }

    
    // ── grab any premium entries for this batch ──
    const ids = data.map(t => t.id);
    const { data: premiumEntries } = await supabase
      .from('teacher_premium')
      .select('teacher_id, subject, end_date')
      .in('teacher_id', ids);
    const now = new Date();

    // ── tag each teacher with badge=true if they have a valid premium for the current subject ──
    const enriched = data.map(t => {
      const isPremium = (t.subjects || []).some(subj =>
        premiumEntries.some(pe =>
          pe.teacher_id === t.id &&
          pe.subject === subj &&
          new Date(pe.end_date) > now &&
          filters.subject.includes(subj)
        )
      );
      return { ...t, badge: isPremium };
    });

    setTeachers(prev => [...prev, ...enriched]);
    setIndex(prev => prev + batchSize);
    setHasMore(data.length === batchSize);
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-5">
      {teachers.length === 0 && !loading && (
        <p className="text-sm text-gray-500">조건에 맞는 선생님이 없습니다.</p>
      )}
      {teachers.map(t => (
        <TeacherCard
          key={t.id}
          name={t.name}
          school={t.school}
          shortintroduction={t.shortintroduction}
          profile_picture={t.profile_picture}
          badge={t.badge}
        />
      ))}
      <div ref={observerRef} />
      {loading && <p className="text-sm text-gray-400">불러오는 중...</p>}
    </div>
  );
}
