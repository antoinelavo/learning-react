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
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Parse the hash fragment to extract tokens and handle errors
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    // Check for errors in the URL (e.g., expired link)
    const error = params.get('error_description');
    if (error) {
      setErrorMsg(error);
      return;
    }

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (accessToken && refreshToken && type === 'recovery') {
      // Manually set the session using the tokens from the URL hash
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          setErrorMsg('세션 설정 실패: ' + error.message);
        } else {
          setReady(true);
        }
      });
    } else {
      setErrorMsg('유효한 비밀번호 재설정 링크가 아닙니다.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setMessage('비밀번호는 최소 8자 이상이어야 합니다.');
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

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-red-600">{errorMsg}</p>
        <a href="/forgot-password" className="text-blue-600 hover:underline text-sm">
          비밀번호 재설정 다시 요청하기
        </a>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <p>비밀번호 재설정 링크를 확인하는 중...</p>
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
