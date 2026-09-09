'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ThumbsUp, MessageCircle, Eye, PenSquare, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { timeAgo } from '@/lib/timeAgo';
import CategoryBadge, { CATEGORY_LIST } from '@/components/community/CategoryBadge';

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기글' },
];

function stripMarkdown(text) {
  return text.replace(/[#*_`>\[\]]/g, '').slice(0, 100);
}

function AnnouncementsRail({ announcements }) {
  if (!announcements?.length) return null;
  return (
    <div className="mb-5">
      <h2 className="text-xs font-semibold text-gray-400 mb-2">공지사항 · 정보 아티클</h2>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3">
        {announcements.map(a => (
          <Link
            key={a.slug}
            href={a.url}
            className="shrink-0 w-52 bg-blue-50 hover:bg-blue-100 transition-colors rounded-xl p-3"
          >
            <CategoryBadge category={a.category} />
            <p className="text-sm font-medium text-gray-900 mt-1.5 line-clamp-2 leading-snug">{a.title}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PostCard({ post }) {
  return (
    <Link
      href={`/community/post/${post.slug}`}
      className="flex items-start justify-between gap-3 px-2 py-4 hover:bg-gray-50 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <CategoryBadge category={post.category} />
          {post.is_hot && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-white">HOT</span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{post.title}</p>
        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{stripMarkdown(post.content || '')}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          <span>{post.author_display_name || '익명'}</span>
          <span>·</span>
          <time>{timeAgo(post.created_at)}</time>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-1"><ThumbsUp size={12} /> {post.like_count}</span>
          <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.comment_count}</span>
          <span className="flex items-center gap-1"><Eye size={12} /> {post.view_count}</span>
        </div>
      </div>
      {post.image_urls?.[0] && (
        <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image_urls[0]} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </Link>
  );
}

export default function CommunityBoard({ announcements }) {
  const { user } = useAuth();
  const [category, setCategory] = useState('전체');
  const [sortMode, setSortMode] = useState('latest');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async (pageToFetch, append) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== '전체') params.set('category', category);
    if (query) params.set('q', query);
    params.set('sort', sortMode);
    params.set('page', String(pageToFetch));

    try {
      const res = await fetch(`/api/community/posts?${params.toString()}`);
      const json = await res.json();
      setPosts(prev => append ? [...prev, ...(json.posts || [])] : (json.posts || []));
      setHasMore(!!json.hasMore);
      setPage(pageToFetch);
    } catch {
      // keep whatever was already rendered
    } finally {
      setLoading(false);
    }
  }, [category, query, sortMode]);

  useEffect(() => {
    fetchPosts(1, false);
  }, [category, sortMode, query, fetchPosts]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setQuery(searchInput.trim());
  }

  return (
    <main className="max-w-3xl mx-auto px-3 py-4 mb-24 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">국제학교 입시 커뮤니티</h1>
      </div>

      <AnnouncementsRail announcements={announcements} />

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="제목/내용 검색"
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          type="submit"
          className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 shrink-0"
        >
          검색
        </button>
      </form>

      {/* Controls row */}
      <div className="flex items-start gap-3 mb-4 flex-wrap">
        <select
          value={sortMode}
          onChange={e => setSortMode(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 shrink-0"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="flex gap-2 flex-wrap">
          {['전체', ...CATEGORY_LIST].map(cat => {
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
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
      {posts.length === 0 && !loading ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">게시글이 없습니다.</p>
          {user && (
            <Link href="/community/post/new" className="text-blue-500 text-sm mt-2 inline-block hover:underline">
              첫 번째 글을 작성해보세요 →
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {posts.map(post => <li key={post.slug}><PostCard post={post} /></li>)}
        </ul>
      )}

      {hasMore && (
        <div className="text-center mt-4">
          <button
            onClick={() => fetchPosts(page + 1, true)}
            disabled={loading}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            {loading ? '불러오는 중...' : '더보기'}
          </button>
        </div>
      )}

      {!user && (
        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/login" className="text-blue-500 hover:underline">로그인</Link>하면 글을 작성할 수 있습니다.
        </p>
      )}

      {/* Floating write button */}
      <Link
        href={user ? '/community/post/new' : '/login'}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-colors"
        aria-label="글쓰기"
      >
        <PenSquare size={22} />
      </Link>
    </main>
  );
}
