# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

IBMaster (ibmaster.net): a Korean site for finding IB/SAT tutors and hagwons, with a blog, chat, and paid teacher listings.

## Stack

- Next.js 15, React 19, plain JavaScript (no TypeScript). Tailwind CSS 3.
- Both routers are in use. Most pages and all real API routes are in `app/`. The blog post page (`pages/blog/[slug].js`) and teacher profile page (`pages/profile/[name].js`) are still in `pages/`. `pages/api/hello.js` is leftover boilerplate.
- `next.config.js` sets `pageExtensions: ['js', 'jsx']`, so only `.js`/`.jsx` files become routes (a `.ts` or `.mdx` page file is ignored).
- Supabase for auth and database. The shared client is in `lib/supabase.js`. File storage is Cloudflare R2 via `@aws-sdk/client-s3` (`app/api/upload-profile-picture`), not Supabase storage.
- PortOne V2 for card payments (KG이니시스 channel; 카카오페이 appears when `NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY` is set). Server helpers in `lib/portone.js`, browser checkout in `lib/portoneCheckout.js`. Toss and NicePay were removed; old rows keep their `toss_*` / `order_id` columns as history.
- Resend for email (templates in `lib/email/`). Hosted on Vercel.
- Import paths use the `@/` alias for the repo root.

## Commands

- `npm run dev` starts the dev server on port 3000.
- `npm run build` is the main check. There are no tests and no ESLint config (`npm run lint` is not set up). The build needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`lib/supabase.js` throws at import without them) and `RESEND_API_KEY` (the Resend client throws at import). Dummy values are enough for a local build.
- `ANALYZE=true npm run build` opens the bundle analyzer.
- `node scripts/generate-sitemap.js` rebuilds `public/sitemap.xml`. It needs `.env.local`.

## Architecture

- **One Supabase client everywhere.** `lib/supabase.js` uses the anon key only; there is no service-role client, even in API routes. Server-side writes therefore depend on RLS policies and on Postgres RPCs (`activate_plus_tier`, `reveal_student_job`, `get_or_create_conversation`, etc.) defined in `supabase/migrations/`. If a write fails silently, check RLS first.
- **Auth and chat state** live in React contexts (`contexts/AuthContext.jsx`, `contexts/ChatContext.jsx`), wired up in `components/Providers.client.jsx`. Chat data access is in `lib/chat/chatClient.js`.
- **Payments are idempotent by design.** The client inserts a pending row keyed by `portone_payment_id`, then opens PortOne. `app/api/portone/complete` (premium listings) and `tier-complete` (플러스) handle the return from both the PC popup and the mobile redirect, and `app/api/portone/webhook` (signature-verified) is the backstop. All three go through `lib/portoneOrders.js`, which re-fetches the payment from PortOne, checks the amount against server-side prices (`premiumPrice`, `PLUS_TIER_AMOUNT`), then calls the activation function (`lib/premiumActivation.js`, `lib/tierActivation.js`), which only activates once. Keep those guards if you touch these.
- **Refunds:** admins refund card payments from `/admin/payments` and `/admin/plus-payments` via `app/api/portone/refund` (`lib/refunds.js`), which claims the row (`paid → refunded`, or `payment_request.refunded_at`) before cancelling at PortOne.
- **Teacher tiers:** 플러스 teachers get unlimited reveals of student request contacts; free teachers get 2 per rolling 30 days. The limit is enforced in the `reveal_student_job` RPC; `lib/reveal.js` is only a client wrapper.
- **Blog** is MDX files in `content/blog/`, read from disk at build time by `pages/blog/[slug].js` (`getStaticPaths`/`getStaticProps`). The index is `app/blog/page.jsx`.
- **Teacher profiles** are ISR (`revalidate: 60`, `fallback: 'blocking'`) from the Supabase teachers table.
- **Test teachers:** rows with `teachers.is_test = true` are excluded from `/find` (`app/find/TeacherList.jsx`) and from profile pages. Keep that filter on any new public teacher query.
- **Hagwon listings** are static data in `data/` (`hagwons.js`, `sat-hagwons.js`), not the database.
- **Hagwon fees** come from a committed NEIS snapshot, `data/hagwon-neis.json`, keyed by each listing's `neis.id`. Rebuild it with `NODE_USE_ENV_PROXY=1 node scripts/update-hagwon-neis.mjs` (needs `NEIS_API_KEY` in `.env.local`). Fees come from the hakwon.neis.go.kr search site because the official open API has none for 학원. Pages read the snapshot at build time only (`lib/hagwonNeis.js`).
- **Cron:** `app/api/cron/daily-digest` requires `Authorization: Bearer $CRON_SECRET`. `vercel.json` is empty, so the schedule is configured outside this repo.
- **Subscriber emails** (`daily-digest`, `notify-subscribers`): if `TEST_OVERRIDE_EMAIL` is set, every recipient is replaced with that address.
- **Roles:** user role is `users.role`; teacher approval state is `teachers.status` (helpers `getUserRole`/`getTeacherStatus` in `lib/supabase.js`).
- Component filenames ending in `.client.jsx` / `.server.jsx` mark client vs. server components.
- Features are planned in `SPEC.md` (written via `/spec`, implemented via `/build`).
- `TODO.md` tracks planned work (community board launch, moderation, unsubscribe flows).

## Rules

- Always work on a branch and open a pull request. Never push to `main`.
- Do not run `scripts/publish-blog.sh`. It pushes straight to `main`.
- Site text is Korean. Code, comments, names, and commit messages are English.
- Never commit `.env` files or secrets.

## Ask before changing

- Payment code: PortOne routes, `lib/portone*.js`, `lib/refunds.js`, tier and premium activation, and prices.
- Database: anything in `supabase/migrations/`, schema, or RLS policies. New migrations are run by hand in the Supabase dashboard.
- Blog posts in `content/blog/`.
- Legal pages (terms, privacy, refund policy) and the footer's business info.
