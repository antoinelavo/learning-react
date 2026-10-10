# Spec: Weekly SEO blog post routine

## Goal
A scheduled Claude Code routine writes one SEO-focused, fact-checked blog post a week for a target keyword and opens a PR for review, so the blog grows steadily with posts useful to IB/SAT students and parents.

## Included
- **Guide** `content/seo/guide.md`: written from the best existing posts in `content/blog/`. Covers tone (Korean, 존댓말), length, title and `description` patterns (keyword near the front, description ~120–160 chars), heading structure, internal links (at least 3 to existing posts or pages like `/hagwons`, `/sat-hagwons`, `/find`), CTA fields (`ctaDescription`, `ctaLabel`, `ctaLink`), categories (`IB`, `SAT`, `특례입학`), and slug format (lowercase English kebab-case).
- **Keyword list** `content/seo/keywords.md`: a table of keyword, category, status (`planned` / `done` / `suggested`), and post slug. Seeded with the keywords existing posts already cover (marked `done`) and a starter set of `planned` keywords for you to approve.
- **Routine prompt** `content/seo/routine-prompt.md`: the full set of instructions each run follows (see Rules).
- **Routine:** a Claude Code routine that runs weekly on Monday at 9am KST, starts a fresh session each time on this repo, and points to `routine-prompt.md`.

## Not included
- New page types or routes. Posts only.
- Editing or refreshing existing posts or pages.
- Auto-merging or publishing. A human merges every PR.
- Changes to the blog template, sitemap script, or `publish-blog.sh`.
- Images for posts.

## Rules
- **Each run:**
  1. Pick the first `planned` keyword. If there is none, stop and open no PR.
  2. Check that no existing post already targets that keyword. If one does, mark the keyword `done` with that slug, skip it, and move to the next one.
  3. Research facts on official sources (IBO, College Board, 대교협, university and school sites). Leave out any claim it can't verify.
  4. Write one `content/blog/<slug>.mdx` following the guide, with `date` set to the run date.
  5. Add one `<url>` entry for the post to `public/sitemap.xml` by hand. Don't run the sitemap script, because it needs `.env.local`.
  6. Mark the keyword `done` with the slug, and add 2–3 new `suggested` keywords drawn from research and gaps in existing posts.
  7. Run `npm run build` (with placeholder Supabase env vars if no real ones are set). The build must pass.
  8. Push a `blog/<slug>` branch and open a PR.
- **PR body:** the target keyword, title and description, the internal links used, the source URLs for each fact, the new suggested keywords, and anything it was unsure about.
- `suggested` keywords are used only after you change them to `planned`.
- Never push to `main` or run `scripts/publish-blog.sh`.
- Site text is Korean. Branch names, slugs, and commit messages are English.
- No payments, database, or legal-page changes.
- **Ask before changing (blog posts):** the user approved automated new posts in `content/blog/`, as long as each one goes through a PR. The routine never edits existing posts.

## Done when
- [x] `content/seo/guide.md`, `keywords.md`, and `routine-prompt.md` exist and follow the rules above.
- [x] `keywords.md` lists every existing post's keyword as `done` and has at least 10 `planned` keywords.
- [x] Nothing new under `content/blog/` is picked up as a post (no non-post files added there).
- [x] The routine exists, is enabled, runs weekly on Monday at 9am KST, and its prompt points to `routine-prompt.md`.
- [x] One test run (fired manually) opens a PR with a valid new MDX post, a sitemap entry, keyword updates, and sources in the PR body.
- [x] `npm run build` passes.
