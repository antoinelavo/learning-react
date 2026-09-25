'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { revealsRemaining } from '@/lib/reveal';

// Toggle switch: on (파란색) = 플러스, off (회색) = 무료. Mirrors
// app/admin/payments/PaymentRequestsTable.jsx's StatusSwitch.
function TierSwitch({ checked, disabled, busy, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      title={checked ? '플러스 해제하기' : '플러스로 전환하기'}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white">…</span>
      )}
    </button>
  );
}

export default function TeacherTiersTable() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('teachers')
      .select('id, name, status, tier, reveal_count, reveal_reset_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ teachers fetch error:', error);
      setFetchError(error.message);
    } else {
      setFetchError(null);
      setTeachers(data || []);
    }
    setLoading(false);
  }

  async function handleToggle(teacher) {
    const nextTier = teacher.tier === 'premium' ? 'free' : 'premium';
    const label = nextTier === 'premium' ? '플러스로 전환' : '플러스 해제';
    const confirmed = window.confirm(`${teacher.name} 선생님을 ${label}하시겠습니까?`);
    if (!confirmed) return;

    setBusyId(teacher.id);
    try {
      const { error } = await supabase.from('teachers').update({ tier: nextTier }).eq('id', teacher.id);

      if (error) {
        console.error('❌ tier update error:', error);
        alert('요금제 변경 중 오류가 발생했습니다.');
        return;
      }

      setTeachers((prev) => prev.map((t) => (t.id === teacher.id ? { ...t, tier: nextTier } : t)));
    } finally {
      setBusyId(null);
    }
  }

  const q = query.trim().toLowerCase();
  const filteredTeachers = teachers.filter((t) => (q ? (t.name || '').toLowerCase().includes(q) : true));

  if (loading) {
    return <div className="text-center text-gray-500 py-10">불러오는 중...</div>;
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이름 검색..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />

      <div className="text-sm text-gray-500">
        총 {teachers.length}명 · {filteredTeachers.length}건 검색됨
      </div>

      {fetchError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          데이터를 불러오지 못했습니다: {fetchError}
        </div>
      )}

      {filteredTeachers.length === 0 ? (
        <div className="text-center text-gray-500 py-10">검색 결과가 없습니다.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-2">선생님</th>
                <th className="px-4 py-2">프로필 상태</th>
                <th className="px-4 py-2">요금제</th>
                <th className="px-4 py-2">이번 달 연락처 열람</th>
                <th className="px-4 py-2">플러스 전환</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => {
                const isPremium = teacher.tier === 'premium';
                const isBusy = busyId === teacher.id;

                return (
                  <tr key={teacher.id} className="border-t">
                    <td className="px-4 py-2 font-medium whitespace-nowrap">
                      <a
                        href={`/profile/${encodeURIComponent(teacher.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {teacher.name}
                      </a>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">{teacher.status || '—'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {isPremium ? (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                          플러스
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                          무료
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                      {isPremium ? '무제한' : `${2 - revealsRemaining(teacher)}/2회 사용`}
                    </td>
                    <td className="px-4 py-2">
                      <TierSwitch
                        checked={isPremium}
                        disabled={isBusy}
                        busy={isBusy}
                        onClick={() => handleToggle(teacher)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
