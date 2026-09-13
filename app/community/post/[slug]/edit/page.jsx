'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { communityAuthHeaders } from '@/lib/communityClient';
import { CATEGORY_LIST } from '@/components/community/CategoryBadge';
import Link from 'next/link';

export default function EditCommunityPostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { slug } = useParams();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORY_LIST[0]);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    (async () => {
      const headers = await communityAuthHeaders();
      const res = await fetch(`/api/community/posts/${slug}`, { headers });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '게시글을 불러올 수 없습니다.'); setFetching(false); return; }
      if (!data.is_mine) { router.push(`/community/post/${slug}`); return; }
      setTitle(data.title);
      setCategory(data.category);
      setContent(data.content);
      setIsAnonymous(data.is_anonymous);
      setFetching(false);
    })();
  }, [slug, router]);

  if (loading || fetching) return <div className="text-center mt-20 text-gray-400">로딩 중...</div>;
  if (!user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim() || !content.trim()) { setError('제목과 내용을 입력해주세요.'); return; }

    setSubmitting(true);
    try {
      const headers = await communityAuthHeaders();
      const res = await fetch(`/api/community/posts/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ title: title.trim(), category, content: content.trim(), is_anonymous: isAnonymous }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '수정 실패');
      router.push(`/community/post/${json.slug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 mb-20">
      <Link href={`/community/post/${slug}`} className="text-sm text-blue-500 hover:underline mb-6 inline-block">
        ← 게시글로 돌아가기
      </Link>

      <h1 className="text-xl font-bold text-gray-900 mb-6">글 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={100}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={12}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
          익명으로 게시하기
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
        >
          {submitting ? '저장 중...' : '저장하기'}
        </button>
      </form>
    </main>
  );
}
