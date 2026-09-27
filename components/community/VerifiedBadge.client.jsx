'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

// Small "선생님" pill next to a teacher's name on posts/comments. Works on
// both hover (desktop) and tap (mobile, since native `title` tooltips don't
// fire on touch) by toggling an explicit popover on click.
export default function VerifiedBadge() {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={e => { e.preventDefault(); e.stopPropagation(); setShow(s => !s); }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors shrink-0"
      >
        <ShieldCheck size={10} strokeWidth={2.5} />
        선생님
      </button>
      {show && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 whitespace-nowrap bg-gray-900 text-white text-[11px] px-2 py-1 rounded shadow-lg z-20">
          IB Master 인증 선생님
        </span>
      )}
    </span>
  );
}
