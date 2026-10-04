'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { confirmPlusBankTransfer, undoPlusBankTransfer } from '@/lib/tierActivation';
import { Notice, cardClasses, Badge } from '@/components/ui';

const ERROR_MESSAGES = {
  record_payment_failed: '결제 기록 중 오류가 발생했습니다.',
  activate_tier_failed: '플러스 전환 중 오류가 발생했습니다.',
  reset_payment_failed: '상태 초기화 중 오류가 발생했습니다.',
  deactivate_tier_failed: '플러스 해제 중 오류가 발생했습니다.',
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

// Pending first, then newest first within each group.
function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const aPending = a.status === 'pending' ? 0 : 1;
    const bPending = b.status === 'pending' ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

// Toggle switch: on (파란색) = confirmed, off (회색) = pending. Mirrors
// app/admin/payments/PaymentRequestsTable.jsx's StatusSwitch.
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
      title={checked ? '확인 취소하기' : '입금 확인 처리'}
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

export default function PlusPaymentsTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadRows();
  }, []);

  async function loadRows() {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('id, teacher_id, amount, status, created_at, teachers(name)')
      .eq('provider', 'bank_transfer')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ payments fetch error:', error);
      setFetchError(error.message);
    } else {
      setFetchError(null);
      setRows(sortRows(data || []));
    }
    setLoading(false);
  }

  function setRowStatus(id, status) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  async function handleToggle(row) {
    if (row.status === 'paid') {
      await handleUndo(row);
    } else {
      await handleConfirm(row);
    }
  }

  async function handleConfirm(row) {
    const name = row.teachers?.name || '—';
    const confirmed = window.confirm(
      `${name} 선생님의 입금을 확인 처리하시겠습니까?\n금액: ₩${Number(row.amount).toLocaleString()}\n\n확인 즉시 플러스 회원으로 전환됩니다.`
    );
    if (!confirmed) return;

    setBusyId(row.id);
    try {
      const result = await confirmPlusBankTransfer({ paymentId: row.id, teacherId: row.teacher_id });

      if (!result.ok) {
        alert(`❌ ${ERROR_MESSAGES[result.error] || '처리 중 오류가 발생했습니다.'}`);
        return;
      }

      if (result.alreadyProcessed) {
        // Row wasn't pending anymore (e.g. confirmed in another tab) —
        // show the real state instead of assuming.
        await loadRows();
        return;
      }

      setRowStatus(row.id, 'paid');
    } finally {
      setBusyId(null);
    }
  }

  async function handleUndo(row) {
    const name = row.teachers?.name || '—';
    const confirmed = window.confirm(
      `${name} 선생님의 입금 확인을 취소하시겠습니까?\n\n이 결제로 전환된 플러스 회원이 즉시 무료 회원으로 변경됩니다.`
    );
    if (!confirmed) return;

    setBusyId(row.id);
    try {
      const result = await undoPlusBankTransfer({ paymentId: row.id, teacherId: row.teacher_id });

      if (!result.ok) {
        alert(`❌ ${ERROR_MESSAGES[result.error] || '처리 중 오류가 발생했습니다.'}`);
        return;
      }

      if (result.alreadyProcessed) {
        await loadRows();
        return;
      }

      if (result.tierKept) {
        alert('다른 확인된 결제가 있어 플러스 회원은 유지됩니다.');
      }

      setRowStatus(row.id, 'pending');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-10">불러오는 중...</div>;
  }

  return (
    <div>
      {fetchError && (
        <Notice color="red" className="mb-4">
          데이터를 불러오지 못했습니다: {fetchError}
        </Notice>
      )}

      {rows.length === 0 ? (
        <div className="text-center text-gray-500 py-10">결제 요청이 없습니다.</div>
      ) : (
        <div className={cardClasses({ className: 'overflow-x-auto' })}>
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-2">선생님</th>
                <th className="px-4 py-2">금액</th>
                <th className="px-4 py-2">요청일</th>
                <th className="px-4 py-2">상태</th>
                <th className="px-4 py-2">입금 확인</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const name = row.teachers?.name;
                const isConfirmed = row.status === 'paid';
                const isBusy = busyId === row.id;

                return (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-2 font-medium whitespace-nowrap">
                      {name ? (
                        <a
                          href={`/profile/${encodeURIComponent(name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {name}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">₩{Number(row.amount).toLocaleString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {isConfirmed ? (
                        <Badge color="green">
                          확인됨
                        </Badge>
                      ) : (
                        <Badge color="yellow">
                          대기
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <StatusSwitch
                        checked={isConfirmed}
                        disabled={isBusy}
                        busy={isBusy}
                        onClick={() => handleToggle(row)}
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
