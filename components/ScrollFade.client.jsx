'use client';

import { useEffect, useRef, useState } from 'react';

// Scroll container that fades its right and bottom edges while more content
// is off-screen in that direction, to hint that it scrolls.
export default function ScrollFade({ className = '', fadeColor = 'from-white', children }) {
  const ref = useRef(null);
  const [fade, setFade] = useState({ right: false, bottom: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setFade({
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    });
    update();
    el.addEventListener('scroll', update, { passive: true });
    // Content starts hidden (collapsed card / closed <details>), so re-check when its size changes.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <div ref={ref} className={className}>{children}</div>
      {fade.right && (
        <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 rounded-r-lg bg-gradient-to-l ${fadeColor} to-transparent`} aria-hidden="true" />
      )}
      {fade.bottom && (
        <div className={`pointer-events-none absolute left-0 right-0 bottom-0 h-10 rounded-b-lg bg-gradient-to-t ${fadeColor} to-transparent`} aria-hidden="true" />
      )}
    </div>
  );
}
