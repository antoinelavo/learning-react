-- PortOne V2 replaces Toss for card payments (premium listings and 플러스).
-- Old Toss rows keep their toss_order_id / toss_payment_key / order_id as
-- history; new card rows are keyed by the paymentId the client generates
-- and hands to PortOne.

alter table payments add column if not exists portone_payment_id text unique;
alter table payment_request add column if not exists portone_payment_id text unique;

-- Admin refunds. payments has a text status; payment_request has no status
-- in use (its smallint `status` column is always null), so a refund there
-- is recorded as a timestamp instead.
alter table payments drop constraint if exists payments_status_check;
alter table payments
  add constraint payments_status_check
  check (status in ('pending', 'paid', 'failed', 'refunded'));

alter table payment_request add column if not exists refunded_at timestamptz;

alter table payments alter column provider set default 'portone';
