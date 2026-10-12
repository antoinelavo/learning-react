import { supabase } from '@/lib/supabase'

// Sitemap of live community posts, listed in public/robots.txt next to the
// static public/sitemap.xml. Reads the public view, so drafts and deleted
// posts are never included. Rendered per request (so the build never needs
// the database) and cached at the CDN for an hour.
export const dynamic = 'force-dynamic'

const SITE_URL = 'https://www.ibmaster.net'
const BATCH = 1000

async function getLivePosts() {
  const rows = []
  for (let from = 0; ; from += BATCH) {
    const { data, error } = await supabase
      .from('community_posts_public')
      .select('slug')
      .order('created_at', { ascending: false })
      .order('slug')
      .range(from, from + BATCH - 1)
    if (error) throw new Error(`community sitemap query failed: ${error.message}`)
    rows.push(...(data || []))
    if (!data || data.length < BATCH) return rows
  }
}

// No <lastmod>: a trigger bumps community_posts.updated_at on every row
// update, including view and like counters, so it tracks traffic, not edits.
function urlEntry(loc) {
  return `  <url>\n    <loc>${loc}</loc>\n  </url>`
}

export async function GET() {
  const posts = await getLivePosts()
  // encodeURIComponent leaves only URL-safe characters (no &, <, >), so the
  // result needs no further XML escaping.
  const entries = [
    urlEntry(`${SITE_URL}/community`),
    ...posts.map(p => urlEntry(`${SITE_URL}/community/post/${encodeURIComponent(p.slug)}`)),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
