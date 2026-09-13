'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminPayoutsPage() {
  const { role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingKey, setPayingKey] = useState(null);

  useEffect(() => {
    if (!authLoading && role !== 'admin') {
      alert('Access denied: Admins only.');
      router.push('/');
    }
  }, [authLoading, role, router]);

  async function load() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/admin/payouts', {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setPending(data.pending || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (role === 'admin') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handleMarkPaid = async (group) => {
    const key = `${group.teacher_id}_${group.period_month}`;
    if (!window.confirm(`${group.teacher?.name || '이 선생님'}에게 ₩${group.teacher_earning_krw.toLocaleString()}을 계좌이체로 지급 완료했나요?`)) {
      return;
    }
    setPayingKey(key);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/admin/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ teacher_id: group.teacher_id, period_month: group.period_month }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || '처리에 실패했습니다.');
    } else {
      await load();
    }
    setPayingKey(null);
  };

  if (authLoading || role !== 'admin') return null;

  return (
    <div className="max-w-screen-lg mx-auto pt-6 sm:pt-8 px-4 mb-[20dvh]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">월별 정산</h1>
        <Link href="/admin" className="text-sm text-blue-600">&larr; 관리자 홈</Link>
      </div>

      {loading ? (
        <p className="text-gray-500">불러오는 중...</p>
      ) : pending.length === 0 ? (
        <p className="text-gray-500">정산 대기 중인 판매가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {pending.map((group) => {
            const key = `${group.teacher_id}_${group.period_month}`;
            return (
              <div key={key} className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{group.teacher?.name || '(이름 없음)'}</p>
                  <p className="text-xs text-gray-500">
                    {group.period_month.slice(0, 7)} · 판매 {group.purchase_count}건 · 매출 ₩{group.total_sales_krw.toLocaleString()} · 수수료 ₩{group.platform_fee_krw.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    계좌: {group.teacher?.bank_name || '-'} {group.teacher?.bank_account_number || ''} ({group.teacher?.bank_account_holder || '-'})
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-lg font-bold text-blue-600">₩{group.teacher_earning_krw.toLocaleString()}</span>
                  <button
                    onClick={() => handleMarkPaid(group)}
                    disabled={payingKey === key}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {payingKey === key ? '처리 중...' : '지급 완료 처리'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
