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
- Compare the sitemap to the routes: every public page in `app/` and `pages/` (excluding admin, dashboard, auth, API, noindex pages, and everything under `/community`, which has its own sitemap; see step 5) and every post in `content/blog/` should be listed. Report any that are missing as a weak point. If one is missing because the script doesn't list it, suggest the script change; don't make it.

## 2. robots.txt

Read `public/robots.txt` and compare it to the routes in `app/` and `pages/`.

- **Fix:** rules for paths that don't exist (stale), public pages that are blocked by mistake, and private pages (admin, dashboard, auth flows, API, and the private community pages listed in step 5) that aren't blocked. Keep both `Sitemap:` lines (`/sitemap.xml` and `/community/sitemap.xml`).
- If you're unsure whether a page should be public, don't change the rule. List it under "Unsure about".

## 3. Page code

Check every public page in `app/` (its `page` file, plus any `layout` that sets metadata) and `pages/blog/[slug].js`, `pages/profile/[name].js`.

- **Metadata:** a unique `title` and `description` (Korean), a canonical URL (`alternates.canonical`; `metadataBase` is set in `app/layout.js`), and Open Graph `title`/`description`. Flag a missing or duplicate title or description, or one that is generic (e.g. only "IBMaster").
- **JSON-LD:** structured data where it fits (`Organization`/`WebSite` on the home page, `BlogPosting` on posts, `ItemList` on listing pages, `Person` or `ProfilePage` on teacher profiles, `FAQPage` where a page has a real FAQ). `app/hagwons/page.js`, `app/sat-hagwons/page.js`, and `pages/blog/[slug].js` already have some; follow their pattern.
- **Images:** `<img>` / `next/image` without a meaningful `alt`.
- **Internal links:** `href`s to paths that don't exist as routes.

**Allowed fixes:** adding or fixing `metadata` / `generateMetadata`, canonical, Open Graph, JSON-LD, `alt` text, and broken internal `href`s. Keep each change SEO-only. Don't change layout, styles, visible text (other than `alt`), data fetching, or component logic. Korean for any text a user or search engine sees.

Community page files under `app/community/` follow the same rules; step 5 covers what to check there.

**Off limits:** payment pages and routes (Toss, NicePay, tier/premium), legal pages (`/terms`, `/privacy-policy`, refund policy), `app/admin/`, the footer's business info, `supabase/`, and `lib/`. Report problems there as weak points.

Anything larger (a new page, new routes, a redesign, client components that should be server-rendered for SEO) goes in weak points.

## 4. Live site

Fetch every URL in `public/sitemap.xml` and in the live `https://www.ibmaster.net/community/sitemap.xml` from `https://www.ibmaster.net` (be polite: one request at a time, a short pause between requests).

