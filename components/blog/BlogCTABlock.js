import Link from 'next/link'

export default function BlogCTABlock({ description, label, href }) {
  return (
    <div className="not-prose my-12 mx-auto max-w-lg rounded-2xl bg-blue-50 border border-blue-100 px-8 py-8 text-center shadow-sm">
      <p className="text-gray-800 text-base leading-relaxed mb-5">
        {description}
      </p>
      <Link
        href={href}
        className="inline-block px-8 py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg hover:bg-blue-600 hover:scale-105 transition duration-200 ease-out"
      >
        {label}
      </Link>
    </div>
  )
}
