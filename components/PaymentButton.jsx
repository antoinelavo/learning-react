// app/components/PaymentButton.jsx
'use client';

import { useEffect } from 'react';

export default function PaymentButton({ order, serverBaseUrl }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.IMP) {
      // 한 번만 초기화
      window.IMP.init('imp00000000'); // 콘솔에서 발급받은 가맹점 식별코드
    }
  }, []);

  const handlePayment = () => {
    const { IMP } = window;
    if (!IMP) return alert('결제 모듈이 로드되지 않았습니다.');

    IMP.request_pay(
      {
        channelKey: order.channelKey,
        pay_method: 'card',
        merchant_uid: `payment-${crypto.randomUUID()}`,
        name: order.name,
        amount: order.amount,
        buyer_email: order.buyer_email,
        buyer_name: order.buyer_name,
        buyer_tel: order.buyer_tel,
        // 모바일 리다이렉트가 필요할 경우:
        // m_redirect_url: `${window.location.origin}/payment-redirect`
      },
      async (response) => {
        if (response.error_code) {
          return alert(`결제 실패: ${response.error_msg}`);
        }
        // 인증 성공 후, 서버로 결과 전송
        const res = await fetch(`${serverBaseUrl}/api/payment/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imp_uid: response.imp_uid,
            merchant_uid: response.merchant_uid,
            amount: order.amount,
          }),
        });
        const data = await res.json();
        if (data.success) {
          alert('결제 완료되었습니다.');
          // 리다이렉트 등 후속 처리
        } else {
          alert('결제 검증에 실패했습니다.');
        }
      }
    );
  };

  return (
    <button onClick={handlePayment}>
      결제하기 ({order.amount.toLocaleString()}원)
    </button>
  );
}
