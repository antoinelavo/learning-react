import Link from 'next/link'
import { buttonClasses } from '@/components/ui';

export default function BlogCTAButton({ label, href }) {
  return (
    <Link href={href} className={buttonClasses({ size: 'lg', className: '!text-white !no-underline' })}>
        {label}
    </Link>
  )
}
