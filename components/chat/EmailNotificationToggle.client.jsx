'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toggleEmailNotifications } from '@/lib/chat/chatClient';

// A single checkbox for opting in/out of "new chat message" emails.
export default function EmailNotificationToggle({ userId }) {
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('users')
      .select('chat_email_notifications')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setEnabled(data?.chat_email_notifications ?? true);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleChange = async (e) => {
    const next = e.target.checked;
    setEnabled(next); // optimistic
    try {
      await toggleEmailNotifications(userId, next);
    } catch (err) {
      console.error('알림 설정 변경 실패:', err);
      setEnabled(!next);
      alert('알림 설정을 변경하지 못했습니다.');
    }
  };

  if (!loaded) return null;

  return (
    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer w-fit">
      <input type="checkbox" checked={enabled} onChange={handleChange} className="w-4 h-4" />
      새 메시지 이메일 알림 받기
    </label>
  );
}
