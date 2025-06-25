import Link from 'next/link'

export default function BlogCTAButton({ label, href }) {
  return (
    <Link href={href} className="inline-block px-5 py-3 bg-blue-500 text-white rounded-xl shadow-lg hover:scale-110 transition
    duration-200
    ease-out 
    font-bold
    ">
        {label}
    </Link>
  )
}
