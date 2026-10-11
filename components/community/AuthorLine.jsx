import Link from 'next/link'
import { Badge } from '@/components/ui'
import VerifiedBadge from './VerifiedBadge'

const DEFAULT_TEACHER_PHOTO = 'https://ibmaster.antoinelavo.com/teachers/default.jpg'

// Role pill for named (non-anonymous) authors. Approved teachers get the
// blue verified badge instead.
const ROLE_LABELS = {
  student: '학생',
  teacher: '선생님',
  hagwon: '학원',
  admin: '운영자',
}

// Renders an author's name and a role pill (`role` is null for anonymous
// authors). Approved teachers also get their profile photo, the verified
// badge, and a link to /profile/[name].
export default function AuthorLine({
  name,
  isTeacher,
  role,
  profilePicture,
  profileLink,
  size = 'sm',
  className = '',
  linkable = true,
}) {
  const avatarPx = size === 'sm' ? 16 : 28
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm'

  const nameEl = isTeacher && profileLink && linkable ? (
    <Link href={profileLink} className={`font-medium text-gray-800 hover:underline ${textClass}`}>
      {name}
    </Link>
  ) : (
    <span className={`font-medium text-gray-700 ${textClass}`}>{name}</span>
  )

  return (
    <span className={`inline-flex items-center gap-1 min-w-0 ${className}`}>
      {isTeacher && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profilePicture || DEFAULT_TEACHER_PHOTO}
          alt=""
          width={avatarPx}
          height={avatarPx}
          className="rounded-full object-cover shrink-0"
        />
      )}
      {nameEl}
      {isTeacher ? (
        <VerifiedBadge />
      ) : ROLE_LABELS[role] ? (
        <Badge color="gray" className="px-1.5 shrink-0">{ROLE_LABELS[role]}</Badge>
      ) : null}
    </span>
  )
}
