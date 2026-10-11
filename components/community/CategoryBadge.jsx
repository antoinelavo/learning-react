import { Badge } from '@/components/ui'
import { postCategories } from '@/lib/community'

export { CATEGORY_LIST } from '@/lib/community'

export default function CategoryBadge({ category }) {
  return <Badge color="gray">{category}</Badge>
}

// All of a post's boards, as badges.
export function CategoryBadges({ post }) {
  return postCategories(post).map(c => <CategoryBadge key={c} category={c} />)
}
