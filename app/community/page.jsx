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

export const revalidate = 60

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
        description: data.description || '',
        date: data.date || '',
        category: data.category || '일반',
        featured: data.featured || false,
        type: 'mdx',
        views: 0,
        url: `/blog/${file.replace(/\.mdx$/, '')}`,
      }
    })

  // --- Supabase posts (admin + user) ---
  let supabasePosts = []
  try {
    const { data } = await supabase
      .from('posts')
      .select('slug, title, description, category, type, featured, date, created_at, views')
      .eq('published', true)
      .order('created_at', { ascending: false })

    supabasePosts = (data || []).map(p => ({
      slug: p.slug,
      title: p.title,
      description: p.description || '',
      date: p.date || p.created_at?.slice(0, 10) || '',
      category: p.category || '일반',
      featured: p.featured || false,
      type: p.type,
      views: p.views || 0,
      url: `/community/${p.slug}`,
    }))
  } catch {
    // posts table not yet created — degrade gracefully
  }

  // Merge and sort by date desc
  const allPosts = [...supabasePosts, ...mdxPosts].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )

  const featured = allPosts.filter(p => p.featured)
  const regular = allPosts.filter(p => !p.featured)

  return <CommunityBoard featured={featured} regular={regular} />
}
