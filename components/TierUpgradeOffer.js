'use client';
// components/TierUpgradeOffer.js
// The 플러스(Plus) tier upgrade checkout — ₩9,000, one-time, permanent (no
// expiration/renewal). Adapted from PremiumListingOffer.js's Toss
// integration (same Script tag, window.TossPayments(...).requestPayment
// pattern, order-logged-before-checkout flow) rather than built fresh,
// just without the subject/duration selection that feature needs.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const PLUS_TIER_AMOUNT = 9000;

// Generate a random order ID to hand to Toss's payment window.
function randomId() {
  return [...crypto.getRandomValues(new Uint32Array(2))]
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
}

export default function TierUpgradeOffer({ teacher, onUpgraded }) {
  const router = useRouter();
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Toss confirms payment via a server-side redirect back to this page
  // (?tab=pricing&tier=success|failed), not a JS callback — surface the
  // result here, same as PremiumListingOffer's ?payment=success|failed.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tier = params.get('tier');
    if (!tier) return;

    if (tier === 'success') {
      alert('결제가 완료되었습니다! 플러스 회원으로 전환되었습니다.');
      onUpgraded?.();
    } else if (tier === 'failed') {
      alert('결제에 실패했습니다. 다시 시도해주세요.');
    }

    // Strip tier/reason but keep ?tab=pricing so a refresh stays on this tab.
    const url = new URL(window.location.href);
    url.searchParams.delete('tier');
    url.searchParams.delete('reason');
    router.replace(url.pathname + url.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = async () => {
    if (!teacher?.id) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    if (paymentProcessing) return;

    if (typeof window === 'undefined' || typeof window.TossPayments === 'undefined') {
      alert('결제 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }

    setPaymentProcessing(true);

    try {
      const orderId = randomId();

      const { error: logError } = await supabase.from('payments').insert([
        {
          teacher_id: teacher.id,
          amount: PLUS_TIER_AMOUNT,
          currency: 'KRW',
          provider: 'toss',
          toss_order_id: orderId,
          status: 'pending',
        },
      ]);

      if (logError) {
        // Without this row the successUrl callback can't look up who paid —
        // don't send the buyer into Toss's payment window for nothing.
        // TEMP DEBUG — surfaces the real Supabase error so we can diagnose
        // the "결제 준비 중 오류" report. Remove once diagnosed.
        console.error('TierUpgradeOffer: payments insert failed', logError);
        alert(
          `결제 준비 중 오류가 발생했습니다.\n[debug]\ncode: ${logError?.code ?? 'none'}\nmessage: ${
            logError?.message ?? String(logError)
          }\ndetails: ${logError?.details ?? 'none'}\nhint: ${logError?.hint ?? 'none'}`
        );
        setPaymentProcessing(false);
        return;
      }

      // Hand off to Toss's payment window. There is no success callback
      // here — Toss redirects the browser straight to successUrl/failUrl,
      // which confirm/activate the tier server-side before landing back on
      // this tab. The promise below only rejects for failures that happen
      // before that handoff (e.g. the buyer closing the window).
      const tossPayments = window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
      tossPayments
        .requestPayment('CARD', {
          amount: PLUS_TIER_AMOUNT,
          orderId,
          orderName: 'IB Master 플러스 회원 전환',
          customerName: teacher.name,
          successUrl: `${window.location.origin}/api/toss/tier-success`,
          failUrl: `${window.location.origin}/api/toss/tier-fail`,
        })
        .catch((result) => {
          if (result?.code === 'USER_CANCEL') {
            setPaymentProcessing(false);
            return;
          }
          alert(`결제 실패: ${result?.message || '알 수 없는 오류'}`);
          setPaymentProcessing(false);
        });
    } catch (error) {
      // TEMP DEBUG — see the payments-insert branch above. Remove once diagnosed.
      console.error('TierUpgradeOffer: unhandled error', error);
      alert(`결제 처리 중 오류가 발생했습니다.\n[debug] ${error?.message ?? String(error)}`);
      setPaymentProcessing(false);
    }
  };

  if (teacher?.tier === 'premium') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow p-6 sm:p-8 text-center">
        <h2 className="text-lg font-bold mb-2">플러스 회원</h2>
        <p className="text-gray-600">
          이미 플러스 회원입니다. 학생 게시판의 연락처를 <span className="font-semibold text-blue-600">무제한</span>으로 열람할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow p-6 sm:p-8">
      <h2 className="text-lg font-bold mb-1">플러스로 업그레이드</h2>
      <p className="text-sm text-gray-500 mb-6">
        무료 회원은 학생 게시판에서 한 달에 연락처를 2번까지만 열람할 수 있습니다.
        플러스 회원은 <span className="font-semibold text-blue-600">무제한</span>으로 열람할 수 있습니다.
      </p>

      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-4xl font-bold text-gray-900">₩9,000</span>
        <span className="text-sm text-gray-500">1회 결제 · 평생 유지</span>
      </div>

      <ul className="text-sm text-gray-700 space-y-2 mb-6">
        <li>✓ 학생 연락처 무제한 열람</li>
        <li>✓ 한 번 결제로 계속 유지 (갱신 없음)</li>
      </ul>

      <button
        onClick={handleUpgrade}
        disabled={paymentProcessing}
        className={`w-full px-6 py-3 rounded-xl font-semibold transition ${
          paymentProcessing
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {paymentProcessing
          ? '결제 진행 중...'
          : '결제하기 (카드 - 현재 테스트 중입니다. 실결제로 이어지지 않습니다)'}
      </button>
    </div>
  );
}
