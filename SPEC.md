# Spec: Community SEO fixes

## Goal
Make every live community post easy for Google and Naver to find, index and understand, Reddit-style: in a sitemap, with honest status codes, and with comments in the HTML.

## Included
- **Community sitemap:** a dynamic route at `/community/sitemap.xml`.
  - Lists `/community` plus every live post (not deleted, not a draft). No `lastmod`, because a trigger bumps `updated_at` on every counter update.
  - Built from the `community_posts_public` view with the anon key. Cached at the CDN for an hour.
  - Added as a second `Sitemap:` line in `public/robots.txt`. The existing static `public/sitemap.xml` and its script are unchanged.
- **Real 404s for missing posts:**
  - Move the feed page and its `loading.jsx` into a route group, `app/community/(feed)/`, so the feed skeleton no longer wraps post pages.
  - Remove `app/community/post/[slug]/loading.jsx`.
  - `/community/post/<missing slug>` and draft slugs return HTTP 404.
- **Deleted posts** keep the "삭제된 게시글입니다" page, with `robots: { index: false }` in `generateMetadata`.
- **Database errors are not 404s:** if the post lookup itself fails (Supabase error or timeout), the page throws, giving a 500, so an outage never tells Google that posts are gone.
- **Server-rendered comments:**
  - Move the comment-tree building from `app/api/community/posts/[slug]/comments/route.js` into a shared server helper (e.g. `lib/communityComments.js`), used by both the API route and the post page.
  - The post page passes the anonymous-viewer tree to `CommentThread` as initial data, so comments are in the first HTML.
  - `CommentThread` renders the initial data immediately, then refetches as before for viewer-specific state (liked, 내 댓글, admin tools).
- **JSON-LD:** the post's `DiscussionForumPosting` gets a `comment` array of `Comment` items, with replies nested via `comment`. Each has:
  - author name, as shown publicly (익명N for anonymous comments)
  - `text`, `dateCreated`, and `upvoteCount` from likes

## Not included
- No changes to the static sitemap, `scripts/generate-sitemap.js` or the SEO audit routine.
- No Search Console or Naver Search Advisor setup (the owner does this; Claude gives the steps).
- No 410 status for deleted posts, no pagination of comments, and no changes to the feed's SEO.

## Rules
- Anonymous posts and comments must never expose `user_id` or real author names in the HTML, the JSON-LD or the sitemap. Server-rendered comments use the same anonymous-viewer labeling as the public API.
- Deleted comments are excluded from the JSON-LD and stay masked in the HTML, as they are today.
- The sitemap and post page never include drafts.
- Feed URLs stay unchanged (route groups don't change paths). `/community/me` and the other `/community` routes keep working.
- No "Ask before changing" areas touched.

## Done when
- [x] `/community/sitemap.xml` returns valid XML listing every live post and no drafts or deleted posts. `robots.txt` lists it.
- [x] Under `npm run build && npm start`, `/community/post/does-not-exist` returns HTTP 404. A live post returns 200, and the feed still shows its skeleton.
- [x] A deleted post's page includes `<meta name="robots" content="noindex">`.
- [x] A failed Supabase lookup does not produce a 404 (code path verified).
- [x] A post's raw HTML (curl, no JS) contains its comment text, and its JSON-LD has a `comment` array.
- [x] Anonymous comments in the HTML and JSON-LD show 익명N and no user id.
- [x] Code review confirms the comments API response is unchanged.
- [x] `npm run build` passes.
