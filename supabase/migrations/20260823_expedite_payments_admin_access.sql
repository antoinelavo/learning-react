-- The existing teacher_read_own SELECT policy only lets a teacher see their
-- own expedite_payments rows, which would block admin's queries (the admin
-- account has no matching row in teachers). Add open select/update policies
-- so the admin panel can list pending bank-transfer requests and mark them
-- confirmed. This matches the permissive-RLS convention already used
-- elsewhere in this schema for the other payment tables (payment_request,
-- teacher_premium have no restrictive insert/select policies either).
create policy "allow_select_all" on expedite_payments
  for select using (true);

create policy "allow_update_all" on expedite_payments
  for update using (true) with check (true);
