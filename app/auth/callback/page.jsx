'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth
      .getSessionFromUrl({ storeSession: true })
      .then(() => {
        router.replace('/find');
      })
      .catch((err) => {
        alert('OAuth 처리 중 오류가 발생했습니다: ' + err.message);
        router.replace('/login');
      });
  }, [router]);
  return <p className="p-6">로그인 처리 중...</p>;
}