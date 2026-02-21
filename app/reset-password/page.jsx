// app/reset-password/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Supabase automatically picks up the recovery token from the URL hash
    // and fires a PASSWORD_RECOVERY event when the session is established.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setReady(true);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setMessage('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage('비밀번호 변경 실패: ' + error.message);
      setLoading(false);
      return;
    }

    setMessage('비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.');
    setTimeout(() => router.replace('/login'), 2000);
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <p>비밀번호 재설정 링크를 확인하는 중...</p>
        <p className="text-sm text-gray-500">
          이 페이지는 이메일의 비밀번호 재설정 링크를 통해 접근해야 합니다.
        </p>
        <a href="/login" className="text-blue-600 hover:underline text-sm">
          로그인 페이지로 돌아가기
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <h1 className="text-3xl font-semibold">비밀번호 재설정</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-sm gap-3"
      >
        <label className="text-sm font-medium">새 비밀번호</label>
        <input
          type="password"
          className="w-full p-2 border rounded"
          placeholder="새 비밀번호"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="text-sm font-medium">비밀번호 확인</label>
        <input
          type="password"
          className="w-full p-2 border rounded"
          placeholder="비밀번호 확인"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>

        {message && (
          <p className="text-sm text-center mt-2">{message}</p>
        )}
      </form>
    </div>
  );
}
