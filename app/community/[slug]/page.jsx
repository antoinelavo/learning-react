import { supabase } from '@/lib/supabase'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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
    .from('posts')
    .select('title, description')
    .eq('slug', params.slug)
    .eq('published', true)
    .single()

  if (!post) return {}
  return {
    title: post.title,
    description: post.description || undefined,
    openGraph: { title: post.title, description: post.description || undefined },
  }
}

export default async function CommunityPostPage({ params }) {
  const { data: post } = await supabase
    .from('posts')
    .select('id, slug, title, description, content, category, type, date, created_at, views')
    .eq('slug', params.slug)
    .eq('published', true)
    .single()

  if (!post) notFound()

  const html = await markdownToHtml(post.content)
  const displayDate = post.date || post.created_at?.slice(0, 10)
  const isAdmin = post.type === 'admin'

  // Increment view count (fire-and-forget, don't block render)
  supabase.rpc('increment_post_views', { post_slug: post.slug }).then(() => {})

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 mb-20">
      <Link href="/community" className="text-sm text-blue-500 hover:underline mb-6 inline-block">
        ← 커뮤니티로 돌아가기
      </Link>

      <article>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              post.category === 'IB'     ? 'bg-blue-100 text-blue-700' :
              post.category === 'SAT'    ? 'bg-purple-100 text-purple-700' :
              post.category === '특례입학' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {post.category}
            </span>
            {isAdmin && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-600 text-white">
                IB Master
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 leading-snug">{post.title}</h1>

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <time>{displayDate}</time>
            <span>조회 {post.views}</span>
          </div>
        </header>

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
      </article>

      {/* Comments placeholder */}
      <section className="mt-16 border-t border-gray-200 pt-8">
        <h2 className="text-base font-semibold text-gray-700 mb-4">댓글</h2>
        <div className="bg-gray-50 rounded-xl p-6 text-center text-sm text-gray-400">
          댓글 기능은 곧 추가될 예정입니다.
        </div>
      </section>
    </main>
  )
}
