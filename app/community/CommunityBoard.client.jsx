'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES = ['전체', 'IB', 'SAT', '특례입학', '일반'];

const CATEGORY_COLORS = {
  IB:     'bg-blue-100 text-blue-700',
  SAT:    'bg-purple-100 text-purple-700',
  특례입학: 'bg-green-100 text-green-700',
  일반:   'bg-gray-100 text-gray-600',
};

function CategoryBadge({ category }) {
  return (
    <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${CATEGORY_COLORS[category] || CATEGORY_COLORS['일반']}`}>
      {category}
    </span>
  );
}

export default function CommunityBoard({ featured, regular }) {
  const [activeCategory, setActiveCategory] = useState('전체');
  const { user } = useAuth();

  const allPosts = [...featured, ...regular];

  const filtered = activeCategory === '전체'
    ? allPosts
    : allPosts.filter(p => p.category === activeCategory);

  return (
    <main className="max-w-3xl mx-auto px-3 py-4 mb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold text-gray-900">국제학교 입시 커뮤니티</h1>
        {user && (
          <Link
            href="/community/new"
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            글쓰기
          </Link>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-0.5 mb-2 border-b border-gray-200 overflow-x-auto">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap -mb-px ${
              activeCategory === cat
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Post list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">게시글이 없습니다.</p>
          {user && (
            <Link href="/community/new" className="text-blue-500 text-sm mt-2 inline-block hover:underline">
              첫 번째 글을 작성해보세요 →
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {filtered.map(post => (
            <li key={post.slug} className={post.featured ? 'bg-blue-50/60' : ''}>
              <Link
                href={post.url}
                className="flex items-start justify-between gap-3 px-2 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
                    {post.featured && <span className="mr-1">📌</span>}
                    {post.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CategoryBadge category={post.category} />
                    <time className="text-xs text-gray-400">{post.date}</time>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!user && (
        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/login" className="text-blue-500 hover:underline">로그인</Link>하면 글을 작성할 수 있습니다.
        </p>
      )}
    </main>
  );
}
