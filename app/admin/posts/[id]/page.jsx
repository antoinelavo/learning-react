'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['IB', 'SAT', '특례입학', '일반'];

export default function AdminEditPostPage({ params }) {
  const { role, loading } = useAuth();
  const router = useRouter();

  const [post, setPost] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && role !== 'admin') {
      alert('Access denied.');
      router.push('/');
      return;
    }
    if (role === 'admin') {
      supabase
        .from('posts')
        .select('*')
        .eq('id', params.id)
        .single()
        .then(({ data }) => {
          setPost(data);
          setFetching(false);
        });
    }
  }, [loading, role, params.id, router]);

  if (loading || fetching) return <div className="text-center mt-20">Loading...</div>;
  if (!post) return <div className="text-center mt-20 text-gray-400">포스트를 찾을 수 없습니다.</div>;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!post.title?.trim() || !post.content?.trim()) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '저장 실패');
      router.push('/admin/posts');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y';

  return (
    <div className="max-w-2xl mx-auto pt-12 px-4 mb-20">
      <Link href="/admin/posts" className="text-sm text-blue-500 hover:underline mb-6 inline-block">
        ← 포스트 목록
      </Link>
      <h1 className="text-xl font-bold mb-6">포스트 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
          <select value={post.category} onChange={e => setPost(p => ({ ...p, category: e.target.value }))} className={inputCls}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
          <input type="text" value={post.title} onChange={e => setPost(p => ({ ...p, title: e.target.value }))}
            maxLength={100} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
          <input type="date" value={post.date || ''} onChange={e => setPost(p => ({ ...p, date: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">설명 (SEO)</label>
          <textarea value={post.description || ''} onChange={e => setPost(p => ({ ...p, description: e.target.value }))}
            rows={2} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용 (마크다운)</label>
          <textarea value={post.content} onChange={e => setPost(p => ({ ...p, content: e.target.value }))}
            rows={18} className={`${inputCls} font-mono`} />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={post.featured || false}
              onChange={e => setPost(p => ({ ...p, featured: e.target.checked }))} className="rounded" />
            📌 주요 정보로 고정
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={post.published || false}
              onChange={e => setPost(p => ({ ...p, published: e.target.checked }))} className="rounded" />
            게시됨
          </label>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          {submitting ? '저장 중...' : '저장하기'}
        </button>
      </form>
    </div>
  );
}
