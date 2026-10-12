'use client';

import { createContext, useContext, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FeedSkeleton from './FeedSkeleton';

// Feed state changes (board, tab, search, page) only change the query
// string, which doesn't trigger loading.jsx. This tracks the navigation as a
// transition so the list can show a skeleton at once and the controls can
// show the target selection while the server renders.
const FeedNavigationContext = createContext({ isPending: false, pending: null, navigate: () => {} });

export function FeedNavigationProvider({ children }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pending, setPending] = useState(null);

  function navigate(href, target = null) {
    setPending(target);
    startTransition(() => router.push(href));
  }

  return (
    <FeedNavigationContext.Provider value={{ isPending, pending: isPending ? pending : null, navigate }}>
      {children}
    </FeedNavigationContext.Provider>
  );
}

export function useFeedNavigation() {
  return useContext(FeedNavigationContext);
}

// A Link that navigates through the feed transition (keeps a real href for
// crawlers, middle-click and new tabs).
export function FeedLink({ href, pendingTarget, onClick, ...props }) {
  const { navigate } = useFeedNavigation();
  return (
    <Link
      href={href}
      onClick={e => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href, pendingTarget);
      }}
      {...props}
    />
  );
}

// Swaps the server-rendered results for a skeleton while a feed navigation
// is in flight.
export function FeedResults({ children }) {
  const { isPending } = useFeedNavigation();
  return isPending ? <FeedSkeleton /> : children;
}
