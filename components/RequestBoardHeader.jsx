'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { buttonClasses } from '@/components/ui';

// Shared header for the request boards (/students, /hagwon-requests): a plain
// title and description, plus the "write request" button — inline on desktop,
// a sticky bottom bar on mobile. Teachers and hagwons only read these boards,
// so the button is hidden for them. `children` renders under the description.
export default function RequestBoardHeader({ title, description, writeHref, writeLabel, children }) {
  const { role, loading } = useAuth();
  const showWrite = !loading && role !== 'teacher' && role !== 'hagwon';

  return (
    <>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mt-0 mb-1 leading-tight">{title}</h1>
          <p className="text-sm text-gray-600 m-0">{description}</p>
          {children}
        </div>
        {showWrite && (
          <Link href={writeHref} className={buttonClasses({ size: 'sm', className: 'hidden sm:inline-flex shrink-0' })}>
            {writeLabel}
          </Link>
        )}
      </header>

      {showWrite && (
        // Both boards end in `mb-[50dvh]`, so the last card always scrolls
        // clear of this bar.
        <div className="fixed inset-x-0 bottom-0 z-40 sm:hidden border-t border-gray-200 bg-white/90 backdrop-blur px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Link href={writeHref} className={buttonClasses({ fullWidth: true })}>
            {writeLabel}
          </Link>
        </div>
      )}
    </>
  );
}
