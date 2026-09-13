// components/ResourceCard.js
import Link from 'next/link';

const TYPE_LABEL = { subject: '기출/내신', ee: 'EE', tok: 'TOK' };

export default function ResourceCard({ resource }) {
  const teacherName = resource.teachers?.name || '선생님';
  return (
    <Link
      href={`/marketplace/${resource.id}`}
      className="block bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded bg-blue-50 text-blue-600">
          {TYPE_LABEL[resource.resource_type] || resource.resource_type}
        </span>
        <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600">
          {resource.session_month} {resource.session_year}
        </span>
        <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded bg-yellow-50 text-yellow-700">
          점수 {resource.score}
        </span>
      </div>
      <h3 className="text-base font-bold text-black line-clamp-2 mb-1">{resource.title}</h3>
      <p className="text-sm text-gray-500 mb-3">{resource.subject}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{teacherName}</span>
        <span className="text-lg font-semibold text-blue-600">
          ₩{resource.price_krw.toLocaleString()}
        </span>
      </div>
    </Link>
  );
}
