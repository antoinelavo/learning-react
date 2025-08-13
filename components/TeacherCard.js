// components/TeacherCard.js
import Link from 'next/link'

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
          ? 'bg-yellow-50 shadow-[0_0_12px_1px_rgba(250,204,21,0.4)] shadow-sm hover:bg-yellow-100'
          : 'hover:bg-gray-50'
      }`}
    >

      {/* ← Avatar + name/school */}
      <div className="flex items-center flex-1 justify-between p-[1em] sm:px-[1em] sm:py-[1.25em] md:px-[1.5em] md:py-[1.5em] gap-[1em] md:gap-[2em] m-0">
        <div className="relative w-20 h-20  overflow-hidden rounded-lg flex-0 border border-gray-300">
          <img
            src={profile_picture}
            alt={`${name} 프로필 사진`}
            className="object-cover"
            sizes="(max-width: 767px) 40px, (min-width: 768px) 56px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-row gap-[1em]">
            <h2 className="text-base sm:text-lg font-bold text-black line-clamp-1 leading-1 m-0">
              {name}
            </h2>

              {badge && (
                <span className="inline-flex items-center justify-center bg-yellow-400 text-bold flex text-xs font-medium px-2 py-1 rounded leading-none ">
                  추천
                </span>
              )}
          </div>

          <p className="text-xs sm:text-sm text-gray-500 font-semibold sm:font-normal line-clamp-1 leading-1 my-1">
            {school}
          </p>

          <p className=" sm:hidden text-xs sm:text-sm text-gray-500 text-left line-clamp-2 leading-1 mt-2 mb-0">
            {shortintroduction}
          </p>
        </div>

        {/* Short Introduction */}
        <div className="hidden sm:block flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 text-left line-clamp-2 leading-1 m-0">
            {shortintroduction}
          </p>
        </div>
        
      </div>
      


    </Link>
  )
}
