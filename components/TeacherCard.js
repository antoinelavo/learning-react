// components/TeacherCard.js
import Link from 'next/link'
import Image from 'next/image'


export default function TeacherCard({
  name,
  school,
  shortintroduction,
  profile_picture = "https://.../default.png",
}) {
  return (
    <Link
      href={`/profile/${encodeURIComponent(name)}`}
      className="flex items-start justify-between items-center hover:bg-gray-50 transition"
    >
      {/* ← Avatar + name/school */}
      <div className="flex items-center flex-1 justify-between px-[0.75em] py-[2em] md:p-[2em] gap-[1em] md:gap-[2em]">
        <div className="relative sm:w-14 sm:h-14 w-10 h-10 overflow-hidden rounded-full flex-0">
          <Image
            src={profile_picture}
            alt={`${name} 프로필 사진`}
            fill
            sizes="(max-width: 48px)"
            priority={false}
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {name}
          </h2>
          <p className="text-sm text-gray-500 line-clamp-1">
            {school}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 text-left line-clamp-2">
            {shortintroduction}
          </p>
        </div>
        
      </div>


    </Link>
  )
}
