# Spec: Dev-only preview for community seed posts

## Goal
Let the owner see each seed post in `content/community-seed/` exactly as it will look on `/community` before publishing it with `scripts/community-seed.mjs`.

## Included
- `/community/preview`: a list of all seed posts (number, title, boards, 공지 if pinned), each linking to its preview.
- `/community/preview/[n]`: renders seed post `n` with the same layout as `app/community/post/[slug]/page.jsx`:
  - 공지 badge when `pinned: true`, board badges, title
  - author line as `Admin` with the 운영자 badge, today's date, 조회 0
  - body rendered with `communityMarkdownToHtml`, with the same prose classes
- A banner at the top of both pages: "미리보기: 아직 게시되지 않은 글입니다."
- Shared seed loading (read the file, parse frontmatter, validate) moved into `lib/communitySeed.js`, used by both the preview pages and `scripts/community-seed.mjs`, so the preview and the published post can't drift.
- Desktop and mobile screenshots of posts 1–3 for the owner, taken with the dev server.

## Not included
- No preview on the live site. Both routes return 404 when `NODE_ENV === 'production'`.
- No comments, likes, scrap, report or admin actions on the preview.
- No editing in the browser. Edit the Markdown file and reload.
- No database reads or writes, and no changes to the publish behavior of the script.

## Rules
- Preview pages read only from disk and never call Supabase.
- `robots: { index: false }` on both pages.
- Unknown `n`, or a seed file that fails validation, shows `notFound()` (invalid files also log the reason to the server console).
- `lib/communitySeed.js` uses Node `fs`, so it must never be imported from client components or from `lib/community.js`.
- Page shell `max-w-3xl mx-auto px-4 py-4` and the `components/ui` kit, matching the post page.
- No "Ask before changing" areas touched.

## Done when
- [x] `/community/preview` lists all six seed posts under `npm run dev`.
- [x] `/community/preview/1` shows the 공지 badge, and `/community/preview/2` does not.
- [x] The preview body HTML matches `communityMarkdownToHtml` output for the same file (same function, same classes).
- [ ] `/community/preview/99` returns 404. (Shows the 404 page, but with HTTP status 200 under `npm run dev`: `app/community/loading.jsx` streams the response first. Missing posts at `/community/post/<slug>` already behave the same way.)
- [x] Both routes return 404 under `npm run build && npm start`.
- [x] `scripts/community-seed.mjs` still passes its earlier checks (usage error, missing env, mock insert with `is_pinned`).
- [x] Screenshots of posts 1–3 (desktop and mobile) are shared.
- [x] `npm run build` passes.
