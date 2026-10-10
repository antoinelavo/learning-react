import { notFound } from 'next/navigation'
import { Badge, Button, cardClasses } from '@/components/ui'
import CategoryBadge from '@/components/community/CategoryBadge'
import AuthorLine from '@/components/community/AuthorLine'
import { getCommunityPostPage } from '@/lib/communityPost'
import { communityMarkdownToHtml } from '@/lib/communityMarkdown'
import { stripMarkdown, formatKstDate } from '@/lib/community'
import { jsonLdString } from '@/lib/hagwonNeis'
import PostActions from './PostActions.client'
import CommentThread from './CommentThread.client'

const SITE_URL = 'https://www.ibmaster.net'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const result = await getCommunityPostPage(slug)
  if (!result?.post) return { robots: { index: false } }

  const { post } = result
  const path = `/community/post/${post.slug}`
  const description = stripMarkdown(post.content, 150) || post.title
  return {
    title: `${post.title} | IB Master 커뮤니티`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      url: path,
      title: post.title,
      description,
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      ...(post.image_urls?.[0] ? { images: [post.image_urls[0]] } : {}),
    },
  }
}

function postJsonLd(post) {
  const url = `${SITE_URL}/community/post/${post.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    '@id': url,
    url,
    headline: post.title,
    text: stripMarkdown(post.content, 500),
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    articleSection: post.category,
    author: {
      '@type': 'Person',
      name: post.author_display_name,
      ...(post.author_profile_link ? { url: `${SITE_URL}${post.author_profile_link}` } : {}),
    },
    ...(post.image_urls?.length ? { image: post.image_urls } : {}),
    commentCount: post.comment_count,
    interactionStatistic: [
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: post.like_count },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: post.comment_count },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/ViewAction', userInteractionCount: post.view_count },
    ],
  }
}

export default async function CommunityPostDetailPage({ params }) {
  const { slug } = await params
  const result = await getCommunityPostPage(slug)
  if (!result) notFound()

  if (result.deleted) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen">
        <Button href="/community" variant="ghost" size="sm" className="mb-3">목록으로</Button>
        <p className="text-center text-sm text-gray-400 mt-10">
          {result.deleted.byAdmin ? '관리자에 의해 삭제된 게시글입니다.' : '삭제된 게시글입니다.'}
        </p>
      </main>
    )
  }

  const { post } = result
  const html = await communityMarkdownToHtml(post.content)

  return (
    <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen mb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(postJsonLd(post)) }}
      />

      <Button href="/community" variant="ghost" size="sm" className="mb-3">목록으로</Button>

      <article className={cardClasses({ padding: 'md' })}>
        <header className="mb-6">
          <div className="flex items-center gap-1.5">
            {post.is_pinned && <Badge color="red">공지</Badge>}
            <CategoryBadge category={post.category} />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug mt-3 mb-0 break-words">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-xs text-gray-400">
            <AuthorLine
              name={post.author_display_name}
              isTeacher={post.is_teacher}
              profilePicture={post.author_profile_picture}
              profileLink={post.author_profile_link}
              size="md"
            />
            <span aria-hidden="true">·</span>
            <time dateTime={post.created_at}>{formatKstDate(post.created_at)}</time>
            <span aria-hidden="true">·</span>
            <span>조회 {post.view_count}</span>
          </div>
        </header>

        {post.image_urls?.length > 0 && (
          <div className="flex flex-col gap-3 mb-6">
            {post.image_urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt={`${post.title} 첨부 이미지 ${i + 1}`} className="w-full rounded-xl" />
            ))}
          </div>
        )}

        <div
          className="
            prose max-w-none text-left break-words
            prose-p:leading-relaxed
            prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-base prose-h3:font-semibold prose-h3:mt-5 prose-h3:mb-2
            prose-a:text-blue-600 prose-a:underline-offset-4
            prose-img:rounded-xl
          "
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <PostActions
          slug={post.slug}
          postId={post.id}
          initialLikeCount={post.like_count}
          initialPinned={post.is_pinned}
        />
      </article>

      <div className="mt-4">
        <CommentThread slug={post.slug} />
      </div>
    </main>
  )
}
