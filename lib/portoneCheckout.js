// lib/portoneCheckout.js
// Client-side helper that opens the PortOne V2 payment window. Both
// outcomes end on the same server complete route, which verifies the
// payment with PortOne before activating anything:
// - PC popup: requestPayment resolves here, then we navigate to the route.
// - Mobile: PortOne redirects the browser to `redirectUrl` itself, with
//   ?paymentId=...&code=...&message=... appended.
import PortOne from '@portone/browser-sdk/v2';
import { supabase } from '@/lib/supabase';

export const KAKAOPAY_ENABLED = Boolean(process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY);

// prefix keeps the two purchase types apart in the PortOne console.
export function newPaymentId(prefix) {
  const random = [...crypto.getRandomValues(new Uint32Array(3))]
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
  return `${prefix}-${random}`;
}

// Digits only, 10–11 long (010xxxxxxxx). KG이니시스 requires a buyer phone.
export function normalizePhone(value) {
  const digits = (value || '').replace(/\D/g, '');
  return /^01\d{8,9}$/.test(digits) ? digits : null;
}

// KG이니시스 also requires a buyer email; teachers.email is optional, so
// fall back to the login email.
export async function buyerEmail(teacher) {
  if (teacher?.email) return teacher.email;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email;
}

// method: 'CARD' | 'KAKAOPAY'. Returns { error } for a failure the buyer
// should see, or nothing once the browser is on its way to completePath.
export async function startPortOnePayment({ method, paymentId, orderName, amount, customer, completePath }) {
  const isKakao = method === 'KAKAOPAY';
  const completeUrl = `${window.location.origin}${completePath}`;

  const response = await PortOne.requestPayment({
    storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
    channelKey: isKakao
      ? process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY
      : process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
    paymentId,
    orderName,
    totalAmount: amount,
    currency: 'KRW',
    payMethod: isKakao ? 'EASY_PAY' : 'CARD',
    customer,
    redirectUrl: completeUrl,
  });

  // Mobile redirect flow: the page is already navigating away.
  if (!response) return {};

  if (response.code !== undefined) {
    // TEMP DEBUG — the code/pgCode suffix is for testing; drop it once checkout works.
    const codes = [response.code, response.pgCode].filter(Boolean).join(', ');
    return { error: `${response.message || '알 수 없는 오류'} [debug] ${codes}` };
  }

  window.location.href = `${completeUrl}?paymentId=${encodeURIComponent(response.paymentId)}`;
  return {};
}
