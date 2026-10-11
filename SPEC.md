# Spec: Admin draft posts for the community board

## Goal
Claude writes community posts as hidden drafts in the database, the owner reviews them on the live site from the admin panel, and publishes each one with a button. This replaces the file-based seed posts, publish script and dev-only preview.

## Included
- **Migration** (new file in `supabase/migrations/`, run by hand in the Supabase dashboard):
  - `community_posts.is_draft boolean not null default false`
  - recreate `community_posts_public` with `and not p.is_draft`, so drafts never appear in the feed, 인기글, search or the post page
- **Admin API** (all `requireAdminUser`, service-role client):
  - `GET /api/admin/community/drafts`: list drafts (slug, title, categories, is_pinned, created_at, updated_at)
  - `GET /api/admin/community/drafts/[slug]`: one draft with content rendered by `communityMarkdownToHtml`
  - `POST /api/admin/community/drafts/[slug]/publish`: sets `is_draft = false` and `created_at = now()`, so the post appears at the top of the feed dated on publish day
  - `DELETE /api/admin/community/drafts/[slug]`: soft delete (`deleted_at`, `deleted_by_admin`)
- **Admin pages** (client, `useAuth` admin check, `authFetch`):
  - `/admin/community/drafts`: list of drafts, linked from a "커뮤니티 초안" button on `/admin`
  - `/admin/community/drafts/[slug]`: the post in the real post layout with the 미리보기 badge, banner and floating "미리보기 모드" pill, plus a **게시하기** button (confirm dialog) and a **삭제** button (confirm dialog). After publishing, it links to the live post.
- **Hide drafts everywhere else:** every public route that loads a post from the base table treats a draft as not found: post GET/PATCH/DELETE, comments, likes, scraps, reports, `/community/me`, and `lib/communityPost.js`.
- **Drafting by Claude:** a short "Community drafts" section in `CLAUDE.md` saying how Claude inserts and updates drafts through the Supabase connector:
  - author: user `Admin`, with an `admin` role check first
  - `is_draft = true`
  - slug in the same format as `app/api/community/posts/route.js`
  - same title, length and category limits as the post API
- **Load the six existing posts** into the database as drafts after the migration is run, then remove `content/community-seed/`, `scripts/community-seed.mjs`, `lib/communitySeed.js`, `app/community/preview/`, the `dev.jsx` `pageExtensions` and `env` and `outputFileTracingIncludes` settings in `next.config.js`, and the old admin preview button.

## Not included
- No editing drafts in the browser. Changes go through Claude.
- No scheduled publishing, unpublish (back to draft), or version history.
- User submissions are unchanged: they default to `is_draft = false` and appear immediately.
- No sitemap changes.

## Rules
- Drafts must never be visible to non-admins, including through API responses, counts, search or `/community/me`.
- Only admins can list, view, publish or delete drafts. Publish and delete only act on rows where `is_draft = true` and `deleted_at is null`.
- Publishing is a one-way flip. A second publish request returns 404.
- `components/community/postBodyClasses.js` stays shared between the post page and the draft preview.
- **Database** (an "Ask before changing" area): approved by the owner. Claude writes the migration but does not run it. Claude writes draft rows through the Supabase connector only when the owner asks, and each write is approved in the session.
- Site text in Korean: "커뮤니티 초안", "게시하기", "삭제", "게시되었습니다", "초안이 없습니다".

## Done when
- [x] The migration file adds `is_draft` and recreates the view with the draft filter.
- [ ] `/admin` shows the "커뮤니티 초안" button, and the list and preview pages load drafts through the admin API. (Built and wired; not yet tested with a real admin session, since the migration isn't run.)
- [x] Every admin draft route returns 401 without an admin token.
- [ ] Publish sets `is_draft = false` and a new `created_at`, and a second publish returns 404. (In code: the update filters on `is_draft = true`. Not yet run against the database.)
- [x] Code review confirms each public route listed above treats a draft as not found.
- [ ] The seed files, script, `lib/communitySeed.js`, `/community/preview` pages and `next.config.js` preview settings are removed. Nothing imports them. (All removed except `content/community-seed/*.md`, kept as the source until the six drafts are loaded.)
- [ ] After the owner runs the migration: the six posts exist as drafts, are hidden from `/community`, and show in `/admin/community/drafts`.
- [x] `npm run build` passes.
