# Spec: /find search box and 수업료 slider

## Goal
Help students and parents narrow the teacher list on `/find` by price and by keyword, using data already in the `teachers` table.

## Included
- **Search box** above the filter chips, full width.
  - Placeholder: "이름, 학교, 과목으로 검색".
  - Matches `name`, `school`, `shortintroduction`, `subjects`, and `extra_subject`; case-insensitive; updates as you type.
- **수업료 filter chip** (5th chip), opening the same bottom sheet (mobile) / dropdown (desktop) as the other filters, with a two-handle range slider (`rc-slider`, already installed).
  - Range 2만원 – 15만원+, step 1만원 (`rate` is 만원/시간). The top handle at 15 means "15만원 이상".
  - Labels under the slider show the current range, e.g. "5만원 – 7만원" or "2만원 – 15만원+".
  - At the full range the slider filters nothing.
  - While set, the chip reads the range, e.g. "5–7만원", in the selected chip style.
  - The sheet's 초기화 resets the slider to the full range.
- **Teachers without a 수업료** (`rate` empty or ≤ 0) are not hidden by the slider: they are listed after all matching teachers.
- **Chip row** stays on one line and scrolls sideways on narrow screens, with a fade on the right edge that shows only while more chips are off-screen. No visible scrollbar.
- **"필터 초기화"** also clears the search box and the slider. It shows whenever any filter, search text, or slider is active.

## Not included
- Sorting options, age filter, school categories.
- Any change to the `teachers` table, data cleanup, or the teacher apply/edit forms.
- Changes to the list design, CTA cards, or other filters.

## Rules
- Read-only use of existing columns; no migration.
- Within each group (rate matches / no rate), keep the current order: premium first, then shuffled.
- Search and filters combine (AND).
- Count line ("총 검색된 선생님 수") reflects the filtered result, including no-rate teachers shown at the bottom.
- Korean text exactly as above.
- Must work at 360–390px with no page-level horizontal scroll.

## Done when
- [ ] Typing "물리" (or a school name) narrows the list to teachers whose name/school/intro/subjects match; clearing the box restores the list.
- [ ] Setting the slider to 5–7 shows teachers with rate 5–7 first, then teachers without a rate; teachers with other rates are hidden.
- [ ] The 수업료 chip reads the selected range while set, and the sheet's 초기화 resets it.
- [ ] At 360px the chip row scrolls sideways, the right-edge fade shows, and it disappears when scrolled to the end; the page itself has no horizontal scroll.
- [ ] "필터 초기화" clears search, slider, and chip filters.
- [ ] `npm run build` passes.
