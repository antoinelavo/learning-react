'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { activatePremium } from '@/lib/premiumActivation';

const ERROR_MESSAGES = {
  spots_unavailable: '선택한 과목의 프리미엄 자리가 모두 찼습니다.',
  availability_check_failed: '프리미엄 자리 확인 중 오류가 발생했습니다.',
  record_payment_failed: '결제 기록 중 오류가 발생했습니다.',
  activate_premium_failed: '프리미엄 활성화 중 오류가 발생했습니다.',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Toggle switch: on (파란색) = confirmed, off (회색) = pending.
function StatusSwitch({ checked, disabled, busy, onClick }) {
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
      title={checked ? '입금 확인됨' : '입금 확인 처리'}
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

export default function PaymentRequestsTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    loadRows();
  }, []);

  async function loadRows() {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_request')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('❌ payment_request fetch error:', error);
      setFetchError(error.message);
    } else {
      setFetchError(null);
      setRows(data || []);
    }
    setLoading(false);
  }

  async function handleConfirm(row) {
    const subjectList = (row.subjects || []).join(', ');
    const confirmed = window.confirm(
      `${row.name} 선생님의 입금을 확인 처리하시겠습니까?\n과목: ${subjectList}\n금액: ₩${Number(row.amount).toLocaleString()}\n\n확인 즉시 해당 과목으로 프리미엄 프로필이 활성화됩니다.`
    );
    if (!confirmed) return;

    setConfirmingId(row.id);
    try {
      const result = await activatePremium({
        // Bank-transfer requests never touch Toss/NicePay, so there's no
        // real paymentKey — this row's own id (unique) stands in for one,
        // keeping activatePremium's idempotency check meaningful.
        paymentId: `bank_${row.id}`,
        teacherId: row.teacher_id,
        teacherName: row.name,
        subjects: row.subjects,
        durationMonths: row.duration_months,
        expectedAmount: row.amount,
        paymentRequestId: row.id,
      });

      if (!result.ok) {
        const detail =
          result.error === 'spots_unavailable' && result.unavailableSubjects
            ? ` (${result.unavailableSubjects.join(', ')})`
            : '';
        alert(`❌ ${ERROR_MESSAGES[result.error] || '처리 중 오류가 발생했습니다.'}${detail}`);
        return;
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, admin_confirmed: true, confirmed_at: new Date().toISOString() } : r
        )
      );
    } finally {
      setConfirmingId(null);
    }
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-10">불러오는 중...</div>;
  }

  return (
    <div>
      {fetchError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          데이터를 불러오지 못했습니다: {fetchError}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center text-gray-500 py-10">결제 요청이 없습니다.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-2">선생님</th>
                <th className="px-4 py-2">과목</th>
                <th className="px-4 py-2">기간</th>
                <th className="px-4 py-2">금액</th>
                <th className="px-4 py-2">결제 방식</th>
                <th className="px-4 py-2">요청일</th>
                <th className="px-4 py-2">상태</th>
                <th className="px-4 py-2">입금 확인</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isCardPayment = Boolean(row.order_id);
                const isConfirmed = row.admin_confirmed === true;
                const isBusy = confirmingId === row.id;

                return (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-2 font-medium whitespace-nowrap">
                      <a
                        href={`/profile/${encodeURIComponent(row.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {row.name}
                      </a>
                    </td>
                    <td className="px-4 py-2">{(row.subjects || []).join(', ')}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{row.duration_months}개월</td>
                    <td className="px-4 py-2 whitespace-nowrap">₩{Number(row.amount).toLocaleString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{isCardPayment ? '카드' : '계좌이체'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">{formatDate(row.requested_at)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {isConfirmed ? (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
                          확인됨
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                          대기중
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isCardPayment && !isConfirmed ? (
                        <span className="text-xs text-gray-400">카드 결제 자동 처리 대기</span>
                      ) : (
                        <StatusSwitch
                          checked={isConfirmed}
                          disabled={isConfirmed || isBusy}
                          busy={isBusy}
                          onClick={() => handleConfirm(row)}
                        />
                      )}
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
