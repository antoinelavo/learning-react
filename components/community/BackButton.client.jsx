'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { buttonClasses } from '@/components/ui';

export const FEED_URL_KEY = 'communityFeedUrl';

// Top-left "<" back button for community sub-pages. Returns to the last
// feed URL this tab visited (keeps board, tab, search and page), falling
// back to `href`.
export default function BackButton({ href = '/community', label = '목록으로' }) {
  const [target, setTarget] = useState(href);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(FEED_URL_KEY);
      if (saved?.startsWith('/community')) setTarget(saved);
    } catch {
      // storage unavailable: keep href
    }
  }, []);

  return (
    <Link
      href={target}
      aria-label={label}
      title={label}
      className={buttonClasses({ variant: 'ghost', size: 'sm', className: '-ml-2 mb-2 px-2' })}
    >
      <ChevronLeft size={22} aria-hidden="true" />
    </Link>
  );
}
