'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Pinned atop a thread when the other participant is a teacher — a brief
// summary pulled directly from their profile, per the original request.
export default function TeacherSummaryCard({ teacherUserId }) {
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('teachers')
      .select('name, profile_picture, shortintroduction, subjects, rate, rate_description')
      .eq('user_id', teacherUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setTeacher(data);
      });
    return () => {
      cancelled = true;
    };
  }, [teacherUserId]);

  if (!teacher) return null;

  return (
    <a
      href={`/profile/${encodeURIComponent(teacher.name)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 border-b border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors"
    >
      <img
        src={teacher.profile_picture || 'https://ibmaster.antoinelavo.com/teachers/default.jpg'}
        alt={teacher.name}
        className="w-11 h-11 rounded-full object-cover flex-shrink-0"
      />
      <div className="min-w-0">
        <div className="font-semibold text-sm text-gray-900 truncate">{teacher.name}</div>
        {teacher.shortintroduction && (
          <div className="text-xs text-gray-500 truncate">{teacher.shortintroduction}</div>
        )}
        <div className="text-xs text-gray-400 truncate">
          {(teacher.subjects || []).slice(0, 3).join(', ')}
          {teacher.rate ? ` · 시급 ${teacher.rate}만원` : ''}
        </div>
      </div>
    </a>
  );
}
