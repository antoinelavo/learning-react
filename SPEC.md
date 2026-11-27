# Spec: Teacher approval triage (duplicates, reject, auto-approve)

## Goal
Stop duplicate teacher profiles (made to get extra free reveals) from being approved by accident. Hide profiles that won't be approved. Auto-approve clean new profiles so the owner only reviews the doubtful ones.

## Included
- `lib/teacherDuplicates.js`: the duplicate rules, with no Supabase or Node-only imports (it takes plain arrays), so both server and admin page can use it.
- **Duplicate flag in `/admin` pending list** (`app/admin/components/TeacherList.jsx`):
  - For each pending profile, find matches among all other non-test teachers (pending, approved, and rejected; not `removed`, `taken down`, `deleted`).
  - A red "중복 의심" badge on the card lists each match: name, status, which signal matched, and a link to its profile (or admin search).
  - Approve on a flagged card first asks "중복으로 의심되는 프로필이 있습니다. 그래도 승인할까요?". Unflagged cards approve as before.
- **Reject button** next to Approve:
  - Asks for confirmation, then sets `teachers.status = 'rejected'`. No email is sent.
  - A rejected profile leaves the pending list.
  - A third tab, "반려됨 (N)", lists rejected profiles with a "되돌리기" button that sets them back to `pending`.
- **Auto-approve on submit**:
  - New route `app/api/teachers/auto-approve/route.js` (POST, no body needed). It verifies the caller with `getUserFromRequest`, finds that user's own `pending` teacher row, and checks every rule below with the service-role client.
  - If all rules pass, it sets `status = 'approved'` and `last_updated` today, and sends the existing approval email the same way `notify-approved` does (a failed email never undoes the approval). Otherwise it changes nothing and returns `{ approved: false }`.
  - The client calls it right after a successful insert in `app/apply/page.jsx` and ignores any failure. The success message is unchanged unless the profile was auto-approved, in which case it says so.
  - The route only considers a pending profile created in the last 10 minutes, so a rejected or edited profile can never approve itself.
- Auto-approve rules (all must hold):
  1. Not a duplicate by the rules below.
  2. Complete: `name`, `school`, `shortintroduction`, `longintroduction`, `contact_information`, `profile_picture`, `subjects` (at least one) are all filled in.
  3. The teacher's login email exists in `users.email`.
  4. Long intro is at least 100 characters of plain text (HTML tags stripped).
- Duplicate rules. A profile is flagged when it matches another profile on any one of:
  - **Contact info:** identical after lowercasing and removing spaces, dashes and punctuation (empty values never match).
  - **Intro text:** `longintroduction` (HTML stripped, whitespace and punctuation normalised) is identical, or at least 90% similar.
  - **Name + school:** name is very similar and school is the same after normalising. Name similarity: identical after removing spaces and punctuation and lowercasing, or an edit distance of at most 1 for names up to 4 characters and at most 2 for longer ones. School match: equal after the same normalisation.
  - Name alone never flags.
- The dashboard already shows "반려됨" for `rejected`, so the teacher sees their status there (no change needed).

## Not included
- A database migration: `teachers.status` has no check constraint, and admin RLS already allows the update.
- Rejection emails or a rejection reason.
- Auto-reject, or blocking the Approve button for duplicates.
- Auto-approving profiles that are edited later (editing from `/dashboard` still resets the status to `pending` as it does today; a rejected teacher who edits comes back to the pending list).
- Fuzzy matching on photo or student ID.
- Changes to `/admin/teachers` (the search table) or to Plus/premium tiers.
- A cleanup of existing duplicate profiles.

## Rules
- Test teachers (`is_test = true`) are never matches.
- The auto-approve route trusts only the bearer token. It never takes a teacher id from the client, and never approves a profile that isn't the caller's own and `pending`.
- It uses the activation guard style of the other routes: update only where `status = 'pending'`, so a double call approves once and sends one email.
- Service-role client only on the server (`getSupabaseAdmin()` / `supabaseAdmin`), never imported from client code.
- Admin pages keep using the admin session and RLS for approve, reject and restore (as `approveTeacher` does now); the email goes through `authFetch` to `notify-approved`.
- Do not log or return other teachers' contact info to the caller of the auto-approve route; it returns only `{ approved, reason }` where reason is a short code (`duplicate`, `incomplete`, `no_email`, `short_intro`).
- Site text in Korean; code, comments and commit messages in English. Cards keep the `components/ui` kit (`Button`, `Badge`, `Tabs`, `cardClasses`).
- Touches no "Ask before changing" areas (no payments, migrations, blog or legal pages). It does change who gets approved, so the owner reviews the rules above before merging.

## Done when
- [x] `lib/teacherDuplicates.js` flags a contact-info match, a near-identical intro, and a similar name with the same school, and does not flag a name-only match, shown by a script run with sample inputs (output pasted in the build summary).
- [ ] The pending list shows the "중복 의심" badge with each match's name, status and signal, using real pending data read from the live database (no personal data pasted in the summary).
- [x] Approving a flagged card asks for confirmation; approving an unflagged card does not.
- [ ] Reject sets `status = 'rejected'` after confirmation, removes the card, sends no email, and the "반려됨" tab shows it with a working "되돌리기" (checked by reading `TeacherList.jsx`; no live data was changed).
- [x] `POST /api/teachers/auto-approve` returns 401 without a token, `{ approved: false }` for a profile that fails each rule, and approves only the caller's own pending profile (checked against a local run with a stub, and by code reading; no real teacher was approved).
- [ ] `app/apply/page.jsx` calls the route after a successful insert and ignores its errors.
- [x] `npm run build` passes.
