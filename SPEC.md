# Spec: Tap to reveal 수업료 설명 on profiles

## Goal
Keep the profile's info card tidy by hiding the teacher's rate note (`rate_description`) until the visitor taps the 수업료 pill.

## Included
- In `pages/profile/[name].js`, for logged-in visitors:
  - Teachers **with** a `rate_description`: the 수업료 pill becomes a button with a small ⓘ icon at its end. Tapping it shows the note below the pills; tapping again hides it. Starts closed.
  - Teachers **without** a `rate_description`: the pill looks and behaves exactly as now (no icon, not tappable), and no note area is rendered.
- The note keeps its current style (small gray text, wraps, line breaks kept).

## Not included
- Logged-out view (still the "수업료: 로그인 후 확인" link pill; the note stays hidden).
- SEO, meta description, JSON-LD.
- Rate entry forms or any data change.

## Rules
- No arrow/chevron icons; use an info (ⓘ) icon.
- The button has `aria-expanded` and is keyboard-accessible.
- Whitespace-only notes count as no note.
- Same behavior at 390px and 1280px.

## Done when
- [ ] Logged in, a teacher with a note shows the pill with an ⓘ icon and no note text until tapped.
- [ ] Tapping the pill shows the note; tapping again hides it.
- [ ] A teacher without a note shows a plain pill (no icon, not a button) and no note.
- [ ] Logged out, nothing changes from the current behavior.
- [ ] `npm run build` passes.
