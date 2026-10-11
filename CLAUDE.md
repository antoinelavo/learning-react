# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

IBMaster (ibmaster.net): a Korean site for finding IB/SAT tutors and hagwons, with a blog, chat, and paid teacher listings.

## Stack

- Next.js 15, React 19, plain JavaScript (no TypeScript). Tailwind CSS 3.
- Both routers are in use. Most pages and all real API routes are in `app/`. The blog post page (`pages/blog/[slug].js`) and teacher profile page (`pages/profile/[name].js`) are still in `pages/`. `README.md` is unedited create-next-app boilerplate.
- `next.config.js` sets `pageExtensions: ['js', 'jsx']`, so only `.js`/`.jsx` files become routes (a `.ts` or `.mdx` page file is ignored). Under `npm run dev` and on Vercel preview deployments (`VERCEL_ENV=preview`) it also adds `dev.jsx`, so `page.dev.jsx` routes (the community seed preview, `/community/preview`, linked from `/admin`) never exist on the production site. Every `.js` file under `pages/` is a route, so `pages/profile/ContactButton.js` is also served at `/profile/ContactButton`; put new shared components in `components/`.
- Both `postcss.config.js` and `postcss.config.mjs` exist with identical content; edit both or remove one.
- **Admin pages** (`app/admin/`) check `role === 'admin'` on the client only (via `useAuth`). Real protection comes from RLS (`is_admin()` policies) and from `getAdminFromRequest` in admin API routes, which the admin pages call through `authFetch` (`lib/authFetch.js`, sends the session as a Bearer token).
- Supabase for auth and database. The shared client is in `lib/supabase.js`. File storage is Cloudflare R2 via `@aws-sdk/client-s3` (`app/api/upload-profile-picture`), not Supabase storage.
- Toss Payments for payments (`lib/toss.js`). NicePay is legacy and can be removed if it gets in the way.
- Resend for email (templates in `lib/email/`). Hosted on Vercel.
- Import paths use the `@/` alias for the repo root.
- UI uses the shared kit in `components/ui` (`Button`/`buttonClasses`, `chipClasses`, `Tabs`, `Input`/`Select`/`Textarea`, `cardClasses`, `Badge`, `Notice`). Match `/find` and `/hagwons`: real buttons for actions (no text links styled as actions, no arrow glyphs in labels), page shell `max-w-3xl mx-auto px-4 py-4`. On the community post page, back is a top-left `<` icon button (`components/community/BackButton.client.jsx`).

## Commands

