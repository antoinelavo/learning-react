// pages/blog/[slug].js
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import BlogCTAButton from '@/components/BlogCTAButton'
import Head from 'next/head'

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfmPlugin from 'remark-gfm'
import remarkSlug from 'remark-slug'
import { visit } from 'unist-util-visit'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

// — STEP 1: Extract only H1 & H2 from the raw markdown
function getHeadings(markdown) {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfmPlugin)
    .use(remarkSlug)
    .parse(markdown)

  const headings = []
  visit(tree, 'heading', (node) => {
    if (node.depth === 1 || node.depth === 2) {
      const text = node.children
        .filter(c => c.type === 'text' || c.type === 'inlineCode')
        .map(c => c.value)
        .join('')
      const id =
        node.data?.hProperties?.id ||
        text.toLowerCase().replace(/\s+/g, '-')
      headings.push({ text, depth: node.depth, id })
    }
  })
  return headings
}

// — Your custom MDX components + list, code, image styling
const MDXComponents = {
  BlogCTAButton,
  ul: props => (
    <ul
      className="list-disc list-inside space-y-2 pl-5 marker:text-blue-500 text-[16px]"
      {...props}
    />
  ),
  ol: props => (
    <ol
      className="list-decimal list-inside space-y-2 pl-5 marker:text-blue-500 text-[16px]"
      {...props}
    />
  ),
  blockquote: props => (
    <blockquote
      className="border-l-4 border-blue-200 not-italic text-gray-600 pl-4 my-6"
      {...props}
    />
  ),
  pre: props => (
    <pre
      className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-6"
      {...props}
    />
  ),
  code: props => (
    <code
      className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono"
      {...props}
    />
  ),
  img: props => (
    <img className="rounded-xl shadow-md my-6 mx-auto" {...props} />
  ),
}

export async function getStaticPaths() {
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.mdx'))

  return {
    paths: files.map(f => ({
      params: { slug: f.replace(/\.mdx$/, '') },
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const fullPath = path.join(BLOG_DIR, `${params.slug}.mdx`)
  const source = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(source)

  // — serialize the MDX (no autolink headings plugin!)
  const mdxSource = await serialize(content, {
    scope: data,
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    },
  })

  // — build the TOC array
  const toc = getHeadings(content)

  return {
    props: {
      frontmatter: data,
      mdxSource,
      toc,
    },
  }
}

export default function BlogPost({ frontmatter, mdxSource, toc }) {
  return (
    <>
        <Head>
            <title>{frontmatter.title} | IB Master</title>

            {/* REQUIRED */}
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="robots"   content="index, follow" />
            <link rel="icon" href="/images/favicon.svg" />

            {/* 1. Description */}
            <meta name="description" content={frontmatter.description} />


            {/* 3. Open Graph */}
            <meta property="og:type"        content="article" />
            <meta property="og:title"       content={frontmatter.title} />
            <meta property="og:description" content={frontmatter.description} />
            <meta
            property="og:image"
            content={frontmatter.coverImage || '/images/mainlogo.svg'}
            />

            {/* 4. Twitter Card */}
            <meta name="twitter:card"        content="summary_large_image" />
            <meta name="twitter:title"       content={frontmatter.title} />
            <meta name="twitter:description" content={frontmatter.description} />
            <meta
            name="twitter:image"
            content={frontmatter.coverImage || '/images/mainlogo.svg'}
            />

            {/* 5. JSON-LD Structured Data (Article schema) */}
            <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": frontmatter.title,
                "description": frontmatter.description,
                "datePublished": frontmatter.date,
                "author": {
                    "@type": "Person",
                    "name": "IB Master"
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "IB Master",
                    "logo": {
                    "@type": "ImageObject"
                    }
                }                
            })
            }}
            />
        </Head>

    <div className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* — Main article (spans 3 cols) */}
      <article className="md:col-span-3">

        {/* Mobile Only: CTA Button */}
       {frontmatter.ctaDescription && frontmatter.ctaLabel && frontmatter.ctaLink && (
         <div className="
         md:hidden
         max-w-[20em]
         mx-auto
         flex
         flex-col
         items-center
         text-center
         bg-blue-50 
         rounded-xl 
         p-6 
         mb-6">
            <p className="font-bold text-black">{frontmatter.ctaDescription}</p>
           <BlogCTAButton
             label={frontmatter.ctaLabel}
             href={frontmatter.ctaLink}
           />
         </div>
       )}

        {/* Header */}
        <header className="mb-12 text-left">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-100">
            {frontmatter.title}
          </h1>
          <time className="text-gray-500 text-md mt-2 block">
            {frontmatter.date}
          </time>
        </header>


        {/* Content */}
        <div
          className={`
            prose 
            prose-lg
            lg:prose-xl 
            dark:prose-invert 
            text-left
            prose-h2:text-xl
            prose-h2:font-semibold
            prose-h2:mt-8
            prose-h2:mb-4
            prose-h2:text-gray-900
            prose-h3:text-lg
            prose-h3:font-semibold
            prose-h3:mt-8
            prose-h3:mb-4
            prose-h3:text-gray-900
            prose-a:text-blue-500
            prose-a:underline-offset-4          
            `}
        >
          <MDXRemote {...mdxSource} components={MDXComponents} />
        </div>

      </article>

      
      <aside className="hidden md:block">
        {/* CTA BOX */}
       {frontmatter.ctaDescription && frontmatter.ctaLabel && frontmatter.ctaLink && (
         <div className="
         sticky
         top-20
         flex
         flex-col
         items-center
         text-center
         bg-blue-50 
         rounded-xl 
         p-6 
         mb-6">
            <p className="font-bold text-black">{frontmatter.ctaDescription}</p>
           <BlogCTAButton
             label={frontmatter.ctaLabel}
             href={frontmatter.ctaLink}
           />
         </div>
       )}

       {/* — Table of Contents (spans 1 col, hidden on mobile) */}
        <nav className="sticky top-[15em] space-y-2 border-l pl-4">
          <h2 className="text-lg font-semibold mb-2">목차</h2>
          <ul className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            {toc.map(({ text, depth, id }) => (
              <li key={id} className={depth === 2 ? 'ml-4' : ''}>
                <a href={`#${id}`} className="
                no-underline          
                hover:underline      
                focus:no-underline     
                visited:no-underline">
                  {text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
    </>
  )
}