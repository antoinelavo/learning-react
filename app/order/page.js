'use client';

import { useEffect } from 'react';

export default function PaymentPage() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.IMP) {
      // 테스트 가맹점 식별코드로 SDK 초기화
      window.IMP.init(process.env.NEXT_PUBLIC_IMP_MERCHANT_ID);
    }
  }, []);

  const handlePayment = () => {
    const { IMP } = window;
    if (!IMP) {
      alert('결제 모듈이 로드되지 않았습니다.');
      return;
    }

    IMP.request_pay(
      {
        pg: 'html5_inicis',           // → 테스트 모드용 PG사 코드
        pay_method: 'card',
        merchant_uid: `payment-${crypto.randomUUID()}`,
        name: '테스트 상품',
        amount: 1000,
        buyer_email: 'test@test.com',
        buyer_name: '테스트 사용자',
        buyer_tel: '010-0000-0000',
      },
      async (response) => {
        // 실패 코드가 있을 경우 재진행 가능
        if (response.error_code) {
          alert(`결제 실패: ${response.error_msg}\n카드 정보를 다시 확인 후 재시도 해주세요.`);
          return;
        }

        // 서버 검증 요청
        try {
          const res = await fetch('/api/payment/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imp_uid: response.imp_uid, merchant_uid: response.merchant_uid }),
          });
          const data = await res.json();
          if (data.success) {
            alert('결제 완료되었습니다.');
          } else {
            alert(`결제 검증 실패: ${data.message}`);
          }
        } catch (e) {
          console.error(e);
          alert('결제 검증 중 오류가 발생했습니다.');
        }
      }
    );
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-6">테스트 결제 페이지</h1>
      <button
        onClick={handlePayment}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700"
      >
        결제하기
      </button>
      <p className="mt-4 text-sm text-gray-500">
        ※ 테스트 모드에서 지원되는 카드 번호로만 결제 가능합니다.
      </p>
    </div>
  );
}