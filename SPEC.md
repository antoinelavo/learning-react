# Spec: NEIS hagwon fees and info on hagwon pages

## Goal
Show official, auto-refreshed tuition fees (교육청 등록 기준) and basic registry info on `/hagwons` and `/sat-hagwons`, so parents and students get useful, current, search-friendly information.

## Included
- **Data link:** add NEIS identifiers (office code `ATPT_OFCDC_SC_CODE` + hagwon number `ACA_ASNUM`) to each matching entry in `data/hagwons.js` and `data/sat-hagwons.js`. Hagwons in both files get the same IDs.
- **ID lookup (done during build):** search the NEIS open API (`open.neis.go.kr`, 학원교습소정보) by name and address. Uncertain matches (multiple branches, different registered name) get a code comment and are listed in the build report. No match means no ID.
- **Fetch:** a server-side helper (e.g. `lib/neis.js`) that fetches fee and info data for all IDs, using `NEIS_API_KEY`. The pages refresh weekly (`revalidate = 604800`).
- **Cards (`HagwonCard`, `SATHagwonCard`):**
  - One-line summary: `수업료: 월 OO만~OO만원 (교육청 등록 기준)`.
  - A `수업료 상세 보기` toggle that opens the full course table (과정 / 수강료 / etc.). The table is in the HTML even when closed, so search engines can read it.
  - `OOOO년 개원` and the registered 교습과정 (e.g. `외국어 / 국제화`).
  - No data → `수업료: 학원 문의`, and the 개원 and 교습과정 lines are hidden.
- **Fee section** above each list (`IB 학원 수업료 안내` / `SAT 학원 수업료 안내`), built from the data: price range, median, how many hagwons have data, the data date, and a source note (교육청 등록 기준, 실제 수업료는 학원에 문의).
- **SEO:** JSON-LD `EducationalOrganization` per hagwon with `priceRange` where known; the meta and OpenGraph descriptions mention 수업료.

## Not included
- Official 도로명주소 and 정원 fields.
- Storing NEIS data in Supabase, or adding an admin UI for IDs.
- Hagwon detail pages (`app/hagwon/mockup`), the hagwon dashboard, and request forms.
- Changes to filters or card order.

## Rules
- Fetching never breaks the build or the page: a missing key, API error, or empty result means `학원 문의` for the affected cards.
- `NEIS_API_KEY` is server-only (no `NEXT_PUBLIC_` prefix) and not committed. The user adds it to Vercel and `.env.local`.
- If a fee text can't be parsed into numbers, show the raw text in the table and leave that hagwon out of the range and median.
- Never label a hagwon as unregistered.
- Site text is Korean; code is English.
- Touches no "Ask before changing" areas (no payments, DB, blog, or legal pages).
- Network: `open.neis.go.kr` (and `hakwon.neis.go.kr`) must be allowed in this environment for the ID lookup.

## Done when
- [ ] Each matched hagwon in both data files has NEIS IDs; the report lists matched, uncertain, and unmatched hagwons.
- [ ] With a valid key, cards show the fee summary, a working `수업료 상세 보기` toggle, 개원 year, and 교습과정.
- [ ] Without a key (or with the API blocked), the build passes and every card shows `수업료: 학원 문의`.
- [ ] Both pages export `revalidate = 604800`.
- [ ] The fee section shows range, median, count, and date, and is hidden when no hagwon has fee data.
- [ ] The page HTML contains the fee tables and valid JSON-LD with `priceRange`.
- [ ] Meta descriptions mention 수업료.
- [ ] `npm run build` passes.
