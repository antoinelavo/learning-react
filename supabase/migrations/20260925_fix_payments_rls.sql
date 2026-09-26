-- payments (and, for the same reason, teacher_revealed_requests) ended up
-- with Row Level Security enabled despite 20260924_teacher_tier_system.sql
-- not doing that explicitly — this Supabase project apparently defaults
-- new tables to RLS-on. Confirmed by the actual error hit at checkout:
-- "new row violates row-level security policy for table \"payments\""
-- (42501), since with RLS on and no policy, every row is denied by default.
--
-- Fix: add fully permissive policies, matching the "acceptable risk for
-- now" trust model already agreed for this feature — there is no service
-- role key anywhere in this codebase, so the Toss success/webhook routes
-- run as the anon role with no forwarded user session, and an owner-scoped
-- policy would block them from reading/writing these rows just as much as
-- having no policy at all did.

alter table payments enable row level security;
drop policy if exists "open_all" on payments;
create policy "open_all" on payments for all using (true) with check (true);

alter table teacher_revealed_requests enable row level security;
drop policy if exists "open_all" on teacher_revealed_requests;
create policy "open_all" on teacher_revealed_requests for all using (true) with check (true);
