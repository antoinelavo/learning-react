'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Notice } from '@/components/ui';
import { communityAuthHeaders } from '@/lib/communityClient';

// Shown in place of the post/comment composer for a logged-in user who has
// no username yet (most commonly an OAuth signup — Kakao/Google login never
// collects one, unlike the email/password signup form). Blocks posting
// until they pick one, checked for uniqueness against `users.username`.
export default function UsernamePrompt({ onDone }) {
  const { refreshProfile } = useAuth();
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const headers = await communityAuthHeaders();
      const res = await fetch('/api/community/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ username: value.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '닉네임 설정에 실패했습니다.');
      await refreshProfile();
      onDone?.(json.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Notice color="blue">
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-gray-700 font-medium m-0">
          커뮤니티에서 사용할 닉네임을 먼저 설정해주세요.
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="닉네임 (2~20자)"
            maxLength={20}
            aria-label="닉네임"
            className="flex-1 min-w-0 w-auto"
          />
          <Button type="submit" disabled={submitting || !value.trim()} className="shrink-0">
            {submitting ? '확인 중...' : '설정하기'}
          </Button>
        </div>
        {error && <p className="text-xs text-red-600 m-0">{error}</p>}
      </form>
    </Notice>
  );
}
