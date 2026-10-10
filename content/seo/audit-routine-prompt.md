# Weekly SEO audit routine

Instructions for the scheduled routine that audits ibmaster.net for SEO once a week and opens one PR with safe fixes and a report. A human reviews and merges every PR. Never merge it yourself.

Repository: `antoinelavo/learning-react` (IBMaster, ibmaster.net). Read `CLAUDE.md` and `content/seo/guide.md` before changing anything.

## 0. Setup

- If the repository isn't in the session, attach it with `add_repo` (owner `antoinelavo`, repo `learning-react`, access `push`) and clone it.
- Before anything else, check for an open PR whose title starts with `seo-audit:`. If one exists, stop. Don't change anything or open a PR. Report "Previous audit PR still open: <link>."
- Start from the latest `main`: `git fetch origin main && git checkout -B seo-audit/YYYY-MM-DD origin/main`. Use today's date in Korea time (KST) everywhere `YYYY-MM-DD` appears.
- If `node_modules` is missing, run `npm ci`.
- Check which env vars are set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `PAGESPEED_API_KEY`. Note any missing one for the report. Never print their values.

Keep a running list of **fixes** (what you changed and why) and **weak points** (what you found but didn't fix, with severity `high` / `medium` / `low`, the page or file, and a suggested fix).

## 1. Sitemap

- If both Supabase vars are set, run `node scripts/generate-sitemap.js`. It must exit 0. If it fails, restore the file (`git checkout public/sitemap.xml`) and add a `high` weak point with the error.
- If the Supabase vars are missing, skip regeneration and say so in the report.
- Never edit `public/sitemap.xml` by hand.
- Compare the sitemap to the routes: every public page in `app/` and `pages/` (excluding admin, dashboard, auth, API, and noindex pages) and every post in `content/blog/` should be listed. Report any that are missing as a weak point. If one is missing because the script doesn't list it, suggest the script change; don't make it.

## 2. robots.txt

Read `public/robots.txt` and compare it to the routes in `app/` and `pages/`.

- **Fix:** rules for paths that don't exist (stale), public pages that are blocked by mistake, and private pages (admin, dashboard, auth flows, API) that aren't blocked. Keep the `Sitemap:` line.
- If you're unsure whether a page should be public, don't change the rule. List it under "Unsure about".

## 3. Page code

Check every public page in `app/` (its `page` file, plus any `layout` that sets metadata) and `pages/blog/[slug].js`, `pages/profile/[name].js`.

- **Metadata:** a unique `title` and `description` (Korean), a canonical URL (`alternates.canonical`; `metadataBase` is set in `app/layout.js`), and Open Graph `title`/`description`. Flag a missing or duplicate title or description, or one that is generic (e.g. only "IBMaster").
- **JSON-LD:** structured data where it fits (`Organization`/`WebSite` on the home page, `BlogPosting` on posts, `ItemList` on listing pages, `Person` or `ProfilePage` on teacher profiles, `FAQPage` where a page has a real FAQ). `app/hagwons/page.js`, `app/sat-hagwons/page.js`, and `pages/blog/[slug].js` already have some; follow their pattern.
- **Images:** `<img>` / `next/image` without a meaningful `alt`.
- **Internal links:** `href`s to paths that don't exist as routes.

**Allowed fixes:** adding or fixing `metadata` / `generateMetadata`, canonical, Open Graph, JSON-LD, `alt` text, and broken internal `href`s. Keep each change SEO-only. Don't change layout, styles, visible text (other than `alt`), data fetching, or component logic. Korean for any text a user or search engine sees.

**Off limits:** payment pages and routes (Toss, NicePay, tier/premium), legal pages (`/terms`, `/privacy-policy`, refund policy), `app/admin/`, the footer's business info, `supabase/`, and `lib/`. Report problems there as weak points.

Anything larger (a new page, new routes, a redesign, client components that should be server-rendered for SEO) goes in weak points.

## 4. Live site

Fetch every URL in `public/sitemap.xml` from `https://www.ibmaster.net` (be polite: one request at a time, a short pause between requests).

- Record the status code and any redirect. A non-200 URL is a `high` weak point. If it's a teacher profile or a blog post, say which.
- From the HTML, check the rendered `<title>`, `<meta name="description">`, `<link rel="canonical">` (it must point to the page itself on `https://www.ibmaster.net`), and `application/ld+json` blocks (valid JSON, sensible `@type`).
- Flag differences between what the code should produce and what the live page shows (the code may simply be undeployed; say so if `main` has a fix that isn't live yet).
- If the site can't be reached at all, skip this section and say so.

## 5. Blog posts

For every file in `content/blog/`, check:

- `title`: present, target keyword in the first half, under about 40 characters (see `guide.md`).
- `description`: present, 120–160 Korean characters, contains the post's keyword.
- Internal links: at least 3 links to existing posts (`/blog/<slug>`) or pages (`/find`, `/hagwons`, `/sat-hagwons`, `/hagwon-requests/new`).

**Allowed fixes (at most 5 posts per run, worst first):**

- Rewrite a missing or out-of-range `title` / `description` following `guide.md`.
- Add internal links in the body to reach 3, by linking an existing phrase or adding one short sentence such as `자세한 내용은 [IB 시험 일정](/blog/IB-exam-schedule)에서 확인하세요.` Only link to targets that exist.

**Never** change facts, other wording, headings, structure, the slug (filename), `date`, `category`, or CTA fields. List every post you didn't get to as a weak point.

## 6. PageSpeed

If `PAGESPEED_API_KEY` is set, call the PageSpeed Insights API (mobile) for each of these: `/`, `/find`, `/hagwons`, `/sat-hagwons`, `/blog`.

```
https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://www.ibmaster.net<path>&strategy=mobile&category=performance&key=$PAGESPEED_API_KEY
```

- Record the performance score (0–100) and LCP, CLS, and INP. Use field data (`loadingExperience.metrics`) for INP when present; otherwise write "no field data". Use lab data (`lighthouseResult.audits`) for LCP and CLS.
- Add the 3 biggest opportunities per page (from `lighthouseResult.audits`) as weak points. A score under 50 is `high`, and 50–89 is `medium`.
- Don't fix performance issues.
- If the key is missing or the API fails, skip this section and say so in the report. Never put the key in the report, the PR, or a commit.

## 7. Report

Write `content/seo/audits/YYYY-MM-DD.md` (English, except quoted Korean text):

```markdown
# SEO audit YYYY-MM-DD

## Summary
Two or three sentences: overall state and what changed since the last audit (compare with the previous file in content/seo/audits/, if any).

## Fixed
- <file>: <change> (<why>)

## Weak points (not fixed)
### High
- <page or file>: <problem>. Suggested fix: <fix>.
### Medium
### Low

## PageSpeed (mobile)
| Page | Score | LCP | CLS | INP |
|---|---|---|---|---|

## Skipped
- Checks that didn't run, and why (missing env var, site unreachable, API error).

## Unsure about
- Anything that needs a human check. "Nothing" if none.
```

## 8. Build

```
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder RESEND_API_KEY=re_placeholder npm run build
```

Use placeholders even if real values are set, so the build doesn't depend on them. `fetch failed` logs from Supabase are expected. The build must exit 0. If one of your fixes breaks it, revert that fix, move it to weak points, and build again.

## 9. Open the PR

- Commit only files you changed in steps 1–7. Commit message: `seo-audit: YYYY-MM-DD`.
- Push the branch `seo-audit/YYYY-MM-DD`. If the session refuses that branch name, push to the branch the session assigned instead.
- Open a PR against `main` with the GitHub MCP tools. Title: `seo-audit: YYYY-MM-DD`. Body: the report from step 7 (the Fixed list must name every changed file, and each blog post change must show the old and new `title` / `description` or the added link).
- Don't merge the PR.

## Never

- Push to `main`, or run `scripts/publish-blog.sh`.
- Touch payment code, `supabase/`, `lib/`, legal pages, the footer's business info, or the blog routine files (`content/seo/routine-prompt.md`, `guide.md`, `keywords.md`).
- Write new blog posts, or edit more than 5 posts in one run.
- Make layout, style, or performance changes.
- Commit `.env` files or secrets, or print env var values.
