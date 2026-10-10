'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Notice, cardClasses } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { communityAuthHeaders, fetchCommunityBan } from '@/lib/communityClient';
import { banMessage } from '@/lib/community';
import PostForm from '@/components/community/PostForm.client';

export default function EditCommunityPostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { slug } = useParams();

  const [post, setPost] = useState(null);
  const [bannedUntil, setBannedUntil] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    (async () => {
      const headers = await communityAuthHeaders();
      const [res, ban] = await Promise.all([
        fetch(`/api/community/posts/${slug}`, { headers }),
        fetchCommunityBan(),
      ]);
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) { setError(data.error || '게시글을 불러올 수 없습니다.'); return; }
      if (!data.is_mine) { router.replace(`/community/post/${slug}`); return; }
      setBannedUntil(ban);
      setPost(data);
    })();
    return () => { cancelled = true; };
  }, [slug, user, loading, router]);

  async function handleSubmit(values) {
    const headers = await communityAuthHeaders();
    const res = await fetch(`/api/community/posts/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(values),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || '수정에 실패했습니다.');
    router.push(`/community/post/${json.slug}`);
    router.refresh();
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen mb-16">
      <Button href={`/community/post/${slug}`} variant="ghost" size="sm" className="mb-3">게시글로</Button>

      <div className={cardClasses({ padding: 'md' })}>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 mt-0 mb-6">글 수정</h1>
        {error ? (
          <Notice color="red" compact>{error}</Notice>
        ) : !post ? (
          <p className="text-center text-sm text-gray-400 my-6">불러오는 중…</p>
        ) : bannedUntil ? (
          <Notice color="red">{banMessage(bannedUntil)}</Notice>
        ) : (
          <PostForm initial={post} submitLabel="저장하기" submittingLabel="저장 중..." onSubmit={handleSubmit} />
        )}
      </div>
    </main>
  );
}
