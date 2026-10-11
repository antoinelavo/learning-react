import { Badge } from '@/components/ui'
import { postCategories } from '@/lib/community'

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

// All of a post's boards, as badges.
export function CategoryBadges({ post }) {
  return postCategories(post).map(c => <CategoryBadge key={c} category={c} />)
}
