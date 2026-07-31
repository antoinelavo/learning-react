'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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

function formatColumnLabel(column) {
  return column
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'boolean') return value ? '예' : '아니오';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
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
        if (data.length > 0 && !data[0].hasOwnProperty('name')) {
          setSearchColumn(Object.keys(data[0])[0]);
        }
      }
      setLoading(false);
    }

    loadTeachers();
  }, []);

  // Derive the full column list straight from whatever Supabase returns,
  // so every column in the teachers table shows up automatically.
  const columns = Array.from(
    teachers.reduce((set, t) => {
      Object.keys(t).forEach((k) => set.add(k));
      return set;
    }, new Set())
  );

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
          {columns.map((col) => (
            <option key={col} value={col}>
              {formatColumnLabel(col)}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`${formatColumnLabel(searchColumn)} 검색...`}
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
          {/* Table view (sm and up) — one column per teachers table column */}
          <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-medium text-gray-500">
                  {columns.map((col) => (
                    <th key={col} className="text-left px-4 py-3 whitespace-nowrap">
                      {formatColumnLabel(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher, i) => (
                  <tr
                    key={teacher.id}
                    className={i !== filteredTeachers.length - 1 ? 'border-b border-gray-100' : ''}
                  >
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-4 py-3 text-gray-600 max-w-[220px] truncate"
                        title={formatValue(teacher[col])}
                      >
                        {col === 'name' ? (
                          <a
                            href={`/profile/${encodeURIComponent(teacher.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-gray-900 hover:underline"
                          >
                            {teacher.name}
                          </a>
                        ) : col === 'status' ? (
                          <StatusBadge status={teacher.status} />
                        ) : (
                          formatValue(teacher[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card list view (below sm) — every column listed per teacher */}
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
                    {teacher.name || '없음'}
                  </a>
                  <StatusBadge status={teacher.status} />
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  {columns
                    .filter((col) => col !== 'name' && col !== 'status')
                    .map((col) => (
                      <div key={col}>
                        <strong>{formatColumnLabel(col)}:</strong> {formatValue(teacher[col])}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
