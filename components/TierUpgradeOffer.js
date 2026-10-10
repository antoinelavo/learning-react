'use client';
// components/TierUpgradeOffer.js
// The 플러스(Plus) tier upgrade checkout — ₩9,000, one-time. Framed to the
// buyer as a 12-month term that renews for free afterward (PG review
// policy disallows selling an indefinite/"lifetime" service), but nothing
// in teachers.tier actually expires — a free renewal forever has the same
// real-world effect as never expiring, so there's no separate
// expiry/renewal mechanism to build. Same PortOne checkout as
// PremiumListingOffer.js (order logged before checkout, server-verified
// on return), just without the subject/duration selection.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { revealsRemaining } from '@/lib/reveal';
import { PLUS_TIER_AMOUNT } from '@/lib/tierActivation';
import { buyerEmail, newPaymentId, startPortOnePayment } from '@/lib/portoneCheckout';
import ScrollFadeIn from '@/components/ScrollFadeIn';
import PortOnePayButtons from '@/components/PortOnePayButtons';
import { Button, cardClasses } from '@/components/ui';

const FREE_TIER_LIMIT = 2;
const PLUS_TERM_MONTHS = 12;
const RENEWAL_NOTE = `${PLUS_TERM_MONTHS}개월 동안 이용할 수 있으며, 이후에는 무료로 연장할 수 있습니다.`;

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

  // PortOne payments are verified by a server route that redirects back here
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
      // TEMP DEBUG — shows why the payment failed. Remove once checkout works.
      const reason = params.get('reason') || 'unknown';
      const detail = params.get('detail');
      alert(`결제에 실패했습니다. 다시 시도해주세요.\n[debug] ${reason}${detail ? `\n${detail}` : ''}`);
    }

    // Strip tier/reason but keep ?tab=pricing so a refresh stays on this tab.
    const url = new URL(window.location.href);
    url.searchParams.delete('tier');
    url.searchParams.delete('reason');
    url.searchParams.delete('detail');
    router.replace(url.pathname + url.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = async (method, phone) => {
    if (!teacher?.id) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    if (paymentProcessing) return;
    setPaymentProcessing(true);

    try {
      const paymentId = newPaymentId('plus');

      const { error: logError } = await supabase.from('payments').insert([
        {
          teacher_id: teacher.id,
          amount: PLUS_TIER_AMOUNT,
          currency: 'KRW',
          provider: 'portone',
          portone_payment_id: paymentId,
          status: 'pending',
        },
      ]);

      if (logError) {
        // Without this row the complete route can't look up who paid —
        // don't send the buyer into the payment window for nothing.
        console.error('TierUpgradeOffer: payments insert failed', logError);
        alert('결제 준비 중 오류가 발생했습니다. 다시 시도해주세요.');
        setPaymentProcessing(false);
        return;
      }

      const { error } = await startPortOnePayment({
        method,
        paymentId,
        orderName: 'IB Master 플러스 회원 전환',
        amount: PLUS_TIER_AMOUNT,
        customer: { fullName: teacher.name, email: await buyerEmail(teacher), phoneNumber: phone },
        completePath: '/api/portone/tier-complete',
      });

      if (error) {
        alert(`결제 실패: ${error}`);
        setPaymentProcessing(false);
      }
    } catch (error) {
      console.error('TierUpgradeOffer: unhandled error', error);
      alert('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
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

    // One pending request per teacher — a reload + second click just
    // re-shows the account info instead of logging a duplicate row for
    // /admin/plus-payments.
    const { data: existing, error: lookupError } = await supabase
      .from('payments')
      .select('id')
      .eq('teacher_id', teacher.id)
      .eq('provider', 'bank_transfer')
      .eq('status', 'pending')
      .limit(1);

    if (lookupError) {
      alert('요청 기록 중 오류가 발생했습니다.');
      return;
    }

    if (existing && existing.length > 0) return;

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
      <ScrollFadeIn className={cardClasses({ className: 'p-6 sm:p-8 text-center' })}>
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
    <ScrollFadeIn className={cardClasses({ className: 'p-6 sm:p-8' })}>
      <div className="relative mb-2">
        <span className="absolute -top-1 left-0 text-5xl sm:text-6xl font-black italic tracking-tight text-blue-600/[0.08] select-none pointer-events-none leading-none whitespace-nowrap">
          PLUS
        </span>
        <h2 className="relative z-10 text-lg font-bold pt-4 sm:pt-5">플러스로 업그레이드</h2>
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
              <span className="text-blue-400 font-semibold">✓ 연락처 열람 무제한</span>
            </FadeInItem>
          </ul>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-4xl font-bold text-gray-900">₩9,000</span>
        <span className="inline-flex items-center gap-1 text-sm text-gray-500">
          1회 결제
          <InfoTooltip text={RENEWAL_NOTE} />
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-2">
        <PortOnePayButtons processing={paymentProcessing} onPay={handleUpgrade} className="flex-1" />

        <Button
          onClick={handleBankTransfer}
          disabled={bankTransferRequested}
          size="lg" className="flex-1"
        >
          {showAccountNumber ? '입금 후 1일 내 플러스 회원으로 전환됩니다.' : '결제하기 (계좌이체)'}
        </Button>
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
