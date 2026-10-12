# TODO

## Community Board

`/community` is in the nav. Its posts are listed in `/community/sitemap.xml` (in `robots.txt`).

Remaining launch steps:
1. Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel (Production + Preview) if not already set.
   Every `/api/community/*` route needs it (`lib/supabaseAdmin.js`).
2. Submit `https://www.ibmaster.net/community/sitemap.xml` in Google Search Console
   and Naver Search Advisor.

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
