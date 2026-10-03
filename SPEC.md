# Spec: 플러스 bank-transfer admin page

## Goal
Let the admin see which teachers clicked "결제하기 (계좌이체)" on the 플러스 upgrade card, and confirm their transfer with one switch that also activates 플러스. Mirrors the premium profile's `/admin/payments` page.

## Included
- New admin page `/admin/plus-payments` (`app/admin/plus-payments/`), admin-only, same layout and access check as `/admin/payments`. Title: "플러스 결제 요청".
- Table of `payments` rows where `provider = 'bank_transfer'`, pending first, then newest first. Columns: 선생님 (name from `teachers`), 금액, 요청일, 상태 (대기 / 확인됨), 입금 확인 (toggle switch).
- Switch ON → confirm popup → payment `status = 'paid'` and teacher `tier = 'premium'` (via the existing `activate_plus_tier` RPC).
- Switch OFF → confirm popup → payment `status = 'pending'` and teacher `tier = 'free'`.
- New card on `/admin` home linking to the page, showing the number of pending requests.
- `components/TierUpgradeOffer.js`: before inserting a bank-transfer row, check for an existing `pending` `bank_transfer` row for that teacher. If one exists, just show the account info and don't insert.

## Not included
- Email or other notifications on click.
- Toss card payment rows (test mode) in this list.
- Changes to `/admin/payments`, `/admin/tiers`, prices, or the Toss routes.
- Any migration or schema/RLS change.

## Rules
- Touches payment and tier activation code (approved in interview): only `TierUpgradeOffer.js`'s bank-transfer handler and new admin confirm/undo helpers. Toss flow and `activatePlusTier` stay unchanged.
- No new migration: uses existing `payments` table (open RLS), `teachers.tier`, and `activate_plus_tier` RPC.
- Admin UI text in Korean, matching `/admin/payments` wording and switch style.
- Errors show an alert and leave the row unchanged.
- Empty state: "결제 요청이 없습니다."
- Table scrolls horizontally on mobile (`overflow-x-auto`), like other admin tables.

## Done when
- [ ] `/admin/plus-payments` redirects non-admins and lists bank-transfer `payments` rows with teacher names, pending first.
- [ ] Turning a switch on sets the row to `paid` and the teacher to 플러스; turning it off reverts both.
- [ ] `/admin` home has a card linking to the page with the pending count.
- [ ] Clicking "계좌이체" twice across reloads creates only one pending row.
- [ ] `npm run build` passes.
