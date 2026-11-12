# Spec: Upgrade emails for 플러스 and premium profile teachers

## Goal
When an admin upgrades a teacher to 플러스 or turns on their premium profile from the admin pages, the teacher gets a Korean confirmation email. Also delete the unused daily digest cron.

## Included
- `/admin/plus-payments`: turning 입금 확인 on (after `confirmPlusBankTransfer` succeeds and was not `alreadyProcessed`) sends the 플러스 email.
- `/admin/tiers`: switching a teacher from free to 플러스 (after the update succeeds) sends the 플러스 email.
- `/admin/payments`: turning 입금 확인 on (after `activatePremium` succeeds and was not `alreadyProcessed`) sends the premium email.
- New admin-only API route(s) under `app/api/teachers/` (e.g. `notify-plus`, `notify-premium`), following `app/api/teachers/notify-approved/route.js`: verify with `getAdminFromRequest`, look up the teacher and their `users.email` with `getSupabaseAdmin()`, send through Resend, return `{ ok }`.
- Admin pages call them through `authFetch`.
- New templates in `lib/email/` in the same style as `approvalTemplate.js` (no unsubscribe link).
- Delete `app/api/cron/daily-digest/` and remove its mentions from `CLAUDE.md` and `content/security/audit-routine-prompt.md`. Repoint the comment in `lib/email/approvalTemplate.js` that cites the digest.

## Not included
- Toss card payments (`app/api/toss/*`, `lib/toss.js`): untouched, no email.
- No changes to `lib/tierActivation.js` or `lib/premiumActivation.js`.
- No email on undo or downgrade (turning 입금 확인 off, or 플러스 off in `/admin/tiers`).
- No database or migration changes.
- No guard against re-sending: undo then re-confirm sends the email again.

## Rules
- The email never blocks or reverts an upgrade. It is sent only after the upgrade succeeded.
- If the email fails (no email on file, Resend error, route error), the admin page shows a notice: `업그레이드는 완료되었지만 이메일 발송에 실패했습니다.` The upgrade stays.
- The premium email reads subjects and dates from the `teacher_premium` row created by that confirmation (matched by `payment_request_id`), not from the request body.
- Recipient is the teacher's account email (`users.email` via `teachers.user_id`). `TEST_OVERRIDE_EMAIL` does not apply (it's only for subscriber emails), unless noted otherwise later.
- Links use `https://www.ibmaster.net`. From address: `RESEND_FROM_EMAIL` (same fallback as the existing routes).
- Dates in Korean format (e.g. `2026년 11월 12일`).
- Touches admin payment pages (`/admin/payments`, `/admin/plus-payments`) only to add the email call after success. Activation logic, prices, and idempotency guards are unchanged.

### 플러스 email
- Subject: `[IBMaster] 플러스 업그레이드가 완료되었습니다`
- Body:
  > 축하합니다, {이름} 선생님!
  >
  > 플러스 업그레이드가 완료되었습니다. 지금부터 다음 혜택을 이용하실 수 있습니다.
  > - 학생 요청글 연락처 무제한 열람
  > - 별도의 갱신 없이 계속 유지
  >
  > 새로 올라오는 학생 요청을 가장 먼저 확인하고, 좋은 수업 인연을 만들어 보세요.
  >
  > [학생 찾기 바로가기] → `/students`

### Premium email
- Subject: `[IBMaster] 프리미엄 프로필 등록이 완료되었습니다`
- Body:
  > 축하합니다, {이름} 선생님!
  >
  > 입금이 확인되어 프리미엄 프로필 등록이 완료되었습니다.
  > - 노출 과목: {과목 목록}
  > - 노출 기간: {시작일} ~ {종료일}
  >
  > 기간 동안 해당 과목을 검색하는 학생과 학부모님께 선생님의 프로필이 가장 먼저 보여집니다. 프로필 사진과 소개글을 최신 상태로 유지하시면 더 많은 문의를 받으실 수 있습니다.
  >
  > [내 프로필 보기] → the teacher's `/profile/...` page; [대시보드에서 수정하기] → `/dashboard`

## Done when
- [ ] Confirming a 플러스 bank transfer on `/admin/plus-payments` calls the 플러스 email route; undo does not.
- [ ] Switching free → 플러스 on `/admin/tiers` calls the 플러스 email route; 플러스 → free does not.
- [ ] Confirming a premium payment on `/admin/payments` calls the premium email route with the confirmed request; undo does not.
- [ ] Email routes return 401 without an admin token.
- [ ] A failed email shows the notice on the admin page and the upgrade remains.
- [ ] Email text matches the Korean above exactly.
- [ ] No diff in `app/api/toss/`, `lib/toss.js`, `lib/tierActivation.js`, `lib/premiumActivation.js`, or `supabase/`.
- [ ] `app/api/cron/daily-digest/` is gone and no references to it remain.
- [ ] `npm run build` passes.
