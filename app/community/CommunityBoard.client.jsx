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
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${CATEGORY_COLORS[category] || CATEGORY_COLORS['일반']}`}>
      {category}
    </span>
  );
}

function FeaturedCard({ post }) {
  return (
    <Link
      href={post.url}
      className="flex flex-col justify-between bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all"
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">📌 주요 정보</span>
          <CategoryBadge category={post.category} />
        </div>
        <h2 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-blue-600">
          {post.title}
        </h2>
        {post.description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{post.description}</p>
        )}
      </div>
      <time className="text-xs text-gray-400 mt-3 block">{post.date}</time>
    </Link>
  );
}

export default function CommunityBoard({ featured, regular }) {
  const [activeCategory, setActiveCategory] = useState('전체');
  const { user } = useAuth();

  const filteredFeatured = activeCategory === '전체'
    ? featured
    : featured.filter(p => p.category === activeCategory);

  const filteredRegular = activeCategory === '전체'
    ? regular
    : regular.filter(p => p.category === activeCategory);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 mb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">국제학교 입시 커뮤니티</h1>
          <p className="text-sm text-gray-500 mt-1">IB, SAT, 특례입학 관련 정보와 질문을 나눠보세요</p>
        </div>
        {user && (
          <Link
            href="/community/new"
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            글쓰기
          </Link>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-8 border-b border-gray-200">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg -mb-px ${
              activeCategory === cat
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured cards */}
      {filteredFeatured.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">주요 정보</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeatured.map(post => (
              <FeaturedCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Post table */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          전체 게시글 {filteredRegular.length > 0 && `(${filteredRegular.length})`}
        </h2>

        {filteredRegular.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">게시글이 없습니다.</p>
            {user && (
              <Link href="/community/new" className="text-blue-500 text-sm mt-2 inline-block hover:underline">
                첫 번째 글을 작성해보세요 →
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[3fr_1fr_100px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
              <span>제목</span>
              <span className="text-center">카테고리</span>
              <span className="text-right">날짜</span>
            </div>

            {/* Table rows */}
            {filteredRegular.map((post, i) => (
              <Link
                key={post.slug}
                href={post.url}
                className={`grid grid-cols-1 sm:grid-cols-[3fr_1fr_100px] gap-1 sm:gap-4 items-center px-5 py-4 hover:bg-blue-50 transition-colors ${
                  i !== filteredRegular.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <span className="text-sm text-gray-900 font-medium line-clamp-1 hover:text-blue-600">
                  {post.title}
                </span>
                <span className="sm:text-center">
                  <CategoryBadge category={post.category} />
                </span>
                <time className="text-xs text-gray-400 sm:text-right">{post.date}</time>
              </Link>
            ))}
          </div>
        )}
      </section>

      {!user && (
        <p className="text-center text-sm text-gray-400 mt-8">
          <Link href="/login" className="text-blue-500 hover:underline">로그인</Link>하면 글을 작성할 수 있습니다.
        </p>
      )}
    </main>
  );
}
