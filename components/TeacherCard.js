// components/TeacherCard.js
import Link from 'next/link'
import Image from 'next/image'


export default function TeacherCard({
  name,
  school,
  shortintroduction,
  profile_picture = "https://.../default.png",
  badge = null,

}) {
  return (
    <Link
      href={`/profile/${encodeURIComponent(name)}`}
      className={`flex items-start justify-between items-center transition ${
        badge
          ? 'bg-yellow-50 border border-2 border-yellow-400 rounded-2xl shadow-[0_0_12px_1px_rgba(250,204,21,0.4)] rounded-xl shadow-sm hover:bg-yellow-100'
          : 'hover:bg-gray-50'
      }`}
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
          <div className="flex flex-row gap-[1em]">
            <h2 className="text-lg font-bold text-gray-900 line-clamp-1 leading-1 m-0">
              {name}
            </h2>

              {badge && (
                <span className="inline-flex items-center justify-center bg-yellow-400 text-black text-xs font-medium px-2 py-1 rounded leading-none hidden sm:flex">
                  추천
                </span>
              )}
          </div>

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
