// pages/blog/[slug].js
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Head from 'next/head'
import BlogCTAButton from '@/components/BlogCTAButton'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import mdxComponents from '@/components/blog/mdx-components'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

// Posts created before the enhanced MDX upgrade use the old HTML pipeline
const LEGACY_SLUGS = new Set([
  '3-year-admission-program',
  '3-year-admission-program-parents',
  'IB-English',
  'IB-English-hagwons',
  'IB-Math',
  'IB-Math-hagwons',
  'IB-exam-schedule',
  'IB-hagwon',
  'IB-hagwon-directory',
  'IB-in-Korea',
  'IB-scores',
  'IB-subject-choices',
  'SAT-hagwon-guide',
  'SAT-hagwon-rates',
  'SAT-hagwons-apgujeong',
  'SAT-hagwons-bundang',
  'SAT-hagwons-busan',
  'SAT-hagwons-gangnam',
  'SAT-scores-by-university',
  'SAT-tutoring-vs-SAT-hagwon',
  'about-ib',
  'about-tutoring-ib',
  'choosing-ib-hagwons',
  'daechi-IB-hagwon',
  'hagwons-that-specialize-in-SAT',
  'ib-hagwon-guide',
  'ib-hagwon-rates',
  'ib-hagwon-vs-tutoring',
  'ib_hagwon_gangnam',
  'korean-IB-schools',
  'online-ib-hagwon',
  'overseas-citizen',
  'preparing-for-SAT',
  'private-lesson',
  'private-lesson-cost',
  'sat_hagwon_necessity',
  'universities-that-accept-IB',
])

function getHeadings(markdown) {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
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

export async function getStaticPaths() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'))
  return {
    paths: files.map(f => ({ params: { slug: f.replace(/\.mdx$/, '') } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const fullPath = path.join(BLOG_DIR, `${params.slug}.mdx`)
  const source = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(source)

  const isLegacy = LEGACY_SLUGS.has(params.slug)
  const toc = getHeadings(content)

  if (isLegacy) {
    // Old pipeline: markdown → HTML string
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeStringify)
      .process(content)

    return {
      props: {
        frontmatter: data,
        mdxHtml: String(file),
        mdxSource: null,
        toc,
        isLegacy: true,
      },
    }
  }

  // New pipeline: MDX → serialized React components
  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
    },
  })

  return {
    props: {
      frontmatter: data,
      mdxHtml: null,
      mdxSource,
      toc,
      isLegacy: false,
    },
  }
}

export default function BlogPost({ frontmatter, mdxHtml, mdxSource, toc, isLegacy }) {
  return (
    <>
      <Head>
        <title>{frontmatter.title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <link rel="icon" href="/images/favicon.ico" />
        <meta name="description" content={frontmatter.description} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={frontmatter.title} />
        <meta property="og:description" content={frontmatter.description} />
        <meta
          property="og:image"
          content={frontmatter.coverImage || '/images/mainlogo.svg'}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={frontmatter.title} />
        <meta name="twitter:description" content={frontmatter.description} />
        <meta
          name="twitter:image"
          content={frontmatter.coverImage || '/images/mainlogo.svg'}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: frontmatter.title,
              description: frontmatter.description,
              datePublished: frontmatter.date,
              author: { "@type": "Person", name: "IB Master" },
              publisher: {
                "@type": "Organization",
                name: "IB Master",
                logo: { "@type": "ImageObject" },
              },
            }),
          }}
        />
      </Head>

      <div className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* — Main article */}
        <article className="md:col-span-3">
          {/* Mobile CTA */}
          {frontmatter.ctaDescription &&
            frontmatter.ctaLabel &&
            frontmatter.ctaLink && (
              <div className="md:hidden max-w-[20em] mx-auto flex flex-col items-center text-center bg-blue-50 rounded-xl p-6 mb-6">
                <p className="font-bold text-black">
                  {frontmatter.ctaDescription}
                </p>
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

          {/* Rendered content */}
          <div
            className="
              min-h-[80dvh]
              mb-[10em]
              prose
              prose-lg
              lg:prose-xl
              dark:prose-invert
              text-left
              prose-p:leading-relaxed
              prose-h2:text-xl
              prose-h2:font-semibold
              prose-h2:mt-8
              prose-h2:mb-4
              prose-h2:text-gray-900
              prose-h2:scroll-mt-[4em]
              prose-h3:text-lg
              prose-h3:font-semibold
              prose-h3:mt-8
              prose-h3:mb-4
              prose-h3:text-gray-900
              prose-a:text-blue-500
              prose-a:underline-offset-4
              prose-ol:text-[16px]
              prose-ul:text-[16px]
              prose-img:rounded-xl
              prose-img:shadow-lg
              prose-img:border-solid
            "
          >
            {isLegacy ? (
              <div dangerouslySetInnerHTML={{ __html: mdxHtml }} />
            ) : (
              <MDXRemote {...mdxSource} components={mdxComponents} />
            )}
          </div>
        </article>

        {/* — Sidebar */}
        <aside className="hidden md:block">
          {frontmatter.ctaDescription &&
            frontmatter.ctaLabel &&
            frontmatter.ctaLink && (
              <div className="sticky top-20 flex flex-col items-center text-center bg-blue-50 rounded-xl p-6 mb-6">
                <p className="font-bold text-black text-balance">
                  {frontmatter.ctaDescription}
                </p>
                <BlogCTAButton
                  label={frontmatter.ctaLabel}
                  href={frontmatter.ctaLink}
                />
              </div>
            )}

          <nav className="sticky top-[18em] space-y-2 border-l pl-4">
            <h2 className="text-lg font-semibold mb-2">목차</h2>
            <ul className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              {toc.map(({ text, depth, id }) => (
                <li key={id} className={depth === 2 ? 'ml-4' : ''}>
                  <a
                    href={`#${id}`}
                    className="no-underline hover:underline focus:no-underline visited:no-underline"
                  >
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
