'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const list = searchParams.get('list');

  const [status, setStatus] = useState('loading'); // loading, done, invalid, error

  useEffect(() => {
    async function run() {
      if (!token || (list !== 'student' && list !== 'hagwon')) {
        setStatus('invalid');
        return;
      }

      const { data, error } = await supabase.rpc('unsubscribe_by_token', {
        p_token: token,
        p_list: list,
      });

      if (error) {
        console.error('Unsubscribe error:', error);
        setStatus('error');
        return;
      }

      setStatus(data ? 'done' : 'invalid');
    }

    run();
  }, [token, list]);

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="max-w-sm w-full text-center">
        {status === 'loading' && (
          <p className="text-gray-600">처리 중...</p>
        )}

        {status === 'done' && (
          <h1 className="text-xl font-semibold text-gray-900 mb-2">구독이 취소되었습니다</h1>
        )}

        {status === 'invalid' && (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">이미 구독 취소되었거나 유효하지 않은 링크입니다</h1>
            <p className="text-sm text-gray-600">추가로 조치하실 사항은 없습니다.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h1>
            <p className="text-sm text-gray-600">잠시 후 다시 시도해주세요.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeContent />
    </Suspense>
  );
}
