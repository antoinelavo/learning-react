-- payment_request needs a way to track whether a request has actually
-- been paid/handled. Card payments (Toss/NicePay) already auto-activate
-- premium via activatePremium() in lib/premiumActivation.js, which now
-- also stamps this on the originating payment_request row. Bank-transfer
-- requests (no order_id — never touch Toss/NicePay) are confirmed
-- manually from the admin payments page, which calls the same
-- activatePremium() function.
--
-- Named admin_confirmed (not "status") because payment_request already
-- has an unrelated smallint `status` column from an earlier schema.
alter table payment_request
  add column if not exists admin_confirmed boolean not null default false;

alter table payment_request
  add column if not exists confirmed_at timestamptz;
