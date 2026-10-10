import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function BackLink({ href, label }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 bg-white border border-gray-200 rounded-full px-3.5 py-1.5 shadow-sm hover:shadow transition-all mb-4"
    >
      <ArrowLeft size={14} />
      {label}
    </Link>
  )
}
