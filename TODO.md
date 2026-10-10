# TODO

## Community Board

Built and hidden: `/community` works but is not in the nav or sitemap.

Launch checklist, in order:
1. Run `supabase/migrations/20261010_community_launch.sql` in the Supabase dashboard (SQL Editor).
   The two earlier community migrations (`20260908_…`, `20260927_…`) are already applied.
   Pinning, scraps, bans and the admin-deleted label fail until this runs.
2. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and to Vercel (Production + Preview).
   Every `/api/community/*` route needs it (`lib/supabaseAdmin.js`).
3. Delete the 2 test posts ("as", "sdf") in `community_posts`.
4. Uncomment the 커뮤니티 links in `components/DesktopNav.client.jsx` and
   `components/MobileMenuToggle.client.jsx`.
5. Add `/community` and `/community/post/[slug]` pages to `scripts/generate-sitemap.js`
   and regenerate `public/sitemap.xml`.

Follow-ups not in this build: reply/comment notifications, member grades and 등업,
polls, 출석부, word filter, orphaned-R2-image cleanup, a real rate limiter
(the current one is a DB count check).

## Teacher Profiles

- On each teacher's profile page, show a list of posts they have written
  - Link from profile → post, and from post → teacher profile

## General

- Notifications (e.g. notify user when someone replies to their post)
- Update the footer
- Fix formatting issues on the /aboutus page

## Email / Mailing Lists

- Add unsubscribe feature for the hagwon-requests mailing list
- Add unsubscribe feature for the students mailing list subscription
