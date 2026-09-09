# TODO

## Community Board

- Run the Supabase SQL migrations before this feature works in production:
  - `supabase/migrations/20260605_create_posts.sql` (legacy admin-authored posts — may already be applied)
  - `supabase/migrations/20260908_create_community_board.sql` (new user community board — posts, threaded comments, likes, reports)
  - Run in Supabase dashboard → SQL Editor
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and to Vercel (Production + Preview) — required by the new `/api/community/*` routes (`lib/supabaseAdmin.js`)
- Rebuilt from scratch: posts, threaded comments (1 level deep), likes, anonymous posting
  (Goondori-style generated nicknames), image uploads (Cloudflare R2, ≤5/post), and
  report/flag moderation with an admin review queue at `/admin/community/reports`.
  See the board at `/community` (feed) and `/community/post/[slug]` (detail) — the
  legacy `/community/[slug]` admin/blog detail page is unchanged.
- Add 커뮤니티 to the navigation menu when ready to launch
  - Link is already built and commented out in DesktopNav.client.jsx and MobileMenuToggle.client.jsx
  - Just uncomment the relevant blocks to make it visible
- Follow-ups not in this build: notifications on reply, member level/activity badges,
  orphaned-R2-image cleanup cron, a real rate limiter (current one is a DB count check)

## Teacher Profiles

- Allow teachers to write community posts
- On each teacher's profile page, show a list of posts they have written
  - Link from profile → post, and from post → teacher profile

## General

- Add SEO sitemap entries for /community posts
- Notifications (e.g. notify user when someone replies to their post)
- Update the footer
- Fix formatting issues on the /aboutus page

## Email / Mailing Lists

- Add unsubscribe feature for the hagwon-requests mailing list
- Add unsubscribe feature for the students mailing list subscription
