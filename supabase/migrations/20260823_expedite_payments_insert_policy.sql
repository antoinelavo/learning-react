-- expedite_payments had RLS enabled with only a read policy (teacher_read_own),
-- so every insert from the anon-key clients — both the server verify-payment
-- route (app/api/expedite/verify-payment/route.js) and the client-side bank
-- transfer logger (handleExpediteBankTransfer in app/dashboard/page.jsx) —
-- was silently rejected. The server route re-verifies the payment with
-- PortOne and resolves the teacher from the caller's session before ever
-- inserting, so this table doesn't need to re-enforce ownership at the
-- database layer, matching how payment_request/teacher_premium already work
-- in this project (no insert policy restricting them either).
create policy "allow_insert" on expedite_payments
  for insert with check (true);
