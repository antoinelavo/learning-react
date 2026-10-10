# Spec: PortOne payments (replace Toss)

## Goal
Move all card payments (premium listings and the 플러스 tier) from Toss to PortOne V2 using the approved KG이니시스 channel, add admin refunds, and remove the Toss and NicePay code.

## Included
- **`lib/portone.js`** (server): get a payment by ID, cancel (full refund), and verify webhook signatures, using the PortOne V2 REST API with `PORTONE_API_SECRET`.
- **Checkout:** `PremiumListingOffer` and `TierUpgradeOffer` use the PortOne browser SDK (`@portone/browser-sdk`) `requestPayment` with `storeId`, the KG이니시스 `channelKey`, `payMethod: 'CARD'`, the amount, and an order name.
  - Before the payment window opens, the client inserts the pending row with a new `paymentId` (same pattern as today).
  - PC popup: once the SDK promise resolves, the client calls the server complete route.
  - Mobile redirect: `redirectUrl` points to the same complete route.
- **Complete routes** (replace `app/api/toss/*`):
  - `app/api/portone/complete`: premium listing.
  - `app/api/portone/tier-complete`: 플러스.
  - Each fetches the payment from PortOne, checks `status === 'PAID'` and that the amount matches the DB row, then calls the existing activation function. They redirect to the same dashboard success/fail URLs used today.
- **Webhook** `app/api/portone/webhook`: verifies the signature with `PORTONE_WEBHOOK_SECRET`, re-fetches the payment, and on `PAID` routes it to premium or tier activation based on which table holds the `paymentId`. Always returns 200 once the signature is valid.
- **Refunds:** a `환불` button on card-paid rows in `/admin/payments` and `/admin/plus-payments`, behind a confirm dialog. It calls an admin-only API route that:
  - cancels the full amount through PortOne;
  - sets the row to `refunded`;
  - removes the premium listing (`teacher_premium` / `successful_payments` linked rows), or sets the teacher to `free` unless another paid payment backs 플러스 (same rule as `undoPlusBankTransfer`).
- **카카오페이 flag:** an optional `NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY`. When it is set, a `카카오페이` button appears next to card checkout (`payMethod: 'EASY_PAY'`). When it is unset, the button is hidden.
- **Migration** (new file in `supabase/migrations/`): add `portone_payment_id text unique` to `payments` and `payment_request`, and allow status `refunded` on both.
- **Removals:** `lib/toss.js`, `lib/nicepay.js`, `app/api/toss/`, `app/api/nicepay/`, the Toss `<Script>` tags, and the TEMP DEBUG code in `TierUpgradeOffer`. Update `CLAUDE.md` to say PortOne instead of Toss/NicePay.
- **Env vars:** `NEXT_PUBLIC_PORTONE_STORE_ID`, `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` (KG이니시스, test or live), `NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY` (optional), `PORTONE_API_SECRET`, `PORTONE_WEBHOOK_SECRET`.

## Not included
- 계좌이체, 가상계좌, partial refunds, subscriptions or auto-renewal.
- Changes to prices, plan contents, or the premium spot limit.
- Changes to the bank-transfer flow (it stays as is).
- Moving old Toss payment rows; they keep their `toss_*` columns as history.
- Receipt or refund emails.
- Legal page edits. The privacy policy may need KG이니시스/PortOne listed as 처리위탁 recipients; that is a separate change for you to decide on.

## Rules
- **Ask before changing** areas touched (approved in this spec): payment code, `supabase/migrations/`.
  - The migration must be run by hand in the Supabase dashboard **before** deploying.
  - `PORTONE_WEBHOOK_SECRET` and the webhook URL (`https://www.ibmaster.net/api/portone/webhook`) are set in the PortOne console.
- Never trust client- or redirect-supplied status or amounts. Always re-fetch from PortOne and compare against the DB row and the fixed prices.
- Keep the idempotent `pending → paid` guard in `lib/premiumActivation.js` and `lib/tierActivation.js`; switch their lookups to `portone_payment_id`. Refunds use the same kind of guard (`paid → refunded` only once).
- The refund API checks that the caller is an admin (`users.role`) before calling PortOne.
- Secrets are server-only; only the store ID and channel keys are `NEXT_PUBLIC_`.
- Korean user-facing text; English code and comments. Payment error messages stay the same as today's.
- Rollout: Vercel preview with the KG이니시스 test channel first, then the live channel key in production.

## Done when
- [x] No references to Toss or NicePay remain in `app/`, `components/`, or `lib/` (grep is clean), and the Toss/NicePay files are deleted.
- [ ] On a preview deployment with the test channel, buying a premium listing by card activates it and the payment row shows `paid` with a `portone_payment_id`.
- [ ] Buying 플러스 by card on preview sets `teachers.tier` to the paid tier, and the row shows `paid`.
- [ ] Both purchases work on desktop (popup) and on mobile (redirect).
- [ ] Firing the webhook after a payment is already `paid` changes nothing. A webhook with a bad signature is rejected and activates nothing.
- [ ] Changing the amount on the client makes the complete route fail with `amount_mismatch`, and nothing is activated.
- [ ] Admin `환불` on a card row cancels it in the PortOne console, sets the row to `refunded`, and removes the premium listing or 플러스 tier. Clicking twice does not refund twice. Non-admins get 403.
- [ ] With `NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY` unset, no 카카오페이 button shows; with it set, the button shows.
- [x] The migration file exists and adds `portone_payment_id` plus the `refunded` status to both tables.
- [x] `npm run build` passes.
