# Spec: Admin seed posts for the community board

## Goal
Publish six useful resource posts to `/community` as the `Admin` account, one post per script run, so new visitors find real content on the board.

## Included
- Six Korean posts as Markdown files in `content/community-seed/`, each with frontmatter (`title`, `categories`, `pinned`):
  1. 자유게시판: 커뮤니티 이용 안내 (rules, anonymous posting, reporting). `pinned: true`
  2. IB: IB 필수 자료 모음 (IBO site, subject guides, exam sessions and results, IB school finder)
  3. SAT: SAT 준비 공식 자료 (College Board, Bluebook, Khan Academy, registration, test centers in Korea)
  4. 특례입학: 재외국민 특례 기초 정리 (3년 vs 12년 특례, eligibility, where to find 모집요강)
  5. 정보공유: 해외 대학 지원 링크 (Common App, UCAS, scholarship search)
  6. 정보공유: IBMaster 활용법 (`/find`, `/hagwons`, `/students`)
- `scripts/community-seed.mjs <n>`: publishes post `n` (1–6) and prints its URL.
  - Posts as the hardcoded username `Admin`.
  - Reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the environment or `.env.local`, like `scripts/generate-sitemap.js`.
  - Sets `is_pinned` from frontmatter.

## Not included
- No UI, API route, or schema changes.
- No sitemap changes (community is still out of the sitemap per `TODO.md`).
- No bulk mode. Each run publishes exactly one post.
- Claude does not run the script against production. The owner runs it.

## Rules
- The script refuses to post (non-zero exit, nothing written) if:
  - `n` is missing or not 1–6
  - user `Admin` doesn't exist or its role isn't `admin`
  - a non-deleted post with the same title by `Admin` already exists (prevents double posting)
- Inserts match what `POST /api/community/posts` writes: same slug format, `category` = first of `categories`, `is_anonymous: false`, no images. Categories are checked with `normalizeCategories` from `lib/community.js`. Title is at most 100 characters and content at most 20,000.
- Content: Korean, friendly 운영자 tone. Links to official sources, IB Master pages and blog posts, and widely used third-party study resources (e.g. Clastify, Revision Village, OnePrep). No links to pirated or leaked exam material. No exact exam dates, deadlines or prices that go stale. Point to the official page instead.
- 특례 content stays general and tells readers to check each university's 모집요강.
- Markdown must render with `lib/communityMarkdown.js`, so no raw HTML.
- Writes to the production DB through the service-role key. This touches no migrations or RLS.

## Done when
- [x] Six Markdown files exist in `content/community-seed/` with valid frontmatter and categories from `CATEGORY_LIST`.
- [x] `node scripts/community-seed.mjs` with no arg, or with `7`, exits non-zero with a usage message.
- [x] Without Supabase env vars, the script exits non-zero with a clear error.
- [x] Code review confirms the `Admin` role check and duplicate-title check run before any insert.
- [x] Post #1 inserts with `is_pinned: true`, and the others with `false`.
- [x] `npm run build` passes.
