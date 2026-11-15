-- Security audit 2026-11-10. NOT run automatically: review, then run by hand
-- in the Supabase SQL editor.
--
-- Background: these tables exist in the live database but in no migration on
-- main (they come from the open PRs for the IB resources marketplace, PortOne
-- payments and expedited approval). Their policies grant the `public` role
-- (which includes anon) write access with `true`. Nothing on main reads or
-- writes them. The service-role key bypasses RLS, so server routes keep
-- working after these policies are dropped.
--
-- Before running: confirm the open PRs (#12, #30, #50) write to these tables
-- only from server routes that use getSupabaseAdmin(), not the anon client.

-- expedite_payments: anyone could read, insert and update every row.
drop policy if exists "allow_insert" on public.expedite_payments;
drop policy if exists "allow_select_all" on public.expedite_payments;
drop policy if exists "allow_update_all" on public.expedite_payments;
-- Keep teacher_read_own. Admins read through is_admin().
create policy "expedite_payments_admin_select" on public.expedite_payments
  for select to authenticated using (is_admin());

-- payouts: anyone could insert and update payout rows.
drop policy if exists "server_insert" on public.payouts;
drop policy if exists "server_update" on public.payouts;

-- purchases: anyone could insert and update purchases (payment_key, status).
drop policy if exists "server_insert" on public.purchases;
drop policy if exists "server_update" on public.purchases;

-- resources: anyone could insert and update listings (price, file_key, status).
drop policy if exists "server_insert" on public.resources;
drop policy if exists "server_update" on public.resources;

-- blog_posts: anyone could insert posts and update any column of any row.
-- Nothing on main uses this table (the blog is MDX files). Drop the write
-- policies; reads stay public.
drop policy if exists "Allow update for find_page_clicks" on public.blog_posts;
drop policy if exists "Only allow updating find_page_clicks" on public.blog_posts;
drop policy if exists "Enable insert for all users" on public.blog_posts;

-- Defense in depth: anon/authenticated hold every table privilege (including
-- TRUNCATE and DELETE) on these tables. RLS blocks them today; revoke anyway.
revoke truncate, trigger, references, delete on
  public.expedite_payments, public.payouts, public.purchases,
  public.resources, public.blog_posts
  from anon, authenticated;
revoke insert, update on
  public.expedite_payments, public.payouts, public.purchases,
  public.resources, public.blog_posts
  from anon;

-- Functions: fixed search_path (advisor: function_search_path_mutable).
alter function public.community_bump_comment_like_count() set search_path = public;
alter function public.community_bump_comment_count() set search_path = public;
alter function public.community_bump_post_like_count() set search_path = public;
alter function public.update_updated_at() set search_path = public;
alter function public.is_client_request() set search_path = public;

-- Trigger-only SECURITY DEFINER functions should not be callable through
-- /rest/v1/rpc. Triggers still run (they do not need EXECUTE for the caller).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_conversation_on_message() from public, anon, authenticated;
