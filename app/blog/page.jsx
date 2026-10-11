import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import BlogBoard from './BlogBoard.client'
import { jsonLdString } from '@/lib/hagwonNeis'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export const metadata = {
  title: 'IB·SAT 입시 블로그 | IB Master',
  description: 'IB 과목 선택, IB 시험 일정, SAT 준비, 특례입학까지 국제학교 입시에 필요한 정보를 정리한 IB Master 블로그입니다.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    url: '/blog',
    title: 'IB·SAT 입시 블로그 | IB Master',
    description: 'IB 과목 선택, IB 시험 일정, SAT 준비, 특례입학까지 국제학교 입시에 필요한 정보를 정리한 IB Master 블로그입니다.',
  },
}

export const revalidate = 60

export default async function BlogPage() {
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

  const allPosts = [...mdxPosts].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )

  const featured = allPosts.filter(p => p.featured)
  const regular = allPosts.filter(p => !p.featured)

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'IB Master 블로그',
    itemListElement: [...mdxPosts]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((post, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://www.ibmaster.net/blog/${encodeURIComponent(post.slug)}`,
        name: post.title,
      })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(itemListJsonLd) }}
      />
      <BlogBoard featured={featured} regular={regular} />
    </>
  )
}
