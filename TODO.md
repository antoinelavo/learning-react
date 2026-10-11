# TODO

## Community Board

`/community` is in the nav but not yet in the sitemap.

Launch checklist, in order:
1. `20261010_community_launch.sql` is applied except its last three cleanup lines
   (drop `increment_community_post_views`, `increment_post_views` and the empty `posts`
   table). Run those in the Supabase SQL Editor.
2. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and to Vercel (Production + Preview).
   Every `/api/community/*` route needs it (`lib/supabaseAdmin.js`).
3. Delete the 2 test posts ("as", "sdf") in `community_posts`.
4. Add `/community` and `/community/post/[slug]` pages to `scripts/generate-sitemap.js`
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
