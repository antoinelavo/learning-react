# Spec: Community board (Naver-cafe style)

## Goal
Finish the community board started on `claude/community-board-system-u6fkyq` and add the core Naver-cafe features (notices, best posts, search, scraps, my activity, moderation). Ship it ready to launch, but keep it hidden from navigation and the sitemap until the owner launches it.

## Included
- **Bring the branch up to date:** merge `claude/community-board-system-u6fkyq` into the working branch, merge in `main` (101 commits behind), and resolve conflicts. Keep the rebuild's existing features:
  - 6 boards
  - threaded comments, one reply level
  - likes on posts and comments
  - anonymous posting
  - teacher identity
  - username onboarding
  - R2 image uploads, up to 5 per post
  - reports with an admin review queue
  - de-duplicated view counts
  - rate limits
- **Fix broken or stale parts** found while merging: build errors, Next 15 async `params`, anything still calling `supabase.auth.getUser()` server-side without a token, and the client sending its access token on every community API call.
- **공지 (pinned notices):** admins can pin or unpin any post. Pinned posts appear at the top of their board and of the 전체 view, marked "공지". They are stored as `is_pinned` on `community_posts`.
- **인기글:** a best-posts tab showing posts from the last 7 days, ranked by `like_count * 3 + comment_count * 2 + view_count / 10`, top 20.
- **Search:** title and content search (`ilike`), combined with the board filter. The query is kept in the URL (`?q=`).
- **Pagination:** 20 posts per page, numbered pages, with the page number in the URL (`?page=`).
- **Scrap:** a scrap/unscrap toggle on the post page, stored in a new `community_post_scraps` table (`post_id`, `user_id`, `created_at`).
- **내 활동** (`/community/me`): tabs for 내가 쓴 글, 내가 쓴 댓글 and 스크랩, each paginated. Anonymous posts and comments are included for their owner.
- **Admin tools:**
  - Hide or delete any post or comment from the post page (admin only) and from `/admin/community/reports`. Both are soft deletes using `deleted_at`, shown as "관리자에 의해 삭제된 게시글입니다." / "…댓글입니다."
  - Admins see the real author of anonymous posts and comments.
  - Ban a user for 7 days, 30 days or permanently, using `users.community_banned_until`. Permanent is stored as a far-future date.
- **Ban behavior:** a banned user can still read. Every write route (post, comment, like, scrap, report, image upload) returns 403, and the UI shows "커뮤니티 이용이 제한되었습니다 (YYYY-MM-DD까지)".
- **SEO:** each post gets `generateMetadata` (title, description, canonical, Open Graph) and `DiscussionForumPosting` JSON-LD. The feed page gets a canonical URL.
- **Remove the legacy community pieces:**
  - the announcements strip on `/community` (blog MDX + old `posts` table)
  - `/community/[slug]`, `/admin/posts` and `app/api/admin/posts/*`
  - the old `posts` table and `increment_post_views` (dropped in the migration)
  - Add a single "블로그 보기 →" link to `/blog` on the feed.
- **One new migration** `supabase/migrations/<date>_community_launch.sql`. It adds:
  - `is_pinned`
  - `community_post_scraps` with RLS enabled
  - `users.community_banned_until`
  - updates to `community_posts_public` to expose `is_pinned`
  - dropping `posts` and `increment_post_views`
  It also copies the two branch migrations that are already applied in the live DB as-is.
- **Docs:** update `TODO.md` (setup steps and launch checklist) and `CLAUDE.md` (community architecture, `lib/supabaseAdmin.js` as the one service-role exception).

## Not included
- Making the board public: the nav links stay commented out and `/community` stays out of the sitemap.
- Reply or comment notifications (site or email), member grades and 등업, polls, 출석부, 쪽지, word filter.
- Promotion rules: teachers and hagwons may post and comment, under their own identity or anonymously. Moderation is case by case through reports.
- Changes to the legal pages (terms, privacy).
- Turning on RLS for the 9 unrelated tables flagged by Supabase (separate task).

## Rules
- **Database (Ask before changing, approved):** the new migration is written to the repo and run by hand in the Supabase dashboard. Don't apply it through MCP. The build must not depend on it being applied; features that need it can fail at runtime until it is run.
- **Service-role client (approved):** `lib/supabaseAdmin.js` is used only in community and admin-community API routes, and only after `getCommunityUser`/`requireAdminUser` has verified the caller. Never import it in client components. It needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and in Vercel (Production + Preview).
- Admin checks are server-side (`requireAdminUser`). Client-side `role === 'admin'` only hides UI.
- Logged-out visitors can read the feed, posts and comments. Writing, liking, scrapping and reporting need a logged-in user with a username.
- Anonymous is a per-post and per-comment checkbox, off by default, on every board. Public responses never include `user_id` or the real author for anonymous content; only admin responses do.
- Approved teachers posting non-anonymously show their teacher name, photo and badge, linked to `/profile/[name]`. Exclude `is_test` teachers from that link.
- Deleted and hidden content never appears in feeds, search, 인기글 or 내 활동 (except to show the owner a "삭제됨" entry).
- Site text is Korean; code and comments are English.
- Mobile first: the feed, post page, write form and 내 활동 work at 375px width with no horizontal scroll.
- Work on `claude/init-tfsut8` and open a PR. Never push to `main`.

## Done when
- [ ] The branch contains the community rebuild merged with current `main`, and there are no conflict markers.
- [ ] `npm run build` passes, using placeholder env values plus a placeholder `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Every community write route verifies a bearer token and returns 401 without one and 403 for a banned user (checked by reading the code).
- [ ] The feed shows pinned posts first, the 인기글 tab uses the 7-day formula, `?q=` searches title and content, and `?page=` paginates 20 per page.
- [ ] Admins can pin or unpin, hide or delete any post or comment, see anonymous authors, and ban for 7, 30 or permanent days. These controls don't render for non-admins, and their API routes reject non-admins.
- [ ] Scrap toggles on a post, and `/community/me` lists my posts, comments and scraps.
- [ ] Post pages render metadata, a canonical URL and `DiscussionForumPosting` JSON-LD.
- [ ] `/community/[slug]`, `/admin/posts`, `app/api/admin/posts/*` and the announcements strip are gone, and nothing imports them.
- [ ] The new migration file exists and covers `is_pinned`, `community_post_scraps` with RLS, `community_banned_until`, the view update, and dropping `posts`.
- [ ] The nav links are still commented out and `/community` is not in `public/sitemap.xml`.
- [ ] `TODO.md` lists the launch steps: run the migration, set `SUPABASE_SERVICE_ROLE_KEY` in Vercel, delete the 2 test posts, uncomment the nav links, add `/community` and posts to the sitemap.
