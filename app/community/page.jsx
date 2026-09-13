import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { supabase } from '@/lib/supabase'
import CommunityBoard from './CommunityBoard.client'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export const metadata = {
  title: '국제학교 입시 커뮤니티 | IB Master',
  description: 'IB, SAT, 특례입학 관련 정보와 질문을 나누는 커뮤니티입니다.',
  openGraph: {
    title: '국제학교 입시 커뮤니티 | IB Master',
    description: 'IB, SAT, 특례입학 관련 정보와 질문을 나누는 커뮤니티입니다.',
  },
}

// Render fresh on every request rather than ISR-caching this page: the
// admin/blog announcements rail should reflect a newly published post
// immediately, not lag behind a cache window (the main board below is
// already fetched live, client-side, regardless of this setting).
export const dynamic = 'force-dynamic'

export default async function CommunityPage() {
  // --- MDX SEO posts (filesystem) ---
  const mdxPosts = fs
    .readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(file => {
      const { data } = matter(fs.readFileSync(path.join(BLOG_DIR, file), 'utf8'))
      return {
        slug: file.replace(/\.mdx$/, ''),
        title: data.title || '',
        date: data.date || '',
        category: data.category || '일반',
        featured: data.featured || false,
        url: `/blog/${file.replace(/\.mdx$/, '')}`,
      }
    })

  // --- Admin-authored announcements (legacy `posts` table, type='admin') ---
  let adminPosts = []
  let debugError = null
  let debugRawCount = null
  try {
    const { data, error, count } = await supabase
      .from('posts')
      .select('slug, title, category, featured, date, created_at', { count: 'exact' })
      .eq('published', true)
      .eq('type', 'admin')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) debugError = error.message
    debugRawCount = count

    adminPosts = (data || []).map(p => ({
      slug: p.slug,
      title: p.title,
      date: p.date || p.created_at?.slice(0, 10) || '',
      category: p.category || '일반',
      featured: p.featured || false,
      url: `/community/${p.slug}`,
    }))
  } catch (err) {
    // legacy posts table not available — degrade gracefully
    debugError = err?.message || String(err)
  }

  const announcements = [...adminPosts, ...mdxPosts]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)

  // TEMPORARY debug info — remove once the "posts don't load on first visit"
  // issue is diagnosed. Shows exactly what this specific server render saw.
  const debug = {
    renderedAt: new Date().toISOString(),
    adminPostsFound: adminPosts.length,
    adminPostsRawCount: debugRawCount,
    mdxPostsFound: mdxPosts.length,
    announcementsShown: announcements.length,
    error: debugError,
  }

  return <CommunityBoard announcements={announcements} debug={debug} />
}
