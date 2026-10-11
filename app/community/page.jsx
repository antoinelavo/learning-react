import { Button, Notice } from '@/components/ui'
import PostListItem from '@/components/community/PostListItem'
import Pagination from '@/components/community/Pagination'
import { getCommunityFeed } from '@/lib/communityFeed'
import { CATEGORY_LIST, communityHref, sanitizeSearch } from '@/lib/community'
import CommunityControls from './CommunityControls.client'
import CommunityHeaderActions from './CommunityHeaderActions.client'
import CommunityWriteBar from './CommunityWriteBar.client'
import { FeedNavigationProvider, FeedResults, FeedLink } from './FeedNavigation.client'

const TITLE = '국제학교 입시 커뮤니티 | IB Master'
const DESCRIPTION = 'IB, SAT, 특례입학 관련 정보와 질문을 나누는 커뮤니티입니다.'

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/community' },
  openGraph: { url: '/community', title: TITLE, description: DESCRIPTION },
}

export const dynamic = 'force-dynamic'

export default async function CommunityPage({ searchParams }) {
  const params = await searchParams
  const tab = params?.tab === 'best' ? 'best' : 'all'
  const category = CATEGORY_LIST.includes(params?.category) ? params.category : null
  const q = sanitizeSearch(params?.q)

  let feed = null
  try {
    feed = await getCommunityFeed({ tab, category, q, page: params?.page })
  } catch (err) {
    console.error('community feed error:', err)
  }

  const isEmpty = feed && feed.pinned.length === 0 && feed.posts.length === 0

  return (
    <FeedNavigationProvider>
      <main className="max-w-3xl mx-auto px-4 pt-4 pb-32 min-h-screen">
        <div className="flex items-center justify-between gap-3 mb-3 min-h-[36px]">
          <h1 className="text-base sm:text-lg font-bold text-gray-900 m-0 leading-snug">IB·SAT 입시 커뮤니티</h1>
          <CommunityHeaderActions />
        </div>

        <CommunityControls tab={tab} category={category} q={q} page={feed?.page} />

        <FeedResults>
          {tab === 'best' && (
            <p className="text-xs text-gray-500 mb-3">최근 7일 동안 좋아요, 댓글, 조회가 많은 글입니다.</p>
          )}

          {!feed ? (
            <Notice color="red" compact>게시글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</Notice>
          ) : isEmpty ? (
            <p className="text-center text-sm text-gray-400 mt-10">
              {q ? '검색 결과가 없습니다.' : '게시글이 없습니다.'}
            </p>
          ) : (
            <ul className="space-y-2 list-none p-0 m-0">
              {feed.pinned.map(post => (
                <li key={post.id}><PostListItem post={post} /></li>
              ))}
              {feed.posts.map((post, i) => (
                <li key={post.id}><PostListItem post={post} rank={tab === 'best' ? i + 1 : null} /></li>
              ))}
            </ul>
          )}

          {feed && (
            <Pagination
              page={feed.page}
              totalPages={feed.totalPages}
              hrefFor={p => communityHref({ tab, category, q, page: p })}
              LinkComponent={FeedLink}
            />
          )}
        </FeedResults>

        <div className="flex justify-center mt-10">
          <Button href="/blog" variant="secondary" size="sm">블로그 보기</Button>
        </div>

        <CommunityWriteBar />
      </main>
    </FeedNavigationProvider>
  )
}
