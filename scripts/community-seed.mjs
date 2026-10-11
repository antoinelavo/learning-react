/**
 * Community seed post publisher
 *
 * Publishes one post from content/community-seed/ to the community board as
 * the `Admin` user. Run it once per post.
 *
 * Usage: node scripts/community-seed.mjs <n>   (n = the file's number prefix, 1-6)
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, from the
 * environment or from .env.local (environment wins). Writes to whichever
 * database those point at.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { createClient } from '@supabase/supabase-js'
import { normalizeCategories } from '../lib/community.js'

const ADMIN_USERNAME = 'Admin'
const SITE_URL = 'https://www.ibmaster.net'
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const SEED_DIR = path.join(ROOT, 'content', 'community-seed')

function fail(message) {
  console.error(message)
  process.exit(1)
}

// Same format as generateSlug in app/api/community/posts/route.js
function generateSlug(title) {
  const base = title.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 50)
  return `${base || 'post'}-${Date.now().toString(36)}`
}

function loadPost(n) {
  const files = fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.md'))
  const file = files.find(f => f.startsWith(`${n}-`))
  if (!file) fail(`Usage: node scripts/community-seed.mjs <n>\nNo seed post numbered ${n}. Available: ${files.map(f => f.split('-')[0]).join(', ')}`)

  const { data, content } = matter(fs.readFileSync(path.join(SEED_DIR, file), 'utf8'))
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const body = content.trim()
  const categories = normalizeCategories(data.categories)

  if (!title || !body) fail(`${file}: title and content are required`)
  if (title.length > 100) fail(`${file}: title is over 100 characters`)
  if (body.length > 20000) fail(`${file}: content is over 20,000 characters`)
  if (!categories) fail(`${file}: categories must be 1-3 known boards`)

  return { file, title, content: body, categories, pinned: data.pinned === true }
}

const arg = process.argv[2]
if (!/^[1-9]\d*$/.test(arg || '')) fail('Usage: node scripts/community-seed.mjs <n>   (n = seed post number, e.g. 1)')
const post = loadPost(Number(arg))

const envPath = path.join(ROOT, '.env.local')
const env = {}
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) env[match[1].trim()] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2')
  })
}
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  fail('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set them in the environment or .env.local)')
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { data: admin, error: adminError } = await db
  .from('users')
  .select('id, role')
  .eq('username', ADMIN_USERNAME)
  .maybeSingle()
if (adminError) fail(`Failed to look up user ${ADMIN_USERNAME}: ${adminError.message}`)
if (!admin) fail(`User ${ADMIN_USERNAME} not found`)
if (admin.role !== 'admin') fail(`User ${ADMIN_USERNAME} has role ${admin.role}, not admin`)

const { data: existing, error: existingError } = await db
  .from('community_posts')
  .select('slug')
  .eq('user_id', admin.id)
  .eq('title', post.title)
  .is('deleted_at', null)
  .limit(1)
if (existingError) fail(`Failed to check for an existing post: ${existingError.message}`)
if (existing.length) fail(`Already published: ${SITE_URL}/community/post/${encodeURIComponent(existing[0].slug)}`)

const { data: created, error: insertError } = await db
  .from('community_posts')
  .insert({
    slug: generateSlug(post.title),
    user_id: admin.id,
    category: post.categories[0],
    categories: post.categories,
    title: post.title,
    content: post.content,
    is_anonymous: false,
    image_urls: [],
    is_pinned: post.pinned,
  })
  .select('slug')
  .single()
if (insertError) fail(`Failed to publish ${post.file}: ${insertError.message}`)

console.log(`Published ${post.file}${post.pinned ? ' (pinned as 공지)' : ''}`)
console.log(`${SITE_URL}/community/post/${encodeURIComponent(created.slug)}`)