- `npm run dev` starts the dev server on port 3000.
- `npm run build` is the main check. There are no tests and no ESLint config (`package.json` has a `lint` script, but with no config `next lint` only starts an interactive setup prompt, so don't use it as a check). The build needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `RESEND_API_KEY` (`lib/supabase.js` and the Resend client throw at import without them). Placeholder values are enough for a build check; Supabase `fetch failed` logs are then expected.
- **SEO blog routine:** a weekly Claude Code routine follows `content/seo/routine-prompt.md`, takes the next `planned` keyword from `content/seo/keywords.md`, writes one post per `content/seo/guide.md`, and opens a PR.
- **Security audit routine:** a monthly routine (10th, ~9am KST) follows `content/security/audit-routine-prompt.md`: read-only checks of Supabase RLS/grants/functions (via the Supabase connector), API route auth, secrets, `npm audit`, and live-site headers. Opens a `security-audit:` PR with a report in `content/security/audits/` and any proposed SQL as a new migration file (never run by the routine).
- **SEO audit routine:** a weekly routine (Thursday 9am KST) follows `content/seo/audit-routine-prompt.md`: regenerates the sitemap, fixes SEO-only issues (metadata, JSON-LD, `robots.txt`, up to 5 blog posts' frontmatter and internal links), and opens a `seo-audit:` PR. Reports go in `content/seo/audits/`. Needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `PAGESPEED_API_KEY` in the routine's environment.
- `ANALYZE=true npm run build` opens the bundle analyzer.
- `node scripts/community-seed.mjs <n>` publishes seed post `n` from `content/community-seed/` as the `Admin` user (writes to the DB in `.env.local`; needs `SUPABASE_SERVICE_ROLE_KEY`). Preview it first at `/community/preview/<n>` under `npm run dev` or on the PR's Vercel preview.
- `node scripts/generate-sitemap.js` rebuilds `public/sitemap.xml`. It reads the Supabase URL and anon key from the environment or `.env.local`, and exits non-zero (without writing) if the teacher fetch fails.

## Architecture

- **Supabase clients.** Browser code and pages use the anon client in `lib/supabase.js` (`pages/profile/ContactButton.js` creates its own anon client). API routes that run without a user session (Toss/NicePay, cron, notify emails, dashboard stats, admin routes) use the service-role client from `getSupabaseAdmin()` in `lib/supabaseAdmin.js`, which needs `SUPABASE_SERVICE_ROLE_KEY`. Never import it from client code. Community routes use `supabaseAdmin` (the same client, as a lazy proxy) after verifying the caller via `lib/communityAuth.js`. `lib/premiumActivation.js` and `lib/tierActivation.js` take a `db` argument: server routes pass the admin client, the admin pages use the default (admin session + RLS).
- **RLS baseline** is `supabase/migrations/20261011_security_rls.sql`. Every table has RLS. Column grants hide `student_jobs`/`hagwon_requests` `email`, `kakao_contact`, `edit_password_hash` and `teachers` bank details, `student_id_number`, `email` from anon/authenticated, so `select('*')` on those tables fails for normal users: use `lib/teacherColumns.js` / `lib/requestColumns.js`. Private fields come from RPCs: `get_student_job_contact` (after `reveal_student_job`), `get_hagwon_request_contact` (hagwon accounts), `get_student_job_for_edit` and `update_*_with_password` (password edits), `get_my_teacher_profile`, `admin_list_teachers`. Triggers `protect_user_columns` / `protect_teacher_columns` stop users changing their own role, tier, reveal counters or approval status. If a write fails silently, check RLS first.
- **No server-side session.** There is no cookie or SSR auth helper and no `middleware.js`. `supabase.auth.getUser()` on the shared client inside an API route has no session, so it returns no user. A route that needs the user must receive the access token from the client and verify it: `lib/authFetch.js` + `getUserFromRequest`/`getAdminFromRequest` in `lib/supabaseAdmin.js`, or for community routes `communityAuthHeaders` (`lib/communityClient.js`) + `getCommunityUser`/`requireCommunityWriter`/`requireAdminUser` (`lib/communityAuth.js`).
- **Auth and chat state** live in React contexts (`contexts/AuthContext.jsx`, `contexts/ChatContext.jsx`), wired up in `components/Providers.client.jsx`. Chat data access is in `lib/chat/chatClient.js`.
- **Payments are idempotent by design.** Each purchase type has a success route and a webhook (`app/api/toss/success|webhook` for premium listings, `tier-success|tier-webhook` for the 플러스 tier). Both call the same activation function (`lib/premiumActivation.js`, `lib/tierActivation.js`), which only flips a `payments` row from `pending` to `paid` once. Keep that guard if you touch these.
- **Teacher tiers and reveals:** teachers browse student requests (`student_jobs`) and "reveal" contact info. Free tier gets 2 reveals per rolling 30 days; 플러스 is unlimited. The limit is enforced only in the `reveal_student_job` RPC (latest version in `20261011_security_rls.sql`, which also checks the caller owns the teacher id); `lib/reveal.js` is a client wrapper and its remaining-count is display-only.
- **Request boards:** `/students` (`student_jobs`, views in `student_job_views`) is the board teachers reveal from; `/hagwon-requests` (`hagwon_requests`, `hagwon_request_views`) is the hagwon equivalent. Both query Supabase directly from client components.
- **Community board** (`/community`, Naver-cafe style) is in the nav but not yet in the sitemap (remaining launch steps in `TODO.md`).
  - Tables are `community_*`. Base tables have RLS on with no policies, so clients can't touch them; all reads and writes go through API routes with `supabaseAdmin`. The one public read path is the `community_posts_public` view (no `user_id`, hides deleted posts), which the feed and post page query with the anon key (`lib/communityFeed.js`, `lib/communityPost.js`).
  - Every write route calls `requireCommunityWriter`, which returns 401 without a token and 403 when the user is banned (`community_bans`, a service-role-only table) or has no username.
  - Anonymous posts and comments must never expose `user_id` or the real author in public responses; only `/api/admin/community/*` returns real authors. Anonymous comment labels (익명1, 익명2…) come from `lib/communityAnon.js`.
  - Board categories, page size and category validation live in `lib/community.js`, which client and server code both import. It has no Supabase or Node imports, so keep it that way.
  - Deletes are soft (`deleted_at`, plus `deleted_by_admin` for admin removals). Post markdown is rendered with `lib/communityMarkdown.js`, which drops raw HTML and unsafe link schemes.
  - `/blog` has its own list component (`app/blog/BlogBoard.client.jsx`); it no longer shares the community board.
- **Blog** is MDX files in `content/blog/`, read from disk at build time by `pages/blog/[slug].js` (`getStaticPaths`/`getStaticProps`). The index is `app/blog/page.jsx`.
- **Teacher profiles** are ISR (`revalidate: 60`, `fallback: 'blocking'`) from the Supabase teachers table.
- **Test teachers:** rows with `teachers.is_test = true` are excluded from `/find` (`app/find/TeacherList.jsx`) and from profile pages. Keep that filter on any new public teacher query.
- **Hagwon listings** are static data in `data/` (`hagwons.js`, `sat-hagwons.js`), not the database.
- **Hagwon fees** come from a committed NEIS snapshot, `data/hagwon-neis.json`, keyed by each listing's `neis.id`. Rebuild it with `NODE_USE_ENV_PROXY=1 node scripts/update-hagwon-neis.mjs` (needs `NEIS_API_KEY` in `.env.local`). Fees come from the hakwon.neis.go.kr search site because the official open API has none for 학원. Pages read the snapshot at build time only (`lib/hagwonNeis.js`).
- **Cron:** `app/api/cron/daily-digest` requires `Authorization: Bearer $CRON_SECRET`. `vercel.json` is empty, so the schedule is configured outside this repo.
- **Subscriber emails** (`daily-digest`, `notify-subscribers`): if `TEST_OVERRIDE_EMAIL` is set, every recipient is replaced with that address.
- **Roles:** user role is `users.role`; teacher approval state is `teachers.status` (helpers `getUserRole`/`getTeacherStatus` in `lib/supabase.js`).
- **Onboarding:** OAuth sign-ups (Kakao/Google) get a `users` row with no `role` or `username` (`handle_new_user` trigger). `components/OnboardingGate.client.jsx`, mounted in `Providers`, shows a blocking modal on every page except the auth flow pages until both are set. It waits for `profileLoaded` from `AuthContext`, so a failed profile query doesn't trigger it.
- Component filenames ending in `.client.jsx` / `.server.jsx` mark client vs. server components.
- Features are planned in `SPEC.md` (written via `/spec`, implemented via `/build`).
- `TODO.md` tracks planned work (community board launch checklist, unsubscribe flows).

## Rules

- Always work on a branch and open a pull request. Never push to `main`.
- Do not run `scripts/publish-blog.sh`. It pushes straight to `main`.
- Site text is Korean. Code, comments, names, and commit messages are English.
- Never commit `.env` files or secrets.

## Ask before changing

- Payment code: Toss routes, `lib/toss.js`, tier and premium activation, and prices.
- Database: anything in `supabase/migrations/`, schema, or RLS policies. New migrations are run by hand in the Supabase dashboard.
- Blog posts in `content/blog/`.
- Legal pages (terms, privacy, refund policy) and the footer's business info.
