import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Link from 'next/link' 
import Head from 'next/head'

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
    <>
     <Head>
       <title>국제학교 입시 관련 정보 | IB Master Blog</title>
       <meta name="description"content="국제학교 입시, 지원 전략, 커리큘럼 비교 등 – 모든 국제학교 입시 정보를 한곳에서 확인하세요."/>
       <link rel="icon" type="image/png" href="../images/favicon.ico"></link>
        <meta name="robots" content="index, follow"></meta>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
     </Head>
    <section className="max-w-3xl mx-auto py-16 space-y-4">
      <h1 className="text-4xl font-bold text-center mb-16">국제학교 입시 관련 정보</h1>
      {posts.map(post => (
        <Link key={post.slug} href={`/blog/${post.slug}`} className="block bg-gray-200 px-[3em] py-[1em] rounded-lg mx-[2em]"> 
            <h2 className="text-lg font-semibold hover:text-blue-500 m-0">{post.title}</h2>
            <time className="text-sm text-gray-500 block">{post.date}</time>
        </Link>
      ))}
    </section>
    </>
  )
}
