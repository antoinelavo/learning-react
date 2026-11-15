# Spec: About us page refresh

## Goal
Rewrite `/aboutus` as a short service introduction instead of a personal story, and fix its broken layout so it matches the rest of the site.

## Included
- New Korean copy in `app/aboutus/page.js`: a heading (소개) and a couple of plain, warm paragraphs. They cover what IB Master is, no commission, and finding a teacher and contacting them directly. A small closing line asks users (students and parents) to verify a teacher's identity themselves.
- Layout: the page shell `max-w-3xl mx-auto px-4 py-4`, real `<p>` elements instead of `<br>` chains, and no fixed height or cards.

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
- [x] The page is a few plain paragraphs plus the identity-verification note, with no cards, value grid or buttons.
- [x] The page uses the standard shell, has no fixed height and no `<br>` chains, and reads well at phone width (375px) without horizontal scroll.
- [x] `npm run build` passes.
