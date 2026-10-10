'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Notice, cardClasses } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { communityAuthHeaders, fetchCommunityBan } from '@/lib/communityClient';
import { banMessage } from '@/lib/community';
import UsernamePrompt from '@/components/community/UsernamePrompt.client';
import PostForm from '@/components/community/PostForm.client';

export default function NewCommunityPostPage() {
  const { user, username, loading } = useAuth();
  const router = useRouter();
  const [bannedUntil, setBannedUntil] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchCommunityBan().then(setBannedUntil);
  }, [user]);

  async function handleSubmit(values) {
    const headers = await communityAuthHeaders();
    const res = await fetch('/api/community/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(values),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || '게시에 실패했습니다.');
    router.push(`/community/post/${json.slug}`);
  }

  if (loading || !user) {
    return <p className="text-center text-sm text-gray-400 mt-20">불러오는 중…</p>;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen mb-16">
      <Button href="/community" variant="ghost" size="sm" className="mb-3">목록으로</Button>

      <div className={cardClasses({ padding: 'md' })}>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 mt-0 mb-6">글쓰기</h1>
        {bannedUntil ? (
          <Notice color="red">{banMessage(bannedUntil)}</Notice>
        ) : !username ? (
          <UsernamePrompt />
        ) : (
          <PostForm submitLabel="게시하기" submittingLabel="게시 중..." onSubmit={handleSubmit} />
        )}
      </div>
    </main>
  );
}
