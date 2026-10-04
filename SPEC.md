# Spec: Show 수업료 on teacher profiles (page + SEO)

## Goal
Show each teacher's hourly rate on their profile page (`/profile/[name]`) so students and parents see the price before contacting them, and include it in search-result snippets.

## Included
- In `pages/profile/[name].js`, at the top of the right-hand card (above the lesson-time pill):
  - Teachers with a rate (`rate` > 0): **시간당 N만원**, prominent (bold, larger than body text).
  - Teachers without a rate (`rate` empty or ≤ 0): **수업료 협의**, same position, muted style.
  - If `rate_description` has text, show it under the line in small gray text, wrapping as needed (also for teachers without a rate).
- Works on mobile (merged card) and desktop (two cards).
- **Meta description and `og:description`:** "{학교} · 시간당 N만원 · {first 3 subjects} — {한줄소개}", trimmed to about 150 characters at a word boundary with "…". Without a rate, "수업료 협의" takes the price's place. Empty parts are skipped, with no stray separators.
- **JSON-LD** (`<script type="application/ld+json">` in `<Head>`), only for teachers with a rate: a schema.org `Service` ("IB 과외") whose `provider` is a `Person` (name, school as `alumniOf`), with an `Offer` + `UnitPriceSpecification` (price N×10000, `priceCurrency` "KRW", `unitText` "HOUR").

## Not included
- Changes to how teachers enter their rate (dashboard/apply forms).
- Rate on the `/find` list cards.
- Page `<title>` (stays "{이름} | IB 과외 선생님").
- Any data or database change.

## Rules
- Read-only use of the existing `rate` and `rate_description` columns, already loaded by the page's `getStaticProps` (`select('*')`).
- `rate_description` is rendered as plain text (no HTML).
- JSON-LD is built with `JSON.stringify` and `<` escaped, so teacher text can't break out of the script tag.
- Profiles are ISR (`revalidate: 60`), so new rates appear within a minute of a teacher saving them.
- Korean text exactly: "시간당 N만원", "수업료 협의".

## Done when
- [ ] A teacher with rate 5 shows "시간당 5만원" above the lesson-time pill.
- [ ] A teacher with a `rate_description` shows it under the rate in small gray text.
- [ ] A teacher with no rate shows "수업료 협의" (plus their note, if any).
- [ ] Looks right at 390px and 1280px.
- [ ] The page's meta and og descriptions start with the school and "시간당 N만원" (or "수업료 협의") and are at most ~150 characters.
- [ ] Teachers with a rate have valid JSON-LD with the KRW hourly price; teachers without a rate have none.
- [ ] `npm run build` passes.
