import Link from "next/link";
import Image from "next/image";

export default function TeacherCard({ teacher }) {
  const {
    id,
    name,
    school,
    profile_picture,
    shortintroduction,
    isMockPremium,
    variant,
  } = teacher;

  const imageUrl = profile_picture || "https://scdoramzssnimcbsojml.supabase.co/storage/v1/object/public/profile-pictures/teachers/default.jpg";
  const profileUrl = `/profile/${encodeURIComponent(name)}`;

  const badge =
    isMockPremium && (variant === "B" || variant === "C") ? (
      <span className="ml-2 px-2 py-1 text-xs bg-blue-200 text-blue-700 rounded">추천</span>
    ) : null;

  return (
    <Link
      href={profileUrl}
      className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition"
    >
      <Image
        src={imageUrl || '/default.png'}
        alt={`${name} 프로필 사진`}
        width={60}
        height={60}
        className="rounded-full object-cover"
      />
      <div className="flex flex-col">
        <div className="text-sm font-semibold text-black flex items-center">
          {name}
          {badge && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 truncate max-w-[200px]">{school}</div>
        <div className="text-sm text-gray-600 mt-1">{shortintroduction}</div>
      </div>
    </Link>
  );
}
