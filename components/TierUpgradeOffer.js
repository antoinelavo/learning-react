'use client';
// components/TierUpgradeOffer.js
// The 플러스(Plus) tier upgrade checkout — ₩9,000, one-time. Framed to the
// buyer as a 12-month term that renews for free afterward (Toss's payment
// review policy disallows selling an indefinite/"lifetime" service), but
// nothing in teachers.tier actually expires — a free renewal forever has
// the same real-world effect as never expiring, so there's no separate
// expiry/renewal mechanism to build. Adapted from PremiumListingOffer.js's
// Toss integration (same Script tag, window.TossPayments(...).requestPayment
// pattern, order-logged-before-checkout flow) rather than built fresh,
// just without the subject/duration selection that feature needs.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { revealsRemaining } from '@/lib/reveal';
import ScrollFadeIn from '@/components/ScrollFadeIn';

const PLUS_TIER_AMOUNT = 9000;
const FREE_TIER_LIMIT = 2;
const PLUS_TERM_MONTHS = 12;
const RENEWAL_NOTE = `${PLUS_TERM_MONTHS}개월 이용 후에는 무료로 자동 연장됩니다.`;

// Tap-to-open info bubble — click toggles it, clicking away (blur) closes
// it, so it works without hover on mobile.
function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-gray-600"
        aria-label="자세히 보기"
      >
        <Info className="w-4 h-4" />
      </button>
      {open && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 rounded-lg bg-gray-900 text-white text-xs text-center shadow-lg z-10">
          {text}
        </span>
      )}
    </span>
  );
}

// Generate a random order ID to hand to Toss's payment window.
function randomId() {
  return [...crypto.getRandomValues(new Uint32Array(2))]
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
}

