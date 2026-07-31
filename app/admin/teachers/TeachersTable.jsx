'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const SEARCH_COLUMNS = [
  { value: 'name', label: 'Name' },
  { value: 'school', label: 'School' },
  { value: 'status', label: 'Status' },
  { value: 'contact_information', label: 'Contact Info' },
  { value: 'subjects', label: 'Subjects' },
  { value: 'extra_subject', label: 'Extra Subject' },
];

const STATUS_STYLES = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-500';
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${style}`}>
      {status || '없음'}
    </span>
  );
}

export default function TeachersTable() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchColumn, setSearchColumn] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadTeachers() {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_date', { ascending: false });

      if (!error && data) {
        setTeachers(data);
      }
      setLoading(false);
    }

    loadTeachers();
  }, []);

  const query = searchQuery.trim().toLowerCase();
  const filteredTeachers = teachers.filter((t) => {
    if (!query) return true;
    const val = t[searchColumn];
    if (Array.isArray(val)) {
      return val.some((v) => String(v).toLowerCase().includes(query));
    }
    return String(val ?? '').toLowerCase().includes(query);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={searchColumn}
          onChange={(e) => setSearchColumn(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:w-48"
        >
          {SEARCH_COLUMNS.map((col) => (
            <option key={col.value} value={col.value}>
              {col.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`${SEARCH_COLUMNS.find((c) => c.value === searchColumn)?.label} 검색...`}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="text-sm text-gray-500">
        총 {teachers.length}명 · {filteredTeachers.length}건 검색됨
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      ) : filteredTeachers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <>
          {/* Table view (sm and up) */}
          <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-medium text-gray-500">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">School</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Subjects</th>
                  <th className="text-left px-4 py-3">Contact</th>
                  <th className="text-left px-4 py-3">Extra Subject</th>
                  <th className="text-left px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher, i) => (
                  <tr
                    key={teacher.id}
                    className={i !== filteredTeachers.length - 1 ? 'border-b border-gray-100' : ''}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <a
                        href={`/profile/${encodeURIComponent(teacher.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {teacher.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{teacher.school || '없음'}</td>
                    <td className="px-4 py-3"><StatusBadge status={teacher.status} /></td>
                    <td className="px-4 py-3 text-gray-600">
                      {Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : (teacher.subjects || '없음')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{teacher.contact_information || '없음'}</td>
                    <td className="px-4 py-3 text-gray-600">{teacher.extra_subject || '없음'}</td>
                    <td className="px-4 py-3 text-gray-500">{teacher.created_date || '없음'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card list view (below sm) */}
          <div className="sm:hidden space-y-3">
            {filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="bg-white p-4 rounded-xl shadow space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={`/profile/${encodeURIComponent(teacher.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold hover:underline"
                  >
                    {teacher.name}
                  </a>
                  <StatusBadge status={teacher.status} />
                </div>
                <div className="text-gray-500 text-sm">{teacher.school || '없음'}</div>
                <div className="text-sm text-gray-700">
                  <strong>과목:</strong>{' '}
                  {Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : (teacher.subjects || '없음')}
                  <br />
                  <strong>추가 과목:</strong> {teacher.extra_subject || '없음'}
                  <br />
                  <strong>연락처:</strong> {teacher.contact_information || '없음'}
                  <br />
                  <strong>가입일:</strong> {teacher.created_date || '없음'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
