'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input, Tabs, chipClasses } from '@/components/ui';
import { CATEGORY_LIST, communityHref } from '@/lib/community';

const TABS = [
  { value: 'all', label: '전체글' },
  { value: 'best', label: '인기글' },
];

// Tabs, search box and board chips for /community. All state lives in the
// URL so the server page renders the matching feed.
export default function CommunityControls({ tab, category, q }) {
  const router = useRouter();
  const [search, setSearch] = useState(q || '');

  function handleSearch(e) {
    e.preventDefault();
    router.push(communityHref({ tab, category, q: search.trim() }));
  }

  return (
    <div className="space-y-3 mb-4">
      <Tabs
        tabs={TABS}
        value={tab}
        onChange={value => router.push(communityHref({ tab: value, category, q }))}
      />

      <form onSubmit={handleSearch} role="search" className="relative">
        <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" strokeWidth={2} />
          <path strokeLinecap="round" strokeWidth={2} d="M20 20l-3.5-3.5" />
        </svg>
        <Input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="제목, 내용으로 검색"
          aria-label="게시글 검색"
          enterKeyHint="search"
          maxLength={50}
          className="pl-11"
        />
      </form>

      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[null, ...CATEGORY_LIST].map(cat => (
          <Link
            key={cat || 'all'}
            href={communityHref({ tab, category: cat, q })}
            className={chipClasses({ selected: (category || null) === cat, compact: true, className: 'shrink-0' })}
            aria-current={(category || null) === cat ? 'page' : undefined}
          >
            {cat || '전체'}
          </Link>
        ))}
      </div>
    </div>
  );
}