- Record the status code and any redirect. A non-200 URL is a `high` weak point. If it's a teacher profile or a blog post, say which.
- From the HTML, check the rendered `<title>`, `<meta name="description">`, `<link rel="canonical">` (it must point to the page itself on `https://www.ibmaster.net`), and `application/ld+json` blocks (valid JSON, sensible `@type`).
- Flag differences between what the code should produce and what the live page shows (the code may simply be undeployed; say so if `main` has a fix that isn't live yet).
- If the site can't be reached at all, skip this section and say so.

## 5. Community

The community board (`/community`) is user-generated content stored in Supabase. Read `CLAUDE.md`'s "Community board" section first. This step only **reads** community data: never insert, update, publish or delete posts, comments or drafts, and never use a service-role key.

### Sitemap

- Fetch `https://www.ibmaster.net/community/sitemap.xml`. It must return 200 with valid XML (`<urlset>` of `<url><loc>`). Otherwise it's a `high` weak point.
- It must list `https://www.ibmaster.net/community` plus one `/community/post/<url-encoded slug>` per live post.
- If both Supabase vars are set, read the live posts from the public view (anon key, read-only):

  ```
  curl -sS "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/community_posts_public?select=slug,title,content,is_anonymous,author_username,teacher_name,comment_count" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ```

  (Paginate with `&limit=1000&offset=N` if there are 1000 or more.) Compare the slugs, URL-decoded, with the sitemap. A live post missing from the sitemap, or a sitemap URL that isn't a live post, is a `high` weak point. The sitemap is cached at the CDN for an hour, so a post created in the last hour may legitimately be missing; say so instead of flagging it.
- If the Supabase vars are missing, skip the comparison and say so.

### Live pages

For `/community` and every post URL in the community sitemap (these are also covered by step 4; record the community results here):

- Status 200, a post-specific `<title>`, a `<meta name="description">`, and a canonical pointing to the post's own URL.
- Post pages have exactly one `DiscussionForumPosting` JSON-LD block that parses as JSON, with `headline`, `author`, `datePublished`, and `text` or `articleBody`. If the post's `comment_count` is above 0, it has a `comment` array.

### 404 spot check

- Fetch `/community/post/seo-audit-missing-<random 8 characters>`. It must return HTTP 404. A 200 here is a `high` weak point (a `loading.jsx` above the post page forces 200s; see `CLAUDE.md`).

### Private pages

- `/community/me`, `/community/post/new`, and `/community/post/<slug>/edit` must not be indexable: either `robots: { index: false }` in their metadata or blocked in `public/robots.txt`. They must not appear in either sitemap.
- **Fix:** add the `robots.txt` `Disallow:` rules, or `robots: { index: false }` in those pages' metadata. Pick one per page and say which.

### Anonymity

- For every live post with `is_anonymous = true`, the HTML and JSON-LD must not contain a real author: no `author_username` or `teacher_name` value from any source, and no `user_id`. The author should be the anonymous label.
- The public view hides real authors for anonymous posts, so you can only detect leaks of fields the view returns. Also check that the JSON-LD and HTML of anonymous comments show only 익명N labels.
- Any leak is a `high` weak point at the top of the report. **Don't try to fix it.** The code is in `lib/` and the API routes, which are off limits. Report it so the owner can act.

### Thin posts

- List live posts whose title is under 10 characters, whose body is under 300 characters, or whose page has no description, as `low` weak points with a one-line suggestion (for example, a more specific title).
- **Never** edit post content. It lives in the database, and the routine doesn't write to it.

### Allowed fixes

SEO-only changes in `app/community/` page and layout files: `metadata` / `generateMetadata`, canonical, Open Graph, `robots`, and JSON-LD fields built from data the page already loads. Same rules as step 3: no layout, style, visible-text, data-fetching, or component-logic changes.

**Off limits:** community API routes (`app/api/community/`), `lib/community*.js`, `lib/communityAuth.js`, the community sitemap route's query (`app/community/sitemap.xml/route.js`), auth, and the database. Report problems there as weak points.

## 6. Blog posts

For every file in `content/blog/`, check:

- `title`: present, target keyword in the first half, under about 40 characters (see `guide.md`).
- `description`: present, 120–160 Korean characters, contains the post's keyword.
- Internal links: at least 3 links to existing posts (`/blog/<slug>`) or pages (`/find`, `/hagwons`, `/sat-hagwons`, `/hagwon-requests/new`).

**Allowed fixes (at most 5 posts per run, worst first):**

- Rewrite a missing or out-of-range `title` / `description` following `guide.md`.
- Add internal links in the body to reach 3, by linking an existing phrase or adding one short sentence such as `자세한 내용은 [IB 시험 일정](/blog/IB-exam-schedule)에서 확인하세요.` Only link to targets that exist.

**Never** change facts, other wording, headings, structure, the slug (filename), `date`, `category`, or CTA fields. List every post you didn't get to as a weak point.

## 7. PageSpeed

If `PAGESPEED_API_KEY` is set, call the PageSpeed Insights API (mobile) for each of these: `/`, `/find`, `/hagwons`, `/sat-hagwons`, `/blog`.

```
https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://www.ibmaster.net<path>&strategy=mobile&category=performance&key=$PAGESPEED_API_KEY
```

- Record the performance score (0–100) and LCP, CLS, and INP. Use field data (`loadingExperience.metrics`) for INP when present; otherwise write "no field data". Use lab data (`lighthouseResult.audits`) for LCP and CLS.
- Add the 3 biggest opportunities per page (from `lighthouseResult.audits`) as weak points. A score under 50 is `high`, and 50–89 is `medium`.
- Don't fix performance issues.
- If the key is missing or the API fails, skip this section and say so in the report. Never put the key in the report, the PR, or a commit.

## 8. Report

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

## Community
- Community sitemap: <N> URLs (<N> posts). Live posts in the public view: <N>.
- Sitemap vs. live posts: <match / differences>.
- Live pages: <N> checked, <N> with problems.
- 404 spot check: <status>.
- Private pages: <indexable or not, per page>.
- Anonymity: <N> anonymous posts checked, <leaks or "no leaks">.
- Thin posts: <N> (listed under Weak points).

## PageSpeed (mobile)
| Page | Score | LCP | CLS | INP |
|---|---|---|---|---|

## Skipped
- Checks that didn't run, and why (missing env var, site unreachable, API error).

## Unsure about
- Anything that needs a human check. "Nothing" if none.
```

## 9. Build

```
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder RESEND_API_KEY=re_placeholder npm run build
```

Use placeholders even if real values are set, so the build doesn't depend on them. `fetch failed` logs from Supabase are expected. The build must exit 0. If one of your fixes breaks it, revert that fix, move it to weak points, and build again.

## 10. Open the PR

- Commit only files you changed in steps 1–8. Commit message: `seo-audit: YYYY-MM-DD`.
- Push the branch `seo-audit/YYYY-MM-DD`. If the session refuses that branch name, push to the branch the session assigned instead.
- Open a PR against `main` with the GitHub MCP tools. Title: `seo-audit: YYYY-MM-DD`. Body: the report from step 8 (the Fixed list must name every changed file, and each blog post change must show the old and new `title` / `description` or the added link).
- Don't merge the PR.

## Never

- Push to `main`, or run `scripts/publish-blog.sh`.
- Write to the database (community posts, comments, drafts, or anything else), or use a service-role key.
- Touch payment code, `supabase/`, `lib/`, community API routes, legal pages, the footer's business info, or the blog routine files (`content/seo/routine-prompt.md`, `guide.md`, `keywords.md`).
- Write new blog posts, or edit more than 5 posts in one run.
- Make layout, style, or performance changes.
- Commit `.env` files or secrets, or print env var values.
