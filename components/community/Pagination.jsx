import { buttonClasses } from '@/components/ui';
import Link from 'next/link';

// Numbered pages. Pass `hrefFor(page)` for link navigation (server pages)
// or `onChange(page)` for client state.
export default function Pagination({ page, totalPages, hrefFor, onChange }) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = [];
  for (let p = start; p <= Math.min(totalPages, start + 4); p++) pages.push(p);

  function item(p, label, key, disabled = false) {
    const current = label === String(page);
    const className = buttonClasses({
      variant: current ? 'primary' : 'secondary',
      size: 'sm',
      className: 'min-w-[36px] px-2',
    });
    if (disabled) {
      return <span key={key} className={`${className} opacity-50`} aria-disabled="true">{label}</span>;
    }
    if (hrefFor) {
      return <Link key={key} href={hrefFor(p)} className={className} aria-current={current ? 'page' : undefined}>{label}</Link>;
    }
    return <button key={key} type="button" onClick={() => onChange(p)} className={className}>{label}</button>;
  }

  return (
    <nav className="flex flex-wrap justify-center gap-1.5 mt-6" aria-label="페이지">
      {item(page - 1, '이전', 'prev', page <= 1)}
      {pages.map(p => item(p, String(p), p))}
      {item(page + 1, '다음', 'next', page >= totalPages)}
    </nav>
  );
}
