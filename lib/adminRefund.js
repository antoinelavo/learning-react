// lib/adminRefund.js
// Client-side call to app/api/portone/refund from the admin payment pages.
// Sends the admin's access token so the route can check their role.
import { supabase } from '@/lib/supabase';

export const REFUND_ERROR_MESSAGES = {
  forbidden: '권한이 없습니다.',
  not_refundable: '이미 환불되었거나 환불할 수 없는 결제입니다.',
  claim_failed: '환불 처리 중 오류가 발생했습니다.',
};

export async function requestRefund(kind, id) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch('/api/portone/refund', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({ kind, id }),
  });

  return res.json().catch(() => ({ ok: false, error: 'refund_failed' }));
}

export function refundErrorMessage(error) {
  return REFUND_ERROR_MESSAGES[error] || `환불에 실패했습니다. (${error || 'unknown'})`;
}
