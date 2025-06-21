// app/blog/[slug]/page.js
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import BlogCTAButton from '@/components/BlogCTAButton'

export async function generateStaticParams() {
  const postsDir = path.join(process.cwd(), 'content', 'blog')
  return fs
    .readdirSync(postsDir)
    .filter(f => f.endsWith('.mdx'))
    .map(filename => ({ slug: filename.replace(/\.mdx$/, '') }))
}

export default async function BlogPostPage({ params }) {
  const { slug } = params
  const filePath = path.join(process.cwd(), 'content', 'blog', `${slug}.mdx`)
  const source = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(source)
  const mdxSource = await serialize(content, { scope: data })

  return (
    <article className="prose mx-auto py-16">
      <h1>{data.title}</h1>
      <time className="text-gray-500">{data.date}</time>

      {data.ctaPosition === 'top' && data.ctaLabel && (
        <BlogCTAButton label={data.ctaLabel} href={data.ctaLink} className="my-6" />
      )}

      <MDXRemote {...mdxSource} components={{ BlogCTAButton }} />

      {(data.ctaPosition === 'bottom' || !data.ctaPosition) && data.ctaLabel && (
        <BlogCTAButton label={data.ctaLabel} href={data.ctaLink} className="mt-12" />
      )}
    </article>
  )
}