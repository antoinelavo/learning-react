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
  const [fetchErrors, setFetchErrors] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      // Note: `teachers` uses `created_date`, not `created_at` — matches
      // the column TeacherList.jsx/TeachersTable.jsx already order by.
      const [teachersRes, studentsRes, studentJobsRes, hagwonRequestsRes] = await Promise.all([
        supabase.from('teachers').select('created_date'),
        supabase.from('users').select('created_at').eq('role', 'student'),
        supabase.from('student_jobs').select('created_at'),
        supabase.from('hagwon_requests').select('created_at'),
      ]);

      const errors = [];
      for (const [label, res] of [
        ['신규 선생님 (teachers)', teachersRes],
        ['신규 학생 계정 (users)', studentsRes],
        ['학생 요청 (student_jobs)', studentJobsRes],
        ['학원 요청 (hagwon_requests)', hagwonRequestsRes],
      ]) {
        if (res.error) {
          console.error(`❌ Monthly stats fetch error (${label}):`, res.error);
          errors.push(`${label}: ${res.error.message}`);
        }
      }
      setFetchErrors(errors);

      const newTeachers = bucketByMonth(
        (teachersRes.data || []).map((r) => ({ created_at: r.created_date }))
      );
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

  const errorBanner = fetchErrors.length > 0 && (
    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 space-y-1">
      <p className="font-medium">일부 데이터를 불러오지 못했습니다:</p>
      {fetchErrors.map((msg) => (
        <p key={msg}>{msg}</p>
      ))}
    </div>
  );

  if (rows.length === 0) {
    return (
      <div>
        {errorBanner}
        <div className="text-center text-gray-500 py-10">표시할 데이터가 없습니다.</div>
      </div>
    );
  }

  return (
    <div>
      {errorBanner}
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
    </div>
  );
}
