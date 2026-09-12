import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { generateAnonNickname } from '@/lib/communityAnon'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CategoryBadge from '@/components/community/CategoryBadge'
import PostActions from './PostActions.client'
import CommentThread from './CommentThread.client'

async function markdownToHtml(content) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeStringify)
    .process(content)
  return String(file)
}

export async function generateMetadata({ params }) {
  const { data: post } = await supabase
    .from('community_posts_public')
    .select('title, content')
    .eq('slug', params.slug)
    .single()

  if (!post) return {}
  return {
    title: post.title,
    description: post.content?.slice(0, 100),
  }
}

export default async function CommunityPostDetailPage({ params }) {
  const { data: post } = await supabase
    .from('community_posts_public')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!post) notFound()

  const html = await markdownToHtml(post.content)

  let authorDisplayName = post.author_username || '알 수 없음'
  if (post.is_anonymous) {
    // The public view strips user_id for privacy, so the nickname needs a
    // separate service-role lookup — this string is all that ever reaches
    // the client, never the raw user_id.
    const { data: ownerRow } = await supabaseAdmin
      .from('community_posts')
      .select('user_id')
      .eq('slug', params.slug)
      .single()
    authorDisplayName = generateAnonNickname(post.id, ownerRow?.user_id)
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 mb-20">
      <Link href="/community" className="text-sm text-blue-500 hover:underline mb-6 inline-block">
        ← 커뮤니티로 돌아가기
      </Link>

      <article>
        <header className="mb-6">
          <CategoryBadge category={post.category} />
          <h1 className="text-2xl font-bold text-gray-900 leading-snug mt-3">{post.title}</h1>

          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <span className="text-gray-600 font-medium">{authorDisplayName}</span>
            <span>·</span>
            <time>{new Date(post.created_at).toLocaleDateString('ko-KR')}</time>
            <span>·</span>
            <span>조회 {post.view_count}</span>
          </div>
        </header>

        {post.image_urls?.length > 0 && (
          <div className="flex flex-col gap-3 mb-6">
            {post.image_urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="w-full rounded-xl" />
            ))}
          </div>
        )}

        <div
          className="
            prose prose-lg dark:prose-invert text-left
            prose-p:leading-relaxed
            prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3
            prose-a:text-blue-500 prose-a:underline-offset-4
            prose-ul:text-base prose-ol:text-base
            prose-img:rounded-xl prose-img:shadow-lg
          "
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <PostActions slug={post.slug} initialLikeCount={post.like_count} />
      </article>

      <CommentThread slug={post.slug} />
    </main>
  )
}
