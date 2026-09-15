-- payment_request needs a way to track whether a request has actually
-- been paid/handled. Card payments (Toss/NicePay) already auto-activate
-- premium via activatePremium() in lib/premiumActivation.js, which now
-- also stamps this status on the originating payment_request row.
-- Bank-transfer requests (no order_id — never touch Toss/NicePay) are
-- confirmed manually from the admin payments page, which calls the same
-- activatePremium() function.
alter table payment_request
  add column if not exists status text not null default 'pending';

alter table payment_request
  add column if not exists confirmed_at timestamptz;

-- (Postgres has no "ADD CONSTRAINT IF NOT EXISTS", so guard it manually —
-- matches the pattern already used in 20260905_add_nicepay_order_id.sql.)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'payment_request_status_check'
  ) then
    alter table payment_request
      add constraint payment_request_status_check check (status in ('pending', 'confirmed'));
  end if;
end $$;
