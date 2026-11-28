# Spec: Student dashboard hub, IB calculator and exam calendar

## Goal
Give students a reason to come back: a real dashboard hub (D-day, chats, requests, shortcuts) plus two public tools, an IB grade calculator and an IB/SAT/admission date calendar. Modeled on Clastify's calculator, RevisionDojo's planner and ManageBac's calendar, adapted to Korean IB students.

## Included
- **Student dashboard** (`/dashboard`, student role only; teacher and admin views unchanged). Sections in this order:
  1. D-day card: the exam the student picked, days remaining, link to the calendar.
  2. Unread chats: unread count plus the latest conversations, linking to the chat panel.
  3. My tutor requests: each of the student's `student_jobs` with status and view count, a 새 요청 올리기 button, and an empty state.
  4. Shortcuts: 선생님 찾기, 학원, SAT 학원, 커뮤니티, IB 성적 계산기, IB 시험 일정, and blog guides (IA, EE, TOK, exam schedule).
  5. My community posts: link to `/community/me`.
  6. Account settings: the existing email toggle, logout and delete, moved to the bottom.
- **IB grade calculator** at `/tools/ib-calculator` (public, no login):
  - ~12 subjects at SL and HL: Math AA, Math AI, English A Lang & Lit, English A Literature, English B, Korean A, Physics, Chemistry, Biology, Economics, Business Management, Psychology, History.
  - Student enters component marks (papers, IA, etc.); each component is scaled by its official weighting to a 0–100 subject total.
  - The total maps to 1–7 using default percentage bands that the student can edit. Bands are labeled 추정치 (estimate, not official).
  - Diploma total: six subjects plus TOK/EE core points from the official matrix, out of 45, with the 24-point minimum and the failing conditions shown.
  - Each subject links to its official IB subject brief or guide.
  - Inputs saved in the browser only.
- **Exam calendar** at `/tools/calendar` (public, no login):
  - Events: IB May and November exam windows and results days, SAT dates and registration deadlines in Korea, Korean admission dates (수시/정시 windows, 대교협/adiga).
  - Chronological list by month, D-day counter, category filters (IB, SAT, 입시), "Google 캘린더에 추가" link per event.
  - The student can pick which exam to count down to; the choice is remembered in the browser and drives the dashboard D-day card.
- Data files in `data/` (events, subject weightings, core matrix) with a `lastVerified` date and an official source URL per entry.
- Both tool pages added to `public/sitemap.xml` via `scripts/generate-sitemap.js`, with metadata and Korean titles and descriptions.

## Not included
- Per-student saved data in the database (IA/EE/TOK trackers, to-dos, study planner), and any new table or migration.
- `.ics` download and email reminders.
- Subjects beyond the 12 above, and group 1–6 completeness.
- Changes to the teacher or admin dashboards, payments, tiers, blog posts, legal pages or the nav.
- Saved teachers or hagwons.

## Rules
- No database, RLS, payment or blog changes, so nothing in "Ask before changing" is touched. The dashboard reads existing data through existing paths only: `getUnreadCount` and conversation helpers in `lib/chat/chatClient.js`, and `student_jobs` via the column list in `lib/requestColumns.js`. Never `select('*')` on `student_jobs`.
- Site text is Korean; code, comments and names are English.
- Use the UI kit (`Button`, `Card`, `Badge`, `Tabs`, `Input`, `Select`, `Notice`, chips) and the shell `max-w-3xl mx-auto px-4 py-4`. Real buttons for actions, no arrow glyphs in labels. Must work at phone width.
- All dates, weightings, the core matrix and passing conditions must be verified against official sources during the build (ibo.org subject briefs and DP passing criteria, collegeboard.org, adiga.kr / 대교협, university pages). Where a value cannot be confirmed, leave it out rather than guess. IB grade boundaries are not public, so the 1–7 mapping is always labeled as an estimate with a disclaimer.
- Browser storage (`localStorage`) is a convenience only: wrap every read and write in try/catch and render correctly without it.
- Calculator inputs are validated against each component's maximum mark; empty or partial input shows no result rather than a wrong one.
- Empty states for the dashboard: no chats, no requests, no selected exam (default to the next upcoming IB session).
- Tool pages are public and server-rendered with metadata; the dashboard stays client-side and requires login as it does now.

## Done when
- [ ] A logged-in student sees the six dashboard sections in the order above on `/dashboard`; teacher and admin views are unchanged.
- [ ] The D-day card shows the exam chosen on `/tools/calendar` and falls back to the next upcoming IB session.
- [ ] The unread chat count and recent conversations appear and link to the chat panel; the requests section shows the student's own requests or an empty state.
- [ ] `/tools/ib-calculator` works logged out: entering component marks for any listed subject and level gives a scaled total, an estimated 1–7 grade from editable bands, and a diploma total with core points and the 24-point check.
- [ ] Every subject entry in the data file has weightings and max marks traceable to an official IB source URL.
- [ ] `/tools/calendar` works logged out, with category filters, D-day counters and Google Calendar links, and every event has a source URL and `lastVerified` date.
- [ ] Both tool pages are in `public/sitemap.xml` after `node scripts/generate-sitemap.js`.
- [ ] Pages are usable at phone width with no horizontal scroll.
- [x] `npm run build` passes.
