'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Notice, Tabs, cardClasses } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { communityAuthHeaders, fetchCommunityBan } from '@/lib/communityClient';
import { banMessage } from '@/lib/community';
import { timeAgo } from '@/lib/timeAgo';
import CategoryBadge from '@/components/community/CategoryBadge';
import Pagination from '@/components/community/Pagination';

const TABS = [
  { value: 'posts', label: '내가 쓴 글' },
  { value: 'comments', label: '내 댓글' },
  { value: 'scraps', label: '스크랩' },
];

const EMPTY_TEXT = {
  posts: '작성한 글이 없습니다.',
  comments: '작성한 댓글이 없습니다.',
  scraps: '스크랩한 글이 없습니다.',
};

function deletedLabel(item) {
  return item.deleted_by_admin ? '관리자 삭제' : '삭제됨';
}

function ItemRow({ tab, item }) {
  if (tab === 'comments') {
    const deleted = !!item.deleted_at;
    return (
      <Link href={`/community/post/${item.post?.slug}`} className={cardClasses({ className: 'block p-4 hover:border-blue-300 transition-colors' })}>
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {deleted && <Badge color="gray">{deletedLabel(item)}</Badge>}
          {item.is_anonymous && <Badge color="gray">익명</Badge>}
        </div>
        <p className={`text-sm m-0 line-clamp-2 break-words ${deleted ? 'text-gray-400' : 'text-gray-900'}`}>{item.content}</p>
        <p className="text-xs text-gray-400 mt-1.5 mb-0 truncate">
          {item.post?.title} · {timeAgo(item.created_at)}
        </p>
      </Link>
    );
  }

  const post = tab === 'scraps' ? item.post : item;
  const deleted = !!post.deleted_at;
  return (
    <Link href={`/community/post/${post.slug}`} className={cardClasses({ className: 'block p-4 hover:border-blue-300 transition-colors' })}>
      <div className="flex flex-wrap items-center gap-1.5 mb-1">
        {deleted && <Badge color="gray">{deletedLabel(post)}</Badge>}
        <CategoryBadge category={post.category} />
        {post.is_anonymous && <Badge color="gray">익명</Badge>}
      </div>
      <p className={`text-sm font-semibold m-0 line-clamp-2 ${deleted ? 'text-gray-400' : 'text-gray-900'}`}>{post.title}</p>
      <p className="text-xs text-gray-400 mt-1.5 mb-0">
        {timeAgo(post.created_at)} · 좋아요 {post.like_count} · 댓글 {post.comment_count} · 조회 {post.view_count}
      </p>
    </Link>
  );
}

export default function MyCommunityActivityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('posts');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [bannedUntil, setBannedUntil] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchCommunityBan().then(setBannedUntil);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setData(null);
    setError('');
    (async () => {
      const headers = await communityAuthHeaders();
      const res = await fetch(`/api/community/me?tab=${tab}&page=${page}`, { headers });
      const json = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) setError(json.error || '불러오지 못했습니다.');
      else setData(json);
    })();
    return () => { cancelled = true; };
  }, [user, tab, page]);

  if (loading || !user) {
    return <p className="text-center text-sm text-gray-400 mt-20">불러오는 중…</p>;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen mb-16">
      <Button href="/community" variant="ghost" size="sm" className="mb-3">목록으로</Button>

      <h1 className="text-lg sm:text-xl font-bold text-gray-900 mt-0 mb-4">내 활동</h1>

      {bannedUntil && <Notice color="red" compact className="mb-4">{banMessage(bannedUntil)}</Notice>}

      <Tabs
        tabs={TABS}
        value={tab}
        onChange={value => { setTab(value); setPage(1); }}
        className="mb-4"
      />

      {error ? (
        <Notice color="red" compact>{error}</Notice>
      ) : !data ? (
        <p className="text-center text-sm text-gray-400 mt-10">불러오는 중…</p>
      ) : data.items.length === 0 ? (
        <p className="text-center text-sm text-gray-400 mt-10">{EMPTY_TEXT[tab]}</p>
      ) : (
        <ul className="space-y-2 list-none p-0 m-0">
          {data.items.map(item => (
            <li key={item.id || item.post?.id}><ItemRow tab={tab} item={item} /></li>
          ))}
        </ul>
      )}

      {data && (
        <Pagination page={data.page} totalPages={data.totalPages} onChange={p => { setPage(p); window.scrollTo(0, 0); }} />
      )}
    </main>
  );
}
