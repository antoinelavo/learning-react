import { notFound } from 'next/navigation'
import { Badge, cardClasses } from '@/components/ui'
import { CategoryBadges } from '@/components/community/CategoryBadge'
import AuthorLine from '@/components/community/AuthorLine'
import { getCommunityPostPage } from '@/lib/communityPost'
import { getPublicCommentTree } from '@/lib/communityComments'
import { communityMarkdownToHtml } from '@/lib/communityMarkdown'
import { stripMarkdown, formatKstDate, decodeSlug, postCategories } from '@/lib/community'
import { jsonLdString } from '@/lib/hagwonNeis'
import BackButton from '@/components/community/BackButton.client'
import { POST_BODY_CLASSES } from '@/components/community/postBodyClasses'
import PostActions from './PostActions.client'
import CommentThread from './CommentThread.client'

const SITE_URL = 'https://www.ibmaster.net'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const slug = decodeSlug((await params).slug)
  const result = await getCommunityPostPage(slug)
  if (!result) notFound()
  if (!result.post) return { robots: { index: false } }

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

// schema.org Comment for one visible comment (deleted ones are skipped),
// with its replies nested. Names are the public labels (익명N etc.).
function commentJsonLd(c) {
  const replies = (c.replies || []).filter(r => !r.deleted_at)
  return {
    '@type': 'Comment',
    text: c.content,
    dateCreated: c.created_at,
    author: { '@type': 'Person', name: c.author_display_name },
    upvoteCount: c.like_count,
    ...(replies.length ? { comment: replies.map(commentJsonLd) } : {}),
  }
}

// A deleted top-level comment is dropped, but its live replies are kept
// (moved up a level) since they're still shown on the page.
function visibleCommentsJsonLd(comments) {
  return comments.flatMap(c => c.deleted_at
    ? (c.replies || []).filter(r => !r.deleted_at).map(commentJsonLd)
    : [commentJsonLd(c)])
}

function postJsonLd(post, comments) {
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
    articleSection: postCategories(post),
    author: {
      '@type': 'Person',
      name: post.author_display_name,
      ...(post.author_profile_link ? { url: `${SITE_URL}${post.author_profile_link}` } : {}),
    },
    ...(post.image_urls?.length ? { image: post.image_urls } : {}),
    commentCount: post.comment_count,
    comment: visibleCommentsJsonLd(comments),
    interactionStatistic: [
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: post.like_count },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: post.comment_count },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/ViewAction', userInteractionCount: post.view_count },
    ],
  }
}

export default async function CommunityPostDetailPage({ params }) {
  const slug = decodeSlug((await params).slug)
  const result = await getCommunityPostPage(slug)
  if (!result) notFound()

  if (result.deleted) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen">
        <BackButton href="/community" />
        <p className="text-center text-sm text-gray-400 mt-10">
          {result.deleted.byAdmin ? '관리자에 의해 삭제된 게시글입니다.' : '삭제된 게시글입니다.'}
        </p>
      </main>
    )
  }

  const { post } = result
  // Comments are best-effort here: on failure the client loads them as before.
  const [html, comments] = await Promise.all([
    communityMarkdownToHtml(post.content),
    getPublicCommentTree(post.id).catch(err => {
      console.error('community comments prerender error:', err)
      return null
    }),
  ])

  return (
    <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen mb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(postJsonLd(post, comments || [])) }}
      />

      <BackButton href="/community" />

      <article className={cardClasses({ padding: 'md' })}>
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-1.5">
            {post.is_pinned && <Badge color="red">공지</Badge>}
            <CategoryBadges post={post} />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug mt-3 mb-0 break-words">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-xs text-gray-400">
            <AuthorLine
              name={post.author_display_name}
              isTeacher={post.is_teacher}
              role={post.author_role}
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
          className={POST_BODY_CLASSES}
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
        <CommentThread slug={post.slug} initialComments={comments} />
      </div>
    </main>
  )
}
