# Spec: Chat fixes and admin chat overview

## Goal
Fix the chat bugs behind "can't send messages" reports, stop empty chats from piling up (118 of 127 today), and give the admin a clear view of who is chatting with whom.

## Included
- **Reproduce send problems** on iOS Safari and the KakaoTalk in-app browser (Playwright device emulation plus a real-device check if possible). Fix whatever is found and write the findings in the PR description.
- **Chats are created on the first message.** "메시지 보내기" on a teacher profile opens a draft thread in the chat panel, and nothing is saved. On the first send, call `get_or_create_conversation`, then insert the message. The panel then switches to the real conversation.
- **Delete existing empty chats:** new migration `supabase/migrations/<date>_chat_cleanup_realtime.sql`:
  - `delete from conversations c where not exists (select 1 from messages m where m.conversation_id = c.id);`
  - add `public.messages` to the `supabase_realtime` publication, so live messages and the unread badge work.
- **Email deep link:** the new-message email links to `https://www.ibmaster.net/?chat=<conversation id>`. On any page, `?chat=` opens the chat panel on that conversation (or the list if the user isn't a participant). Logged-out users go to `/login` and come back to the same URL afterwards.
- **"메시지 보내기" visibility:** show the button only to logged-out visitors and students. Hide it for teachers, admins, and users without a role (today those users see the button, but clicking it fails).
- **Send hardening:**
  - Pressing Enter while Korean IME composition is active doesn't send (no double or partial send).
  - On a failed send, the typed text goes back into the input, and an inline error appears instead of only an `alert`.
  - The 전송 button is disabled while sending.
- **Admin chat page** (`/admin/conversations`):
  - Tabs: 전체 대화 / 선생님별 / 학생별.
  - 전체 대화 rows: `[선생님] name ↔ [학생] name` with role badges, message count, and last activity.
  - 선생님별 / 학생별 rows: one per person, with chat count, total messages, and last activity. Sortable by last activity or chat count.
  - Search by name or email.
  - Clicking a name anywhere opens `/admin/conversations/user/[id]`: name, role, email, and a list of that user's chats, each linking to `/admin/conversations/[id]`.
  - The conversation detail page header shows both names with role badges, each linking to that user's page.

## Not included
- Changing the RLS on `messages` or `conversations`, or the `get_or_create_conversation` logic.
- Teachers starting chats with students.
- Attachments, typing indicators, read receipts in the UI.
- Changing the email cooldown or template design (only the link changes).

## Rules
- **Database (Ask before changing, approved):** the cleanup and realtime changes go in one new migration file, run by hand in the Supabase dashboard. Code must not depend on it to send messages; without it, only live updates are missing.
- Realtime still goes through RLS: users receive only messages where they are sender or recipient.
- Admin data is read with the admin's session (existing `admin_select` RLS). Admin pages keep the client-side `role === 'admin'` check and the page shell `max-w-3xl mx-auto px-4 py-4`.
- UI uses `components/ui` (`Tabs`, `Badge`, `Button`, `Input`, `cardClasses`). Real buttons for actions, no arrow glyphs in labels.
- Site text is Korean. Role badges: `선생님`, `학생`.
- Student display names keep the existing fallback (username, else email local part).
- No payment, tier, or legal code is touched.

## Done when
- [x] Clicking "메시지 보내기" and closing the panel without sending creates no `conversations` row (no `get_or_create_conversation` request in a Playwright run).
- [x] Sending the first message creates the conversation and the message; later messages reuse it.
- [x] Playwright runs on iPhone (Safari) and Android emulation send a message successfully, including a Korean message submitted with Enter, which is sent exactly once.
- [x] A failed send keeps the typed text and shows an inline error.
- [x] Teachers, admins, and role-less users don't see "메시지 보내기".
- [x] `/?chat=<id>` opens the panel on that conversation for a participant; the email template uses that link.
- [x] The migration file exists with the cleanup delete and the publication change, and is listed in the PR as "run by hand".
- [x] `/admin/conversations` has the three tabs, role badges, sorting, and search; a name click opens `/admin/conversations/user/[id]` with that user's chats.
- [x] PR description lists the reproduction results for iOS Safari and the KakaoTalk in-app browser.
- [x] `npm run build` passes.
