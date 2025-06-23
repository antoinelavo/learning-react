import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Link from 'next/link'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export async function getStaticProps() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'))
  const posts = files.map(file => {
    const source = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8')
    const { data } = matter(source)
    return {
      slug: file.replace(/\.mdx$/, ''),
      ...data
    }
  })

  // sort by date descending
  posts.sort((a, b) => new Date(b.date) - new Date(a.date))

  return { props: { posts } }
}

export default function BlogIndex({ posts }) {
  return (
    <section className="max-w-3xl mx-auto py-16 space-y-8">
      <h1 className="text-4xl font-bold">국제학교 입시 관련 정보</h1>
      {posts.map(post => (
        <Link key={post.slug} href={`/blog/${post.slug}`} className="block p-6 border-b hover:bg-gray-50 transition"> 
            <h2 className="text-2xl font-semibold">{post.title}</h2>
            <time className="text-gray-500 block mb-2">{post.date}</time>
            <p className="text-gray-700">{post.description}</p>
        </Link>
      ))}
    </section>
  )
}
