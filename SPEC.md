# Spec: Weekly SEO audit routine

## Goal
A scheduled Claude Code routine audits ibmaster.net for SEO every week. Each run opens one PR that applies safe fixes and lists the bigger weak points in the PR body for a human to act on.

## Included
- **Routine prompt** `content/seo/audit-routine-prompt.md`: the full instructions each run follows (see Rules).
- **Sitemap script change** `scripts/generate-sitemap.js`: read `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `process.env`, falling back to `.env.local` when it exists (no crash if the file is missing).
- **Routine:** a Claude Code routine that runs weekly on Thursday at 9am KST in a fresh session on this repo and follows `audit-routine-prompt.md`.
- **Checks each run:**
  - Sitemap: regenerated with the script. Flags URLs that return non-200 or are missing from the sitemap.
  - `robots.txt`: stale rules (paths that don't exist), public routes accidentally blocked, private routes not blocked.
  - Code: pages missing or with weak `metadata` (title, description, canonical, Open Graph), missing JSON-LD where it fits, images without `alt`, broken internal links.
  - Live site: fetches every sitemap URL for status codes, redirects, rendered title, description, canonical, and JSON-LD.
  - Blog posts: missing, too short, or too long `title`/`description`, and posts with fewer than 3 internal links.
  - PageSpeed (mobile) for `/`, `/find`, `/hagwons`, `/sat-hagwons`, `/blog`: performance score plus LCP, CLS, and INP.
- **CLAUDE.md:** one line describing the audit routine next to the existing blog routine line.

## Not included
- Google Search Console and Analytics (can be added later through a connector).
- Performance fixes. PageSpeed results are reported only.
- Layout or visual changes, and edits to payment, legal, or admin pages.
- Changes to the weekly blog routine.
- Auto-merging. A human merges every PR.

## Rules
- **Each run:**
  - Starts from the latest `main` and works on a branch `seo-audit/YYYY-MM-DD`.
  - If an open PR whose title starts with `seo-audit:` already exists, stop and report it. Don't open a second one.
  - Opens one PR titled `seo-audit: YYYY-MM-DD` with:
    - **Fixed:** each change and why.
    - **Weak points (not fixed):** grouped by severity, each with a page or file and a suggested fix.
    - **PageSpeed:** a table of score, LCP, CLS, and INP per page.
    - **Unsure about:** anything that needs a human check.
  - Always commits the report to `content/seo/audits/YYYY-MM-DD.md`, so past audits stay in the repo and a run with no fixes still has a PR.
  - Runs `npm run build` with placeholder env vars, which must exit 0 before the PR is opened.
- **Allowed fixes:** `public/sitemap.xml` (only via the script), `public/robots.txt`, SEO-only page code (`metadata`, canonical, JSON-LD, `alt`), and blog posts (see below).
- **Blog posts (an "ask before changing" area, approved here):** may edit frontmatter `title`/`description` and add internal links in post bodies. Facts, wording, and structure stay untouched, and the slug and `date` never change. At most 5 posts per run, and each change is listed in the PR.
- **Never:** push to `main`, run `scripts/publish-blog.sh`, touch payments, `supabase/`, legal pages, or the footer's business info, or commit secrets.
- **Environment variables the routine needs** (set by the user in the routine's environment): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `PAGESPEED_API_KEY`. If `PAGESPEED_API_KEY` is missing or PageSpeed fails, skip that section and say so in the report. If the Supabase vars are missing, skip sitemap regeneration and say so.
- Site text stays Korean, and the PR body and report are in English.

## Done when
- [x] `content/seo/audit-routine-prompt.md` exists and covers every check and rule above.
- [x] `node scripts/generate-sitemap.js` works with env vars set in the shell and no `.env.local`, and still works with `.env.local`.
- [x] A routine exists that runs Thursday at 9am KST in a fresh session, pointing to the prompt.
- [x] `CLAUDE.md` mentions the audit routine.
- [x] `npm run build` passes.
