'use client';
// components/PortOnePayButtons.jsx
// Buyer phone field plus the card (and, once its channel key is set,
// 카카오페이) buttons shared by PremiumListingOffer and TierUpgradeOffer.
// KG이니시스 requires a buyer phone number and teachers have none on file,
// so it's asked for here.
import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { KAKAOPAY_ENABLED, normalizePhone } from '@/lib/portoneCheckout';

export default function PortOnePayButtons({ processing, disabled, onPay, className = '' }) {
  const [phone, setPhone] = useState('');

  const pay = (method) => {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      alert('휴대폰 번호를 정확히 입력해주세요. (예: 01012345678)');
      return;
    }
    onPay(method, normalized);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Input
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="휴대폰 번호 (결제 확인용)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={processing}
      />
      <Button onClick={() => pay('CARD')} disabled={processing || disabled} size="lg" fullWidth>
        {processing ? '결제 진행 중...' : '결제하기 (카드)'}
      </Button>
      {KAKAOPAY_ENABLED && (
        <Button onClick={() => pay('KAKAOPAY')} disabled={processing || disabled} size="lg" fullWidth>
          카카오페이로 결제하기
        </Button>
      )}
    </div>
  );
}
