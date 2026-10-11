import { notFound } from 'next/navigation'
import { Badge, Notice, cardClasses } from '@/components/ui'
import { CategoryBadges } from '@/components/community/CategoryBadge'
import AuthorLine from '@/components/community/AuthorLine'
import BackButton from '@/components/community/BackButton.client'
import { POST_BODY_CLASSES } from '@/components/community/postBodyClasses'
import { communityMarkdownToHtml } from '@/lib/communityMarkdown'
import { formatKstDate } from '@/lib/community'
import { loadSeedPost } from '@/lib/communitySeed'

// Dev-only (page.dev.jsx, see next.config.js) preview of one admin seed post, laid out like
// app/community/post/[slug]/page.jsx. Reads from disk only.
export const dynamic = 'force-dynamic'

// 404 for a bad number or for a seed file that fails validation.
async function getPreviewPost(params) {
  const n = (await params).n
  if (!/^[1-9]\d*$/.test(n)) notFound()
  const { post, error } = loadSeedPost(Number(n))
  if (!post) {
    console.error('community seed preview:', error)
    notFound()
  }
  return post
}

export async function generateMetadata({ params }) {
  const post = await getPreviewPost(params)
  return { title: `미리보기: ${post.title}`, robots: { index: false } }
}

export default async function CommunitySeedPreviewPage({ params }) {
  const post = await getPreviewPost(params)

  const html = await communityMarkdownToHtml(post.content)
  const now = new Date().toISOString()

  return (
    <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen mb-16">
      <BackButton href="/community/preview" />

      <Notice color="yellow" className="mb-4">미리보기: 아직 게시되지 않은 글입니다.</Notice>

      <article className={cardClasses({ padding: 'md' })}>
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-1.5">
            {post.pinned && <Badge color="red">공지</Badge>}
            <CategoryBadges post={post} />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug mt-3 mb-0 break-words">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-xs text-gray-400">
            <AuthorLine name="Admin" isTeacher={false} role="admin" size="md" />
            <span aria-hidden="true">·</span>
            <time dateTime={now}>{formatKstDate(now)}</time>
            <span aria-hidden="true">·</span>
            <span>조회 0</span>
          </div>
        </header>

        <div
          className={POST_BODY_CLASSES}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </main>
  )
}
