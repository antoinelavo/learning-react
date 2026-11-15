# Spec: About us page formatting fix

## Goal
Fix the broken layout of `/aboutus` while keeping the original text.

## Included
- `app/aboutus/page.js`: the page shell `max-w-3xl mx-auto px-4 py-4`, the card at natural height (no `h-[80dvh]`), real `<p>` elements instead of `<br>` chains, a heading styled like `/find`, and the footnotes and donation account set apart as smaller grey text.

## Not included
- Any wording change. The text, metadata and donation account stay as they were (only a stray zero-width space is removed).

## Rules
- Server component, with no client JS needed.
- Doesn't touch any "Ask before changing" areas.

## Done when
- [x] The page text matches the original word for word.
- [x] No fixed height, no `<br>` chains, the standard shell, and no horizontal scroll at 375px.
- [x] `npm run build` passes.
