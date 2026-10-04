# Spec: /find page redesign

## Goal
Clean up the teacher search page (`/find`): a properly bordered grouped list, CTA cards that look intentional, and filters that are easy to use on a phone.

## Included
- **Teacher list (iOS grouped style):** one white box with a full border and `rounded-2xl` corners on all screen sizes, rows separated by thin dividers inside. No cut-off sides on mobile.
- **List split around the mid CTA:** first 6 teachers in one grouped box, then the CTA card, then the rest in a second grouped box (only when there are more than 6 teachers, as now).
- **CTA cards:** the top and mid-list 질문 보기 CTAs use one shared look: tinted blue card (`bg-blue-50`, light blue border on all sides, `rounded-2xl`), centered text and button. Same text and link (`/students/new`) as now.
- **Page order unchanged:** top CTA card, then title and description, filters, count line, list.
- **Teacher rows (`components/TeacherCard.js`):** restyled to sit cleanly inside the grouped list. 추천 (premium) rows keep a soft yellow background and the yellow 추천 badge; the glow shadow is removed.
- **Filters:**
  - Mobile (below `sm`): tapping a filter chip opens a bottom sheet with the filter name, large tappable options, and a 초기화 (clear this filter) + 완료 (close) row. Dimmed backdrop; tapping it closes the sheet.
  - Desktop: a wider dropdown with larger options.
  - Options still apply immediately as you tap, as now. The 필터 초기화 link for all filters stays.

## Not included
- Filter logic, sorting (premium first, shuffled), data loading, or the count/views line text.
- The teacher profile page.
- Any data, API, payment, or database change.

## Rules
- `TeacherCard` is also used on the teacher dashboard's premium-listing preview (`PremiumListingOffer`); the new row style must look right there too. Styling only — no payment logic changes.
- Use the shared `components/ui` styles where they fit (buttons, chips).
- Korean text unchanged except 초기화 / 완료 in the sheet.
- Must work at 390px with no horizontal scroll; the sheet must respect the iPhone safe area.

## Done when
- [ ] At 390px and 1280px, the teacher list has a full border with rounded corners on all four sides.
- [ ] With more than 6 teachers, the list is two grouped boxes with the CTA card between them; the CTA has a border on all sides.
- [ ] Top and mid CTAs share the same style.
- [ ] 추천 rows have a yellow background and badge but no glow shadow.
- [ ] At 390px, tapping a filter chip opens a bottom sheet; toggling an option filters the list; 초기화 clears that filter; 완료 and the backdrop close it.
- [ ] At 1280px, filters open as a wider dropdown with larger options.
- [ ] The dashboard premium-listing preview still renders the card correctly.
- [ ] `npm run build` passes.
