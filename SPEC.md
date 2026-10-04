# Spec: Slimmer request board header with sticky write button

## Goal
Replace the bulky top card on the student and hagwon request boards with a plain title and one line of text, and move the "write request" button to a sticky bar at the bottom on mobile, so requests show up sooner.

## Included
- Both boards, changed the same way: `/students` (`app/students/StudentsPageClient.jsx`) and `/hagwon-requests` (`app/hagwon-requests/HagwonRequestsPageClient.jsx`).
- Header: no card. Plain title + one line of text.
  - 학생 게시판 / "학생/학부모님께서 올린 수업 요청글을 확인하고 직접 연락해 보세요."
  - 학원 요청 게시판 / "학생/학부모님께서 올린 학원 요청글을 확인하고 직접 연락해 보세요."
- The separate gray note line moves into the list header's count:
  - Students: `최근 1개월 · 총 N건`
  - Hagwon: `오래된 글은 자동 삭제 · 총 N건`
- Write button (수업 요청글 작성하기 / 학원 요청글 작성하기, same links as now):
  - Mobile (below `sm`): full-width primary button fixed to the bottom of the screen, with safe-area padding for the iPhone home bar.
  - Desktop (`sm` and up): small primary button on the right of the title line. Nothing sticky.
- Bottom padding on mobile so the sticky bar never covers the last request card.

## Not included
- Changes to the request cards, filters, modals, reveal flow, or the write/edit pages.
- Any data, API, or database change.

## Rules
- Both boards must stay identical in layout and behavior; a change to one is made to the other.
- The write button (sticky and desktop) is hidden for logged-in `teacher` and `hagwon` accounts. Students, parents, admins, and logged-out visitors see it.
- The approved-teacher badge "이번 달 연락처 열람 N/2회 남음" stays, under the explanation line.
- Use the shared `components/ui` button styles.
- No payment, database, blog, or legal changes.

## Done when
- [x] Neither board's header is a card; each shows the title and the exact one-line text above.
- [x] List headers read `최근 1개월 · 총 N건` and `오래된 글은 자동 삭제 · 총 N건`; the old gray note lines are gone.
- [x] At 390px width, the write button is fixed to the bottom, full width, and the last card can scroll fully above it.
- [x] At 1280px width, the write button sits on the title line and nothing is fixed to the bottom.
- [x] The write button does not render for `teacher` or `hagwon` roles (checked in code).
- [x] `npm run build` passes.
