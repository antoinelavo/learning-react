// lib/communitySeed.js
//
// Reads and validates the admin seed posts in content/community-seed/.
// Shared by scripts/community-seed.mjs (publishing) and the dev-only
// /community/preview pages, so a preview always matches what gets published.
// Uses Node fs: server code and scripts only, never client components.
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
// Relative import so plain Node (the publish script) can load this file.
import { normalizeCategories } from './community.js'

export const SEED_DIR = path.join(process.cwd(), 'content', 'community-seed')

// [{ n, file }] for every NN-name.md file, sorted by number.
export function listSeedFiles(dir = SEED_DIR) {
  return fs.readdirSync(dir)
    .map(file => ({ n: Number(file.match(/^(\d+)-.*\.md$/)?.[1]), file }))
    .filter(f => Number.isInteger(f.n) && f.n > 0)
    .sort((a, b) => a.n - b.n)
}

// Returns { post } or { error }. `post` has the fields the publish script
// inserts: { n, file, title, content, categories, pinned }.
export function loadSeedPost(n, dir = SEED_DIR) {
  const entry = listSeedFiles(dir).find(f => f.n === n)
  if (!entry) return { error: `No seed post numbered ${n}` }

  const { data, content } = matter(fs.readFileSync(path.join(dir, entry.file), 'utf8'))
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const body = content.trim()
  const categories = normalizeCategories(data.categories)

  if (!title || !body) return { error: `${entry.file}: title and content are required` }
  if (title.length > 100) return { error: `${entry.file}: title is over 100 characters` }
  if (body.length > 20000) return { error: `${entry.file}: content is over 20,000 characters` }
  if (!categories) return { error: `${entry.file}: categories must be 1-3 known boards` }

  return { post: { n, file: entry.file, title, content: body, categories, pinned: data.pinned === true } }
}
