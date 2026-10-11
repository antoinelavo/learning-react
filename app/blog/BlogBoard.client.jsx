'use client';

// Blog index list (/blog). Split out of the old community board, which
// /blog used to share before the community was rebuilt.

import { useState } from 'react';
import Link from 'next/link';
import { Select, chipClasses } from '@/components/ui';

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

export default function BlogBoard({ featured, regular }) {
  const [sortMode, setSortMode] = useState('최신순');
  const [activeCategories, setActiveCategories] = useState(new Set());

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
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">IB·SAT 입시 블로그</h1>
      </div>

      {/* Controls row */}
      <div className="flex items-start gap-3 mb-4 flex-wrap">
        {/* Sort dropdown */}
        <Select
          value={sortMode}
          onChange={e => setSortMode(e.target.value)}
          className="shrink-0 w-auto"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </Select>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_LIST.map(cat => {
            const active = activeCategories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={chipClasses({ selected: active })}
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
    </main>
  );
}
