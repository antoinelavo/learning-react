// app/forgot-password/page.jsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/reset-password',
    });

    if (error) {
      setMessage('오류가 발생했습니다: ' + error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <h1 className="text-3xl font-semibold">이메일을 확인해주세요</h1>
        <p className="text-sm text-gray-600 text-center max-w-sm">
          비밀번호 재설정 링크를 <strong>{email}</strong>로 보냈습니다.
          이메일을 확인하고 링크를 클릭해주세요.
        </p>
        <a href="/login" className="text-blue-600 hover:underline text-sm">
          로그인 페이지로 돌아가기
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <h1 className="text-3xl font-semibold">비밀번호 찾기</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-sm gap-3"
      >
        <label className="text-sm font-medium">이메일</label>
        <input
          type="email"
          className="w-full p-2 border rounded"
          placeholder="가입한 이메일 주소"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '전송 중...' : '재설정 링크 보내기'}
        </button>

        {message && (
          <p className="text-sm text-center mt-2 text-red-600">{message}</p>
        )}
      </form>

      <a href="/login" className="text-blue-600 hover:underline text-sm">
        로그인 페이지로 돌아가기
      </a>
    </div>
  );
}
