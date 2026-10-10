// lib/communityMarkdown.js
//
// Renders user-written community markdown to HTML. Raw HTML in the source is
// dropped (remark-rehype default), and links/images are limited to safe URL
// schemes so a post can't carry a `javascript:` link.
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'

const SAFE_URL = /^(https?:|mailto:|\/|#)/i

function rehypeSafeUrls() {
  return tree => {
    visit(tree, 'element', node => {
      const props = node.properties || {}
      for (const attr of ['href', 'src']) {
        if (typeof props[attr] === 'string' && !SAFE_URL.test(props[attr].trim())) {
          delete props[attr]
        }
      }
      if (node.tagName === 'a') {
        props.rel = ['nofollow', 'ugc', 'noopener']
        props.target = '_blank'
      }
    })
  }
}

export async function communityMarkdownToHtml(content) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSafeUrls)
    .use(rehypeStringify)
    .process(content || '')
  return String(file)
}
