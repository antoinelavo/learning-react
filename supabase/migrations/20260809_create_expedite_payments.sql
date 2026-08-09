-- Payment log for the "pay to expedite teacher profile approval" feature.
-- Card payments are auto-verified and auto-approve the teacher (see
-- app/api/expedite/verify-payment/route.js). Bank transfers are logged here
-- so admins can see who has paid and still needs manual approval.
create table if not exists expedite_payments (
  id            uuid primary key default gen_random_uuid(),
  payment_id    text unique,                 -- PortOne paymentId; null for bank_transfer rows
  teacher_id    bigint not null references teachers(id) on delete cascade,
  method        text not null check (method in ('card', 'bank_transfer')),
  amount        int not null,
  status        text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  requested_at  timestamptz not null default now(),
  completed_at  timestamptz
);

alter table expedite_payments enable row level security;

-- Teachers can read their own expedite payment history.
create policy "teacher_read_own" on expedite_payments
  for select using (
    teacher_id in (select id from teachers where user_id = auth.uid())
  );
