# Spec: NEIS hagwon fees and info on hagwon pages

## Goal
Show official tuition fees (교육청 등록 기준) and basic registry info on `/hagwons` and `/sat-hagwons`, refreshed weekly, so parents and students get useful, current, search-friendly information.

## Included
- **Data link:** add NEIS identifiers (`neis: { office, zone, id, name }`) to each confidently matched entry in `data/hagwons.js` and `data/sat-hagwons.js`. Hagwons in both files get the same IDs.
- **ID lookup (done during build):** match by name and address against the NEIS registry. Uncertain matches get a code comment and are listed in the build report. No match means no ID.
- **Snapshot:** `scripts/update-hagwon-neis.mjs` writes a committed `data/hagwon-neis.json`:
  - Per-course fees from the hakwon.neis.go.kr search site. The official open API has no 학원 fees.
  - 개원일 and 교습분야 from the official open API (`NEIS_API_KEY`).
  - Pages read only this file at build time; no runtime calls to NEIS.
- **Cards (`HagwonCard`, `SATHagwonCard`):**
  - Collapsed card: a clickable `수업료 …` teaser (no amount) that opens the card.
  - Expanded section is always rendered and hidden with CSS until opened, so descriptions and fees are in the page HTML for SEO. The YouTube embed still loads only on expand.
  - Fee box in the expanded section: `수업료` with the range, `교육청 등록 교습비 기준 · date`, 개원 year and field chips, and two click-to-reveal rows:
    - `강좌별 교습비 (N개)`: course table (과목 / 기간 · 총 시간 / 합계), with right/bottom fades while more rows or columns are off-screen.
    - `수업료 참고 사항`: six neutral notes (등록 기준, 수업 형태, 특강, 교습시간, 기타경비, 컨설팅).
  - No data → `수업료: 학원 문의` in the expanded section.
  - Opening a card logs a `card_expand` event to `page_events` (once per browser session per hagwon) with `hagwon_name`, `has_fee`, and `source` (`fee_teaser` or `chevron`).
- **Page header (`/hagwons`, `/sat-hagwons`):** tighter title spacing, update date and view count on one line.
- **SEO:** JSON-LD `ItemList` of `EducationalOrganization` with `priceRange` where known; meta and OpenGraph descriptions mention 수업료.

## Not included
- Live or ISR fetching from NEIS.
- Official 도로명주소 and 정원 fields.
- Storing NEIS data in Supabase, or adding an admin UI for IDs.
- Hagwon detail pages, the hagwon dashboard, and request forms.
- Changes to filters or card order.
- A page-level fee overview section (removed as repetitive).
- Setting up the weekly refresh routine (offered separately after the build).

## Rules
- A failed fetch keeps that hagwon's previous snapshot entry; the script never wipes data on errors.
- `NEIS_API_KEY` stays in `.env.local` / environment settings and is never committed.
- Never label a hagwon as unregistered.
- Site text is Korean; code is English.
- Touches no "Ask before changing" areas (no payments, DB, blog, or legal pages).

## Done when
- [x] Each confidently matched hagwon in both data files has NEIS IDs; the report lists matched, uncertain, and unmatched hagwons.
- [x] `node scripts/update-hagwon-neis.mjs` produces `data/hagwon-neis.json` with courses for every matched hagwon.
- [x] Collapsed cards show a `수업료 …` teaser without the amount; expanded cards show the fee box with both click-to-reveal rows, 개원 year, and field.
- [x] Fee tables and full descriptions are in the initial page HTML.
- [x] Expanding a card logs one `card_expand` event per session per hagwon.
- [x] Expanded cards without data show `수업료: 학원 문의`.
- [x] The page HTML contains valid JSON-LD with `priceRange`.
- [x] Meta descriptions mention 수업료.
- [x] `npm run build` passes.
