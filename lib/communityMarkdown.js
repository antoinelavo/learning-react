// lib/communityMarkdown.js
//
// Renders user-written community markdown to HTML. Raw HTML in the source is
// dropped (remark-rehype default), links are limited to safe URL schemes so
// a post can't carry a `javascript:` link, and inline images must be our own
// R2 uploads.
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { visit, SKIP } from 'unist-util-visit'
import { isCommunityImageUrl } from '@/lib/community'

const SAFE_URL = /^(https?:|mailto:|\/|#)/i

function rehypeSafeUrls() {
  return tree => {
    visit(tree, 'element', (node, index, parent) => {
      // Inline images only from our own uploads (no hotlinked trackers).
      if (node.tagName === 'img' && !isCommunityImageUrl(node.properties?.src)) {
        parent.children.splice(index, 1)
        return [SKIP, index]
      }
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
