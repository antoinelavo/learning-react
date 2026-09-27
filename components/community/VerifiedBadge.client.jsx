'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

// Small badge next to a teacher's name on posts/comments. Works on both
// hover (desktop) and tap (mobile, since native `title` tooltips don't
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
        className="text-blue-500 hover:text-blue-600 shrink-0"
        aria-label="인증된 선생님"
      >
        <ShieldCheck size={13} fill="currentColor" className="text-white" strokeWidth={2} style={{ color: '#3D9BE9' }} />
      </button>
      {show && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 whitespace-nowrap bg-gray-900 text-white text-[11px] px-2 py-1 rounded shadow-lg z-20">
          IB Master 인증 선생님
        </span>
      )}
    </span>
  );
}
