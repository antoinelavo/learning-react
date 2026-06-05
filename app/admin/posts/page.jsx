'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPostsPage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && role !== 'admin') {
      alert('Access denied: Admins only.');
      router.push('/');
    }
  }, [loading, role, router]);

  useEffect(() => {
    if (role === 'admin') {
      fetch('/api/admin/posts')
        .then(r => r.json())
        .then(data => { setPosts(Array.isArray(data) ? data : []); setFetching(false); })
        .catch(() => setFetching(false));
    }
  }, [role]);

  async function togglePublished(post) {
    const res = await fetch(`/api/admin/posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !post.published }),
    });
    if (res.ok) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, published: !p.published } : p));
    }
  }

  async function deletePost(post) {
    if (!confirm(`"${post.title}" 을(를) 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/posts/${post.id}`, { method: 'DELETE' });
    if (res.ok) setPosts(prev => prev.filter(p => p.id !== post.id));
  }

  if (loading) return <div className="text-center mt-20">Loading...</div>;
  if (role !== 'admin') return null;

  return (
    <div className="max-w-4xl mx-auto pt-12 px-4 mb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">관리자 포스트 관리</h1>
          <Link href="/admin" className="text-sm text-blue-500 hover:underline">← 어드민 홈</Link>
        </div>
        <Link
          href="/admin/posts/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          새 글 쓰기
        </Link>
      </div>

      {fetching ? (
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">작성된 포스트가 없습니다.</p>
          <Link href="/admin/posts/new" className="text-blue-500 text-sm mt-2 inline-block hover:underline">
            첫 번째 포스트 작성하기 →
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[3fr_80px_80px_120px] gap-4 px-5 py-3 bg-gray-50 border-b text-xs font-medium text-gray-500">
            <span>제목</span>
            <span className="text-center">카테고리</span>
            <span className="text-center">상태</span>
            <span className="text-right">관리</span>
          </div>

          {posts.map((post, i) => (
            <div
              key={post.id}
              className={`grid grid-cols-[3fr_80px_80px_120px] gap-4 items-center px-5 py-3 ${
                i !== posts.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div>
                <span className="text-sm font-medium text-gray-900 line-clamp-1">{post.title}</span>
                {post.featured && (
                  <span className="text-xs text-blue-500 ml-1">📌 주요</span>
                )}
              </div>
              <span className="text-center text-xs text-gray-500">{post.category}</span>
              <div className="text-center">
                <button
                  onClick={() => togglePublished(post)}
                  className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                    post.published
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {post.published ? '게시됨' : '비공개'}
                </button>
              </div>
              <div className="flex gap-2 justify-end">
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="text-xs text-blue-500 hover:underline"
                >
                  수정
                </Link>
                <button
                  onClick={() => deletePost(post)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  삭제
                </button>
                {post.published && (
                  <Link
                    href={`/community/${post.slug}`}
                    target="_blank"
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    보기
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
