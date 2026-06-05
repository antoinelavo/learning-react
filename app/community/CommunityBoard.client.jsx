'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const SORT_OPTIONS = ['최신순', '인기글'];
const CATEGORY_LIST = ['IB', 'SAT', '특례입학', '일반'];

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
  const [sortMode, setSortMode] = useState('최신순');
  const [activeCategories, setActiveCategories] = useState(new Set());
  const { user } = useAuth();

  function toggleCategory(cat) {
    setActiveCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  const allPosts = sortMode === '인기글'
    ? featured
    : [...featured, ...regular].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = activeCategories.size === 0
    ? allPosts
    : allPosts.filter(p => activeCategories.has(p.category));

  return (
    <main className="max-w-3xl mx-auto px-3 py-4 mb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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

      {/* Controls row */}
      <div className="flex items-start gap-3 mb-4 flex-wrap">
        {/* Sort dropdown */}
        <select
          value={sortMode}
          onChange={e => setSortMode(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 shrink-0"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_LIST.map(cat => {
            const active = activeCategories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
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
        <ul className="divide-y divide-gray-200">
          {filtered.map(post => (
            <li key={post.slug}>
              <Link
                href={post.url}
                className="flex items-start justify-between gap-3 px-2 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
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
