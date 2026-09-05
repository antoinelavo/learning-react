-- NicePay migration: payment_request needs an order_id so the server-side
-- returnUrl/webhook handlers (which get no JS context back from NicePay)
-- can look up which teacher/subjects/duration/amount an order belongs to.
alter table payment_request
  add column if not exists order_id text unique;

-- successful_payments.payment_id needs to be unique so activatePremium()
-- can safely be called from both the returnUrl handler and the webhook
-- for the same payment without double-activating premium.
-- (Postgres has no "ADD CONSTRAINT IF NOT EXISTS", so guard it manually.)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'successful_payments_payment_id_key'
  ) then
    alter table successful_payments
      add constraint successful_payments_payment_id_key unique (payment_id);
  end if;
end $$;
