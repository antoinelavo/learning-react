// components/TeacherCard.js
import Link from 'next/link'

// One row of a grouped teacher list. The parent supplies the border, corners
// and dividers; premium (badge) rows get a soft yellow background.
export default function TeacherCard({
  name,
  school,
  shortintroduction,
  profile_picture = "https://ibmaster.antoinelavo.com/teachers/default.jpg",
  badge = null,

}) {
  return (
    <Link
      href={`/profile/${encodeURIComponent(name)}`}
      className={`flex items-center gap-4 md:gap-8 px-4 py-4 sm:px-5 md:px-6 md:py-5 transition-colors ${
        badge ? 'bg-yellow-50 hover:bg-yellow-100' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        <img
          src={profile_picture}
          alt={`${name} 프로필 사진`}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-1 leading-snug m-0">
            {name}
          </h2>
          {badge && (
            <span className="shrink-0 inline-flex items-center rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-yellow-950">
              {badge === true ? '추천' : badge}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 font-medium line-clamp-1 leading-snug mt-0.5 mb-0">
          {school}
        </p>

        <p className="sm:hidden text-sm text-gray-500 line-clamp-2 leading-snug mt-1.5 mb-0">
          {shortintroduction}
        </p>
      </div>

      {/* Short introduction beside the name on wider screens */}
      <div className="hidden sm:block flex-1 min-w-0">
        <p className="text-sm text-gray-500 line-clamp-2 leading-snug m-0">
          {shortintroduction}
        </p>
      </div>
    </Link>
  )
}
