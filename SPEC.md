# Spec: About us page refresh

## Goal
Rewrite `/aboutus` as a short service introduction instead of a personal story, and fix its broken layout so it matches the rest of the site.

## Included
- New Korean copy in `app/aboutus/page.js`:
  - `<h1>` 소개, plus a one-line summary of IB Master (IB tutor platform, no commission).
  - A short "what we value" section built on 무료 · 편리 · 자유, rewritten so it no longer says contact happens only by KakaoTalk or email.
  - A section introducing 선생님 찾기, with a `Button` linking to `/find`.
  - A note at the bottom: users (students and parents) must verify a teacher's identity themselves.
- Layout: the page shell `max-w-3xl mx-auto px-4 py-4`, the `components/ui` kit (`cardClasses`, `Button`/`buttonClasses`, `Notice` for the disclaimer), real `<p>`/`<h2>` elements instead of `<br>` chains, and no fixed height.

## Not included
- Personal story (name, school, years of tutoring).
- The donation account and the "self-funded" note. Remove the `NEXT_PUBLIC_BANK_*` usage from this page.
- Paid features (플러스, premium), hagwons, community, blog and chat.
- Changes to the footer link, nav or other pages.

## Rules
- Site text is Korean. Keep the "no commission" claim.
- Keep the URL `/aboutus` and the existing metadata (title, description, canonical, OG). The description's "만든 이유" wording may be adjusted to fit the new content.
- Server component, with no client JS needed.
- Doesn't touch any "Ask before changing" areas.

## Done when
- [x] `/aboutus` has no personal story, donation account or self-funded note.
- [x] The page has the intro, values, a 선생님 찾기 section with a working button to `/find`, and the identity-verification note.
- [x] The page uses the standard shell and the `components/ui` kit, has no fixed height and no `<br>` chains, and reads well at phone width (375px) without horizontal scroll.
- [x] `npm run build` passes.
