'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Notice, cardClasses } from '@/components/ui';
import { CategoryBadges } from '@/components/community/CategoryBadge';
import BackButton from '@/components/community/BackButton.client';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/authFetch';
import { formatKstDate } from '@/lib/community';

// Admin drafts (community_posts.is_draft), hidden from the public board
// until published from the preview page.
export default function AdminCommunityDraftsPage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const [drafts, setDrafts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && role !== 'admin') {
      alert('Access denied: Admins only.');
      router.push('/');
    }
  }, [loading, role, router]);

  useEffect(() => {
    if (role !== 'admin') return;
    (async () => {
      try {
        const res = await authFetch('/api/admin/community/drafts');
        const data = await res.json().catch(() => ({}));
        if (res.ok) setDrafts(Array.isArray(data.drafts) ? data.drafts : []);
        else setError(data.error || '불러오지 못했습니다.');
      } catch {
        setError('불러오지 못했습니다.');
      }
    })();
  }, [role]);

  if (loading) return <p className="text-center text-sm text-gray-400 mt-20">불러오는 중…</p>;
  if (role !== 'admin') return null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen">
      <BackButton href="/admin" />
      <h1 className="text-lg font-bold text-gray-900 mt-2 mb-4">커뮤니티 초안</h1>

      {error && <Notice color="red" className="mb-4">{error}</Notice>}

      {drafts === null ? (
        !error && <p className="text-center text-sm text-gray-400 mt-10">불러오는 중…</p>
      ) : drafts.length === 0 ? (
        <p className="text-center text-sm text-gray-400 mt-10">초안이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {drafts.map(d => (
            <li key={d.slug}>
              <Link
                href={`/admin/community/drafts/${encodeURIComponent(d.slug)}`}
                className={`${cardClasses({ padding: 'md' })} block no-underline hover:bg-gray-50`}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge color="purple">미리보기</Badge>
                  {d.is_pinned && <Badge color="red">공지</Badge>}
                  <CategoryBadges post={d} />
                </div>
                <p className="text-base font-semibold text-gray-900 mt-2 mb-0 break-words">{d.title}</p>
                <p className="text-xs text-gray-400 mt-1 mb-0">수정 {formatKstDate(d.updated_at)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
