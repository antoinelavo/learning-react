'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    (async () => {

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession(); 

      if (error) {
        alert('OAuth 처리 중 오류가 발생했습니다: ' + error.message);
        router.replace('/login');
        return;
      }

      if (!session) {
        alert('로그인 세션을 찾을 수 없습니다.');
        router.replace('/login');
        return;
      }

      // 1) 세션에서 user 추출  
    const user = session.user;

    // 2) DB에서 role 조회  
    const { data: { role }, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    if (roleError) {
      console.error('롤 조회 실패:', roleError);
      router.replace('/find');
      return;
    }

    // 3) role에 따라 분기  
    if (role === 'teacher') {
      router.replace('/dashboard');
    } else {
      router.replace('/find');
    }

    
    })();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>로그인 처리 중...</p>
    </div>
  );
}