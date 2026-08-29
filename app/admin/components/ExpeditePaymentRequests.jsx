'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Lists bank-transfer expedite-approval requests that haven't been confirmed
// yet. Confirming here only marks the payment as received — it does not
// approve the teacher's profile; that's still a separate step via the
// existing "승인" button in TeacherList once the content itself is reviewed.
export default function ExpeditePaymentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    const { data, error } = await supabase
      .from('expedite_payments')
      .select('id, teacher_id, amount, requested_at, teachers(name)')
      .eq('method', 'bank_transfer')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  }

  async function confirmPayment(id) {
    const { error } = await supabase
      .from('expedite_payments')
      .update({ status: 'paid', completed_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert('❌ 입금 확인 처리 중 오류가 발생했습니다.');
    }
  }

  if (loading || requests.length === 0) return null;

  return (
    <section className="max-w-xl mx-auto mt-10 space-y-3">
      <h3 className="text-lg font-semibold">💰 계좌이체 확인 대기 ({requests.length}건)</h3>
      {requests.map((r) => (
        <div key={r.id} className="bg-white p-4 rounded-xl shadow flex items-center justify-between gap-4">
          <div>
            <div className="font-bold">{r.teachers?.name || `#${r.teacher_id}`}</div>
            <div className="text-sm text-gray-500">
              {r.amount?.toLocaleString()}원 · {new Date(r.requested_at).toLocaleString()}
            </div>
          </div>
          <button
            onClick={() => confirmPayment(r.id)}
            className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm shrink-0"
          >
            입금 확인
          </button>
        </div>
      ))}
    </section>
  );
}
