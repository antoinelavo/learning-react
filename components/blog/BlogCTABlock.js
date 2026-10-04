import Link from 'next/link'
import { buttonClasses } from '@/components/ui';

export default function BlogCTABlock({ description, label, href }) {
  return (
    <div className="not-prose my-12 mx-auto max-w-lg rounded-2xl bg-blue-50 border border-blue-100 px-8 py-8 text-center shadow-sm">
      <p className="text-gray-800 text-base leading-relaxed mb-5">
        {description}
      </p>
      <Link
        href={href}
        className={buttonClasses({ size: 'lg', className: '!text-white !no-underline' })}
      >
        {label}
      </Link>
    </div>
  )
}
