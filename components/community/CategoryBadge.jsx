import { Badge } from '@/components/ui'

export { CATEGORY_LIST } from '@/lib/community'

const CATEGORY_COLORS = {
  자유게시판: 'gray',
  질문답변: 'yellow',
  IB: 'blue',
  SAT: 'purple',
  특례입학: 'green',
  정보공유: 'orange',
}

export default function CategoryBadge({ category }) {
  return <Badge color={CATEGORY_COLORS[category] || 'gray'}>{category}</Badge>
}
