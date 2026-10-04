# Spec: Show 수업료 on teacher profiles

## Goal
Show each teacher's hourly rate on their profile page (`/profile/[name]`) so students and parents see the price before contacting them.

## Included
- In `pages/profile/[name].js`, at the top of the right-hand card (above the lesson-time pill):
  - Teachers with a rate (`rate` > 0): **시간당 N만원**, prominent (bold, larger than body text).
  - Teachers without a rate (`rate` empty or ≤ 0): **수업료 협의**, same position, muted style.
  - If `rate_description` has text, show it under the line in small gray text, wrapping as needed (also for teachers without a rate).
- Works on mobile (merged card) and desktop (two cards).

## Not included
- Changes to how teachers enter their rate (dashboard/apply forms).
- Rate on the `/find` list cards.
- SEO/meta description changes.
- Any data or database change.

## Rules
- Read-only use of the existing `rate` and `rate_description` columns, already loaded by the page's `getStaticProps` (`select('*')`).
- `rate_description` is rendered as plain text (no HTML).
- Profiles are ISR (`revalidate: 60`), so new rates appear within a minute of a teacher saving them.
- Korean text exactly: "시간당 N만원", "수업료 협의".

## Done when
- [ ] A teacher with rate 5 shows "시간당 5만원" above the lesson-time pill.
- [ ] A teacher with a `rate_description` shows it under the rate in small gray text.
- [ ] A teacher with no rate shows "수업료 협의" (plus their note, if any).
- [ ] Looks right at 390px and 1280px.
- [ ] `npm run build` passes.