// Fades a feature-list item up into place a beat after the card mounts,
// with a per-item delay for a staggered effect — same transition-based
// technique as components/ScrollFadeIn.jsx, just mount-triggered instead
// of scroll-triggered (this card is already in view when its tab opens).
function FadeInItem({ delay = 0, children }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <li
      className={`transition-all duration-500 ease-out transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {children}
    </li>
  );
}

// Progress bar for "이번 달 사용한 무료 열람 N/2" — tied to real account
// state (not decorative), so free-tier teachers see how close they are to
// needing 플러스. Animates its fill from 0 on mount.
function UsageBar({ used, limit }) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const targetPct = Math.min(100, (used / limit) * 100);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(targetPct), 50);
    return () => clearTimeout(timer);
  }, [targetPct]);

  return (
    <div className="mb-6">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>이번 달 사용한 무료 열람</span>
        <span>
          {used}/{limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-700 ease-out"
          style={{ width: `${animatedPct}%` }}
        />
      </div>
    </div>
  );
}

export default function TierUpgradeOffer({ teacher, onUpgraded }) {
  const router = useRouter();
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [bankTransferRequested, setBankTransferRequested] = useState(false);

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
      // TEMP DEBUG — surfaces which step the server-side route failed at.
      // Remove once diagnosed.
      const reason = params.get('reason') || 'unknown';
      alert(`결제에 실패했습니다. 다시 시도해주세요.\n[debug] reason: ${reason}`);
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

  // Same manual, admin-confirmed flow as PremiumListingOffer's bank
  // transfer option — logs a pending payment row and reveals the account
  // number; an admin flips the teacher's tier by hand once the transfer
  // clears (via /admin/tiers), same as that feature's payment_request flow.
  const handleBankTransfer = async () => {
    if (!teacher?.id) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    if (bankTransferRequested) return;

    setShowAccountNumber(true);
    setBankTransferRequested(true);

    const { error } = await supabase.from('payments').insert([
      {
        teacher_id: teacher.id,
        amount: PLUS_TIER_AMOUNT,
        currency: 'KRW',
        provider: 'bank_transfer',
        status: 'pending',
      },
    ]);

    if (error) {
      alert('요청 기록 중 오류가 발생했습니다.');
    }
  };

  if (teacher?.tier === 'premium') {
    return (
      <ScrollFadeIn className="bg-white border border-gray-200 rounded-2xl shadow p-6 sm:p-8 text-center">
        <h2 className="text-lg font-bold mb-2">플러스 회원</h2>
        <p className="text-gray-600">
          이미 플러스 회원입니다. 학생 게시판의 연락처를 <span className="font-semibold text-blue-600">무제한</span>으로 열람할 수 있습니다.
        </p>
        <p className="text-xs text-gray-400 mt-2">{RENEWAL_NOTE}</p>
      </ScrollFadeIn>
    );
  }

  const used = FREE_TIER_LIMIT - (revealsRemaining(teacher) ?? FREE_TIER_LIMIT);

  return (
    <ScrollFadeIn className="bg-white border border-gray-200 rounded-2xl shadow p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-1">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm">
          <Plus className="w-4 h-4 text-white" strokeWidth={3} />
        </span>
        <h2 className="text-lg font-bold">플러스로 업그레이드</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        무료 회원은 학생 게시판에서 한 달에 연락처를 {FREE_TIER_LIMIT}번까지만 열람할 수 있습니다.
        플러스 회원은 <span className="font-semibold text-blue-600">무제한</span>으로 열람할 수 있습니다.
      </p>

      <UsageBar used={used} limit={FREE_TIER_LIMIT} />

      {/* Free vs 플러스 comparison — same light/dark tier-card language as
          PremiumListingOffer's pricing grid. Most rows are identical on
          both sides on purpose: matching, chat, and contact-sharing are
          always free here, so only the reveal cap actually differs. */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl bg-gray-50 p-4 sm:p-5">
          <p className="text-xs font-semibold text-gray-500 mb-3">무료 회원</p>
          <ul className="text-xs text-gray-600 space-y-3">
            <FadeInItem delay={80}>✓ 수수료 없음</FadeInItem>
            <FadeInItem delay={140}>✓ 채팅으로 학생과 자유롭게 연락</FadeInItem>
            <FadeInItem delay={200}>✓ 연락처 정보 공유 무료</FadeInItem>
            <FadeInItem delay={260}>
              <span className="text-gray-400">✕ 연락처 열람 월 {FREE_TIER_LIMIT}회</span>
            </FadeInItem>
          </ul>
        </div>
        <div className="rounded-xl bg-gray-900 text-white p-4 sm:p-5">
          <p className="text-xs font-semibold text-blue-300 mb-3">플러스 회원</p>
          <ul className="text-xs text-gray-300 space-y-3">
            <FadeInItem delay={80}>✓ 수수료 없음</FadeInItem>
            <FadeInItem delay={140}>✓ 채팅으로 학생과 자유롭게 연락</FadeInItem>
            <FadeInItem delay={200}>✓ 연락처 정보 공유 무료</FadeInItem>
            <FadeInItem delay={260}>
              <span className="inline-flex items-center gap-1 text-blue-400 font-semibold">
                ✓ 연락처 열람 무제한
                <InfoTooltip text={RENEWAL_NOTE} />
              </span>
            </FadeInItem>
          </ul>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-4xl font-bold text-gray-900">₩9,000</span>
        <span className="inline-flex items-center gap-1 text-sm text-gray-500">
          1회 결제 · {PLUS_TERM_MONTHS}개월 이용
          <InfoTooltip text={RENEWAL_NOTE} />
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleUpgrade}
          disabled={paymentProcessing}
          className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
            paymentProcessing
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {paymentProcessing
            ? '결제 진행 중...'
            : '결제하기 (카드 - 현재 테스트 중입니다. 실결제로 이어지지 않습니다)'}
        </button>

        <button
          onClick={handleBankTransfer}
          disabled={bankTransferRequested}
          className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
            bankTransferRequested
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {showAccountNumber ? '입금 후 1일 내 플러스 회원으로 전환됩니다.' : '결제하기 (계좌이체)'}
        </button>
      </div>

      {showAccountNumber && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-center">
          <div className="text-sm text-gray-600 mb-1">입금 계좌</div>
          <div className="text-lg font-mono font-semibold text-gray-900">
            {process.env.NEXT_PUBLIC_BANK_ACCOUNT || '계좌 정보를 불러올 수 없습니다'}
          </div>
          <div className="text-sm text-gray-500 mt-1">예금주: {process.env.NEXT_PUBLIC_BANK_HOLDER || ''}</div>
          <div className="text-sm text-gray-500 mt-1">입금 금액: ₩{PLUS_TIER_AMOUNT.toLocaleString()}</div>
        </div>
      )}
    </ScrollFadeIn>
  );
}
