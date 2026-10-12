# Spec: Community section in the SEO audit routine

## Goal
The weekly SEO audit also checks the community board (`/community`, its dynamic sitemap and its posts), so community pages stay indexable and correct alongside the rest of the site.

## Included
- **`content/seo/audit-routine-prompt.md`**, a new community step plus updates to existing steps:
  - **Community sitemap:** fetch `https://www.ibmaster.net/community/sitemap.xml`. Check it returns 200 with valid XML. If the Supabase vars are set, compare its post slugs with `community_posts_public` (anon key, read-only) to confirm every live post is listed and that it contains nothing else (no drafts, deleted or missing posts).
  - **Live community pages:** fetch `/community` and every post URL in that sitemap, checking status code, title, description, canonical, and the `DiscussionForumPosting` JSON-LD (valid JSON, headline, author, date, and comments when the post has any).
  - **404 spot check:** `/community/post/<random nonexistent slug>` returns HTTP 404, not 200.
  - **Private pages:** `/community/me`, `/community/post/new` and `/community/post/<slug>/edit` are `noindex` or blocked in `robots.txt`, and are not in either sitemap.
  - **Anonymity check:** for anonymous posts, the HTML and JSON-LD contain no real author name or `user_id`. Any leak is a `high` weak point, reported only (no fix attempted by the routine).
  - **Thin posts:** list live posts with a very short title or body, or no description, as `low` weak points with a suggested improvement. Never edit post content.
  - **robots.txt (step 2):** keep both `Sitemap:` lines, and check the community private routes.
  - **Live site (step 4):** cover both sitemaps.
  - **Report:** a `## Community` section with sitemap URL count, live post count, and the checks above.
- **Allowed community fixes:** SEO-only changes in `app/community/` page files (`metadata` / `generateMetadata`, canonical, Open Graph, `robots`, JSON-LD), following the same rules as other page code.
- **`CLAUDE.md`:** update the audit routine line to mention the community checks.

## Not included
- Editing, publishing, or deleting community posts or comments (database content), or creating drafts.
- Changes to community API routes, `lib/community*.js`, `lib/communityAuth.js`, auth, the community sitemap route's query logic, or the database.
- Changes to the blog routine, the static sitemap script, or the routine's schedule.

## Rules
- The routine only reads community data, through the public view with the anon key. No service-role key.
- Community pages must never expose `user_id` or real author names for anonymous content. Any fix keeps the existing public labeling (익명N).
- Draft posts must never appear in a sitemap, page, or the report's URL lists. Report only counts for drafts if visible at all (they shouldn't be).
- Off-limits areas stay as in the existing prompt. No "Ask before changing" areas are touched.

## Done when
- [x] `content/seo/audit-routine-prompt.md` covers every community check above, both sitemaps in the live-site step, and a `## Community` report section.
- [x] The prompt lists the allowed community fixes and the community off-limits files.
- [x] Every community check is runnable from this environment: the community sitemap fetch, the post-page fetch, the 404 spot check, and the public-view query all succeed when run by hand once.
- [x] `CLAUDE.md` mentions the community checks.
- [x] `npm run build` passes.
