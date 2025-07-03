// app/api/payment/complete/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { imp_uid, merchant_uid, amount } = await request.json();

  try {
    // 1) 토큰 발급
    const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imp_key: process.env.IMP_REST_API_KEY,
        imp_secret: process.env.IMP_REST_API_SECRET,
      }),
    });
    const { response: tokenData } = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2) 결제 내역 단건 조회
    const paymentRes = await fetch(
      `https://api.iamport.kr/payments/${imp_uid}`,
      { headers: { Authorization: accessToken } }
    );
    const { response: paymentData } = await paymentRes.json();

    // 3) 금액 검증
    if (paymentData.amount !== amount) {
      return NextResponse.json({ success: false, message: '금액 불일치' }, { status: 400 });
    }

    // 4) 내부 로직 (DB 업데이트 등)
    // await updateOrderStatusInDB(merchant_uid, paymentData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
