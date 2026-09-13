export const CATEGORY_LIST = ['자유게시판', '질문답변', 'IB', 'SAT', '특례입학', '정보공유']

export const CATEGORY_COLORS = {
  자유게시판: 'bg-gray-100 text-gray-600',
  질문답변: 'bg-amber-100 text-amber-700',
  IB: 'bg-blue-100 text-blue-700',
  SAT: 'bg-purple-100 text-purple-700',
  특례입학: 'bg-green-100 text-green-700',
  정보공유: 'bg-teal-100 text-teal-700',
}

export default function CategoryBadge({ category }) {
  return (
    <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${CATEGORY_COLORS[category] || CATEGORY_COLORS['자유게시판']}`}>
      {category}
    </span>
  )
}
