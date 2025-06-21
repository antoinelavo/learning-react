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
      <div className="flex items-center flex-1 justify-between px-[1em] py-[1.25em] md:p-[2em] gap-[1em] md:gap-[2em]">
        <div className="relative w-10 h-10 overflow-hidden rounded-xl flex-0">
          <Image
            src={profile_picture}
            alt={`${name} 프로필 사진`}
            fill
            priority={true}
            className="object-cover"
            sizes="(max-width: 767px) 40px, (min-width: 768px) 56px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 line-clamp-1 leading-1 m-0">
            {name}
          </h2>
          <p className="text-sm text-gray-500 line-clamp-1 leading-1 m-0">
            {school}
          </p>
        </div>

        {/* Short Introduction */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 text-left line-clamp-2 h-full m-0">
            {shortintroduction}
          </p>
        </div>
        
      </div>


    </Link>
  )
}
