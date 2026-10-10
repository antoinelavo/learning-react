import Link from 'next/link'
import VerifiedBadge from './VerifiedBadge.client'

const DEFAULT_TEACHER_PHOTO = 'https://ibmaster.antoinelavo.com/teachers/default.jpg'

// Renders an author's name, and — only when they're an approved teacher
// posting non-anonymously — their teacher-profile photo, a verified badge,
// and a link on the name to their public teacher profile at /profile/[name].
export default function AuthorLine({
  name,
  isTeacher,
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
      {isTeacher && <VerifiedBadge />}
    </span>
  )
}
