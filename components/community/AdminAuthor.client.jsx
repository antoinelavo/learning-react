'use client';

import { useState, useEffect } from 'react';
import { Button, Select } from '@/components/ui';
import { communityAuthHeaders } from '@/lib/communityClient';
import { formatKstDate } from '@/lib/community';

const OPTIONS = [
  { value: '7', label: '7일 차단' },
  { value: '30', label: '30일 차단' },
  { value: 'permanent', label: '영구 차단' },
  { value: 'none', label: '차단 해제' },
];

function activeBan(until) {
  return until && new Date(until) > new Date() ? until : null;
}

// Admin-only: the real author of a post or comment (even when anonymous)
// and a control to ban them from the community.
export default function AdminAuthor({ author }) {
  const [duration, setDuration] = useState('7');
  const [bannedUntil, setBannedUntil] = useState(activeBan(author?.banned_until));

  // The author often arrives after mount (fetched by the parent).
  useEffect(() => {
    setBannedUntil(activeBan(author?.banned_until));
  }, [author?.id, author?.banned_until]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!author) return null;

  async function applyBan() {
    setSaving(true);
    setError('');
    try {
      const headers = await communityAuthHeaders();
      const res = await fetch('/api/admin/community/bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ userId: author.id, duration }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '처리에 실패했습니다.');
      setBannedUntil(activeBan(json.banned_until));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
      <span className="min-w-0 break-all">
        작성자: {author.username || '닉네임 없음'} ({author.email})
        {bannedUntil && <span className="text-red-600"> · {formatKstDate(bannedUntil)}까지 차단</span>}
      </span>
      <div className="flex items-center gap-1.5">
        <Select
          value={duration}
          onChange={e => setDuration(e.target.value)}
          aria-label="차단 기간"
          className="w-auto py-1.5 px-2 text-sm"
        >
          {OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Button variant="danger" size="sm" onClick={applyBan} disabled={saving}>
          {saving ? '처리 중...' : '적용'}
        </Button>
      </div>
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
