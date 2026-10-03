# CLAUDE.md

IBMaster (ibmaster.net): a Korean site for finding IB/SAT tutors and hagwons, with a blog, chat, and paid teacher listings.

## Stack

- Next.js 15, React 19, plain JavaScript (no TypeScript). Tailwind CSS 3.
- Both routers are in use. Most pages and all API routes are in `app/`. The blog post page and teacher profile page are still in `pages/`.
- Supabase for auth, database, and storage. The shared client is in `lib/supabase.js`.
- Toss Payments for payments (`lib/toss.js`). NicePay is legacy and can be removed if it gets in the way.
- Resend for email. Hosted on Vercel.
- Import paths use the `@/` alias for the repo root.

## Commands

- `npm run dev` starts the dev server on port 3000.
- `npm run build` is the main check. There are no tests and no ESLint config.
- `node scripts/generate-sitemap.js` rebuilds `public/sitemap.xml`. It needs `.env.local`.

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
