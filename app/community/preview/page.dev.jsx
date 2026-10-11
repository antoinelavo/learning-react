import Link from 'next/link'
import { Badge, Notice, cardClasses } from '@/components/ui'
import { CategoryBadges } from '@/components/community/CategoryBadge'
import { listSeedFiles, loadSeedPost } from '@/lib/communitySeed'

// Dev-only (page.dev.jsx, see next.config.js) list of the admin seed posts in content/community-seed/.
export const dynamic = 'force-dynamic'
export const metadata = { title: '시드 게시글 미리보기', robots: { index: false } }

export default function CommunitySeedPreviewListPage() {
  const seeds = listSeedFiles().map(({ n, file }) => ({ n, file, ...loadSeedPost(n) }))

  return (
    <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen">
      <Notice color="yellow" className="mb-4">미리보기: 아직 게시되지 않은 글입니다.</Notice>

      <ul className="flex flex-col gap-3 list-none p-0 m-0">
        {seeds.map(({ n, file, post, error }) => (
          <li key={n}>
            {post ? (
              <Link href={`/community/preview/${n}`} className={`${cardClasses({ padding: 'md' })} block no-underline hover:bg-gray-50`}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-400 mr-1">#{n}</span>
                  {post.pinned && <Badge color="red">공지</Badge>}
                  <CategoryBadges post={post} />
                </div>
                <p className="text-base font-semibold text-gray-900 mt-2 mb-0 break-words">{post.title}</p>
              </Link>
            ) : (
              <div className={cardClasses({ padding: 'md' })}>
                <span className="text-xs font-semibold text-gray-400 mr-1">#{n}</span>
                <span className="text-sm text-red-600 break-words">{error || file}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
