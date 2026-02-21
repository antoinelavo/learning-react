// app/login/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Listen for OAuth callbacks or session changes
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userId = session.user.id;
            
        await supabase
          .from('users')
          .upsert({ id: userId }, { onConflict: ['id'] });

          // fetch role/status
          const { data: userData, error } = await supabase
            .from('users')
            .select('role, status')
            .eq('id', userId)
            .maybeSingle();

          if (error) {
            alert('Error retrieving user data: ' + error.message);
            return;
          }
          if (userData?.status === 'deleted') {
            alert('삭제된 계정입니다. 이 계정으로 로그인하실 수 없습니다.');
            await supabase.auth.signOut();
            return;
          }

          const { role } = userData;

          if (role === 'teacher') {
            router.replace('/apply');
          } else {
            router.replace('/find');
          }
        }
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  // Email/password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert('Login failed: ' + error.message);
      return;
    }
    if (!data.user) {
      alert('No user session found.');
      return;
    }
    // onAuthStateChange will catch and redirect
  };

  // OAuth handlers
  const handleOAuth = async (provider) => {
    const redirectTo = process.env.NEXT_PUBLIC_APP_URL + '/auth/callback';
        
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      alert(`${provider} 로그인 오류: ` + error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6 min-h-screen">
      <h1 className="text-3xl font-semibold">로그인</h1>

      <div className="flex flex-col w-full max-w-sm gap-4 items-center">
        <button onClick={() => handleOAuth('kakao')}>
          <img src="/images/social/kakao.svg" alt="카카오 로그인" className="shadow-lg rounded-xl"/>
        </button>
        <button onClick={() => handleOAuth('google')}>
          <img src="/images/social/google.svg" alt="구글 로그인" className="shadow-lg rounded-xl"/>
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-sm gap-3"
      >
        <label className="text-sm font-medium">이메일</label>
        <input
          type="email"
          className="w-full p-2 border rounded"
          placeholder="이메일"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="text-sm font-medium">비밀번호</label>
        <input
          type="password"
          className="w-full p-2 border rounded"
          placeholder="비밀번호"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          로그인
        </button>
      </form>

      <p className="text-sm">
        <a href="/forgot-password" className="text-blue-600 hover:underline">
          비밀번호를 잊으셨나요?
        </a>
      </p>

      <p className="text-sm">
        계정이 없으신가요?{' '}
        <a href="/signup" className="text-blue-600 hover:underline">
          계정 만들기
        </a>
      </p>
    </div>
  );
}