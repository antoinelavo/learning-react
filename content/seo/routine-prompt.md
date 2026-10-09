# Weekly SEO blog post routine

Instructions for the scheduled routine that writes one blog post per run and opens a PR. A human reviews and merges every PR. Never merge it yourself.

Repository: `antoinelavo/learning-react` (IBMaster, ibmaster.net). Read `CLAUDE.md` and `content/seo/guide.md` before writing anything.

## 0. Setup

- If the repository isn't in the session, attach it with `add_repo` (owner `antoinelavo`, repo `learning-react`, access `push`) and clone it.
- Start from the latest `main`: `git fetch origin main && git checkout --detach origin/main`. Create the `blog/<slug>` branch in step 8, once the slug is known.
- If `node_modules` is missing, run `npm ci`.

## 1. Pick the keyword

- Open `content/seo/keywords.md`. Take the first row with status `planned`.
- If there is no `planned` row, stop. Don't write a post or open a PR. Report "No planned keywords."
- Before doing anything else, check that no open PR already targets this keyword (an open PR whose title starts with `blog:` and names it). If one exists, move on to the next `planned` row.

## 2. Check for overlap

- Read the titles and descriptions of every post in `content/blog/`.
- If an existing post already targets this keyword (same search intent, not just a related topic), don't write a new post. Mark the row `done` with that slug, and go back to step 1 with the next `planned` row. Include this change in the PR you open later (or, if no post gets written this run, open a PR with only the `keywords.md` change).
- Pick a slug following the guide. It must not match an existing file in `content/blog/` (case-insensitive).

## 3. Research

- Search the web for the keyword in Korean. Look at what currently ranks: which questions it answers and what it misses.
- Verify every changeable fact (dates, fees, rules, score policies, school or university lists) against an official or primary source (ibo.org, collegeboard.org, adiga.kr / 대교협, university admissions pages, 교육부 / 교육청, school sites).
- Keep a list: claim → source URL. If a claim can't be verified, leave it out of the post.
- Use repo data where it fits: hagwon listings in `data/hagwons.js` and `data/sat-hagwons.js`, and fees in `data/hagwon-neis.json`.

## 4. Write the post

- Create `content/blog/<slug>.mdx`, following `content/seo/guide.md` exactly (frontmatter, structure, length, internal links, CTA, tone).
- `date` is today's date in Korea time (KST).
- Only use internal links whose targets exist (`content/blog/<slug>.mdx` files, or `/find`, `/hagwons`, `/sat-hagwons`, `/hagwon-requests/new`).
- Don't edit any other file in `content/blog/`.

## 5. Sitemap

Add one entry to `public/sitemap.xml`, just before `</urlset>`. Don't run `scripts/generate-sitemap.js`, because it needs `.env.local`.

```xml
  <url>
    <loc>https://www.ibmaster.net/blog/<slug></loc>
    <lastmod>YYYY-MM-DD</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
```

## 6. Update keywords

In `content/seo/keywords.md`:
- Set the row's status to `done` and fill in the slug.
- Add 2–3 new rows with status `suggested`, just above the first `done` row. Draw them from your research (related searches, questions the ranking pages answer badly) and from gaps in existing posts. Don't add a keyword that's already in the table.

## 7. Build

Run the build with placeholder env vars if real ones aren't set:

```
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder RESEND_API_KEY=re_placeholder npm run build
```

`fetch failed` logs from Supabase are expected with placeholders. The build must exit 0, and `/blog/[slug]` must be generated. If the build fails because of the new post, fix the post and run it again.

## 8. Open the PR

- `git checkout -b blog/<slug>`, then commit only `content/blog/<slug>.mdx`, `public/sitemap.xml`, and `content/seo/keywords.md`. Commit message: `blog: add <slug>`.
- Push the branch `blog/<slug>`. If the session refuses that branch name, push to the branch the session assigned instead.
- Open a PR against `main` using the GitHub MCP tools. Title: `blog: <post title>`. Body (in English, except quoted Korean text):
  - **Keyword**: the target keyword.
  - **Title / description**: as written in the frontmatter.
  - **Internal links**: each link and its target.
  - **Sources**: each fact → source URL.
  - **New suggested keywords**: the rows you added.
  - **Unsure about**: anything you couldn't verify or that needs a human check. Write "Nothing" if there is nothing.
- Don't merge the PR.

## Never

- Push to `main`, or run `scripts/publish-blog.sh`.
- Edit existing posts, the blog template, the sitemap script, payments, database, or legal pages.
- Write more than one post per run.
- Commit `.env` files or secrets.
