'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

function monthKey(dateStr) {
  return dateStr.slice(0, 7); // 'YYYY-MM-DDTHH:...' -> 'YYYY-MM'
}

function bucketByMonth(rows) {
  const counts = {};
  for (const row of rows) {
    if (!row.created_at) continue;
    const key = monthKey(row.created_at);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export default function MonthlyStatsTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [teachersRes, studentsRes, studentJobsRes, hagwonRequestsRes] = await Promise.all([
        supabase.from('teachers').select('created_at'),
        supabase.from('users').select('created_at').eq('role', 'student'),
        supabase.from('student_jobs').select('created_at'),
        supabase.from('hagwon_requests').select('created_at'),
      ]);

      for (const [label, res] of [
        ['teachers', teachersRes],
        ['users', studentsRes],
        ['student_jobs', studentJobsRes],
        ['hagwon_requests', hagwonRequestsRes],
      ]) {
        if (res.error) console.error(`❌ Monthly stats fetch error (${label}):`, res.error);
      }

      const newTeachers = bucketByMonth(teachersRes.data || []);
      const newStudents = bucketByMonth(studentsRes.data || []);
      const studentRequests = bucketByMonth(studentJobsRes.data || []);
      const hagwonRequests = bucketByMonth(hagwonRequestsRes.data || []);

      const months = new Set([
        ...Object.keys(newTeachers),
        ...Object.keys(newStudents),
        ...Object.keys(studentRequests),
        ...Object.keys(hagwonRequests),
      ]);

      const tableRows = Array.from(months)
        .sort((a, b) => b.localeCompare(a)) // newest first
        .map((month) => ({
          month,
          newTeachers: newTeachers[month] || 0,
          newStudents: newStudents[month] || 0,
          studentRequests: studentRequests[month] || 0,
          hagwonRequests: hagwonRequests[month] || 0,
        }));

      setRows(tableRows);
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500 py-10">불러오는 중...</div>;
  }

  if (rows.length === 0) {
    return <div className="text-center text-gray-500 py-10">표시할 데이터가 없습니다.</div>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="px-4 py-2">월</th>
            <th className="px-4 py-2">신규 선생님</th>
            <th className="px-4 py-2">신규 학생 계정</th>
            <th className="px-4 py-2">학생 요청</th>
            <th className="px-4 py-2">학원 요청</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month} className="border-t">
              <td className="px-4 py-2 font-medium">{row.month}</td>
              <td className="px-4 py-2">{row.newTeachers}</td>
              <td className="px-4 py-2">{row.newStudents}</td>
              <td className="px-4 py-2">{row.studentRequests}</td>
              <td className="px-4 py-2">{row.hagwonRequests}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
