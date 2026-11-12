// lib/upgradeEmail.js
// Browser helper for the admin pages: asks the server to send a teacher's
// upgrade email after the upgrade itself already succeeded. Never throws;
// resolves to true when the email went out.
import { authFetch } from '@/lib/authFetch';

export const UPGRADE_EMAIL_FAILED_MESSAGE = '업그레이드는 완료되었지만 이메일 발송에 실패했습니다.';

async function post(url, body) {
  try {
    const res = await authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      console.error('upgrade email failed:', url, res.status, data);
      return false;
    }
    return true;
  } catch (err) {
    console.error('upgrade email failed:', url, err);
    return false;
  }
}

export function sendPlusEmail(teacherId) {
  return post('/api/teachers/notify-plus', { teacherId });
}

export function sendPremiumEmail(paymentRequestId) {
  return post('/api/teachers/notify-premium', { paymentRequestId });
}
