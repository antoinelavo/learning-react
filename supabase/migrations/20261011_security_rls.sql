-- 20261011_security_rls.sql
--
-- Security hardening: RLS on every table the site uses, column-level
-- privileges to hide contact info / password hashes / bank details, and
-- RPCs for the few things the browser used to do with direct table access.
--
-- ROLLOUT ORDER (run by hand in the Supabase SQL editor):
--   1. Add SUPABASE_SERVICE_ROLE_KEY to Vercel (server-only, not NEXT_PUBLIC_).
--   2. Merge and deploy the matching code (lib/supabaseAdmin.js etc.).
--   3. Run this file right after the deploy finishes.
-- Between steps 2 and 3, pages that call the new RPCs below will fail.
--
-- Server routes (Toss/NicePay, cron, notify emails, dashboard stats) use the
-- service role, which bypasses RLS. Everything else runs as anon or
-- authenticated and is governed by the policies here.

begin;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

-- True for direct client requests (anon / logged-in users). False for the
-- service role and for SECURITY DEFINER functions, which run as their owner.
create or replace function public.is_client_request()
returns boolean
language sql
stable
as $$
  select current_user in ('anon', 'authenticated');
$$;

-- ---------------------------------------------------------------------------
-- users: stop self-promotion to admin, stop public reads of every email
-- ---------------------------------------------------------------------------

drop policy if exists "Allow non-deleted users to read their own data" on public.users;
drop policy if exists "Allow users to update their own data" on public.users;
drop policy if exists "Block deleted users from logging in" on public.users;
drop policy if exists "Prevent deleted users from accessing data" on public.users;
drop policy if exists "Prevent deleted users from deleting their data" on public.users;
drop policy if exists "Prevent deleted users from modifying their data" on public.users;
drop policy if exists "Users can insert themselves" on public.users;
drop policy if exists "Users can update their own role" on public.users;

alter table public.users enable row level security;

create policy users_select_own on public.users
  for select to authenticated using (id = auth.uid());
create policy users_select_admin on public.users
  for select to authenticated using (public.is_admin());
-- Chat shows the other participant's name/email.
create policy users_select_chat_partner on public.users
  for select to authenticated using (
    exists (
      select 1 from public.conversations c
      where (c.student_id = users.id and c.teacher_id = auth.uid())
         or (c.teacher_id = users.id and c.student_id = auth.uid())
    )
  );
create policy users_insert_own on public.users
  for insert to authenticated with check (id = auth.uid());
create policy users_update_own on public.users
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy users_update_admin on public.users
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Users may pick student/teacher once (role select modal) and may mark
-- themselves deleted. Everything else is admin/service only.
create or replace function public.protect_user_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.is_client_request() or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role is not null and new.role not in ('student', 'teacher') then
      new.role := null;
    end if;
    return new;
  end if;

  new.id := old.id;
  new.email := old.email;
  new.date_created := old.date_created;
  if new.role is distinct from old.role
     and not (old.role is null and new.role in ('student', 'teacher')) then
    new.role := old.role;
  end if;
  if new.status is distinct from old.status and new.status is distinct from 'deleted' then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_user_columns on public.users;
create trigger protect_user_columns
  before insert or update on public.users
  for each row execute function public.protect_user_columns();

-- Signup metadata is user-controlled; never trust a role other than
-- student/teacher from it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, username, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'username',
    case when new.raw_user_meta_data ->> 'role' in ('student', 'teacher')
         then new.raw_user_meta_data ->> 'role' end
  );
  return new;
end;
$$;

-- Signup page duplicate check (users is no longer publicly readable).
create or replace function public.check_signup_available(p_email text, p_username text)
returns table (email_taken boolean, username_taken boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.users where email = p_email),
    exists (select 1 from public.users where username = p_username);
$$;

-- ---------------------------------------------------------------------------
-- teachers: hide bank details / student ID / email, lock tier and counters
-- ---------------------------------------------------------------------------

drop policy if exists "Allow public update on click_count" on public.teachers;
drop policy if exists "Enable insert for all users" on public.teachers;
drop policy if exists "Enable read access for all users" on public.teachers;

alter table public.teachers enable row level security;

create policy teachers_select_public on public.teachers
  for select to anon, authenticated using (true);
create policy teachers_insert_own on public.teachers
  for insert to authenticated with check (user_id = auth.uid()::text);
create policy teachers_update_own on public.teachers
  for update to authenticated
  using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);
create policy teachers_admin_all on public.teachers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke select on public.teachers from anon, authenticated;
grant select (
  id, name, preferred_lesson_time, school, age, gender, shortintroduction,
  longintroduction, experience, contact_information, profile_picture, status,
  subjects, lesson_type, extra_subject, last_updated, created_date,
  click_count, "IB", user_id, profile_clicks, rate, rate_description,
  tier, reveal_count, reveal_reset_at, is_test
) on public.teachers to anon, authenticated;
-- Not granted: bank_name, bank_account_number, bank_account_holder,
-- student_id_number, email, referral_source. Owners and admins read them
-- through get_my_teacher_profile() / admin_list_teachers().

create or replace function public.protect_teacher_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.is_client_request() or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.tier := 'free';
    new.reveal_count := 0;
    new.reveal_reset_at := now();
    new.is_test := false;
    new.click_count := 0;
    new.profile_clicks := 0;
    return new;
  end if;

  new.id := old.id;
  new.user_id := old.user_id;
  new.tier := old.tier;
  new.reveal_count := old.reveal_count;
  new.reveal_reset_at := old.reveal_reset_at;
  new.is_test := old.is_test;
  new.click_count := old.click_count;
  new.profile_clicks := old.profile_clicks;
  new.created_date := old.created_date;
  -- Editing a profile sends it back to review; only admins can approve.
  if new.status is distinct from old.status and new.status is distinct from 'pending' then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_teacher_columns on public.teachers;
create trigger protect_teacher_columns
  before insert or update on public.teachers
  for each row execute function public.protect_teacher_columns();

create or replace function public.get_my_teacher_profile()
returns setof public.teachers
language sql
stable
security definer
set search_path = public
as $$
  select * from public.teachers where user_id = auth.uid()::text;
$$;

create or replace function public.admin_list_teachers(p_status text default null)
returns setof public.teachers
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_allowed';
  end if;
  return query
    select * from public.teachers
    where p_status is null or status = p_status
    order by created_date desc;
end;
$$;

-- Profile "연락처 보기" click counter (was a public UPDATE on any column).
create or replace function public.increment_teacher_click(p_name text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.teachers set click_count = coalesce(click_count, 0) + 1 where name = p_name;
$$;

-- ---------------------------------------------------------------------------
-- student_jobs: hide email / kakao_contact / password hash
-- ---------------------------------------------------------------------------

alter table public.student_jobs enable row level security;

create policy student_jobs_select_public on public.student_jobs
  for select to anon, authenticated using (true);
create policy student_jobs_insert_public on public.student_jobs
  for insert to anon, authenticated
  with check (status = 'OPEN' and coalesce(views_count, 0) = 0 and found_teacher_through_platform is null);

revoke select, update, delete on public.student_jobs from anon, authenticated;
grant select (
  id, subject, level, description, format, status, created_at, region, title,
  hourly_rate_min, hourly_rate_max, views_count, found_teacher_through_platform
) on public.student_jobs to anon, authenticated;

-- Contact info for a teacher who has revealed this request (the reveal
-- itself, with the free-tier limit, happens in reveal_student_job), or admin.
create or replace function public.get_student_job_contact(p_student_job_id uuid)
returns table (email text, kakao_contact text)
language sql
stable
security definer
set search_path = public
as $$
  select j.email, j.kakao_contact
  from public.student_jobs j
  where j.id = p_student_job_id
    and (
      public.is_admin()
      or (
        j.status = 'OPEN'
        and exists (
          select 1
          from public.teacher_revealed_requests r
          join public.teachers t on t.id = r.teacher_id
          where r.student_job_id = j.id
            and t.user_id = auth.uid()::text
            and t.status = 'approved'
        )
      )
    );
$$;

-- Owner's contact fields for the edit form. Returns no row on a wrong password.
create or replace function public.get_student_job_for_edit(p_id uuid, p_password_hash text)
returns table (email text, kakao_contact text)
language sql
stable
security definer
set search_path = public
as $$
  select email, kakao_contact
  from public.student_jobs
  where id = p_id and edit_password_hash is not null and edit_password_hash = p_password_hash;
$$;

-- Password-checked edit. Only the listed keys in p_changes are applied.
create or replace function public.update_student_job_with_password(
  p_id uuid, p_password_hash text, p_changes jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if p_changes ? 'status' and p_changes ->> 'status' not in ('OPEN', 'CLOSED') then
    raise exception 'invalid_status';
  end if;

  update public.student_jobs set
    status = case when p_changes ? 'status' then p_changes ->> 'status' else status end,
    found_teacher_through_platform = case when p_changes ? 'found_teacher_through_platform'
      then (p_changes ->> 'found_teacher_through_platform')::boolean else found_teacher_through_platform end,
    title = case when p_changes ? 'title'
      then array(select jsonb_array_elements_text(p_changes -> 'title')) else title end,
    subject = case when p_changes ? 'subject' then p_changes ->> 'subject' else subject end,
    level = case when p_changes ? 'level' then p_changes ->> 'level' else level end,
    description = case when p_changes ? 'description' then p_changes ->> 'description' else description end,
    format = case when p_changes ? 'format' then p_changes ->> 'format' else format end,
    email = case when p_changes ? 'email' then p_changes ->> 'email' else email end,
    kakao_contact = case when p_changes ? 'kakao_contact' then p_changes ->> 'kakao_contact' else kakao_contact end
  where id = p_id and edit_password_hash is not null and edit_password_hash = p_password_hash;

  get diagnostics n = row_count;
  return n > 0;
end;
$$;

-- Was SECURITY INVOKER; with RLS on it would silently update nothing.
create or replace function public.increment_views_count(job_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.student_jobs set views_count = coalesce(views_count, 0) + 1
  where id = job_id and auth.uid() is not null;
$$;

-- reveal_student_job: same logic as 20260924_teacher_tier_system.sql, plus
-- the caller must own p_teacher_id (before, anyone could pass any teacher's
-- id, including a 플러스 teacher's) and the request must be open.
create or replace function public.reveal_student_job(p_teacher_id integer, p_student_job_id uuid)
returns table (revealed boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier text;
  v_count int;
  v_reset timestamptz;
begin
  if not exists (
    select 1 from public.teachers
    where id = p_teacher_id and user_id = auth.uid()::text and status = 'approved'
  ) then
    return query select false, 'teacher_not_found';
    return;
  end if;

  if not exists (select 1 from public.student_jobs where id = p_student_job_id and status = 'OPEN') then
    return query select false, 'not_open';
    return;
  end if;

  if exists (
    select 1 from public.teacher_revealed_requests
    where teacher_id = p_teacher_id and student_job_id = p_student_job_id
  ) then
    return query select true, 'already_revealed';
    return;
  end if;

  select tier, reveal_count, reveal_reset_at into v_tier, v_count, v_reset
  from public.teachers where id = p_teacher_id
  for update;

  if v_tier = 'premium' then
    insert into public.teacher_revealed_requests (teacher_id, student_job_id)
      values (p_teacher_id, p_student_job_id)
      on conflict (teacher_id, student_job_id) do nothing;
    return query select true, 'premium';
    return;
  end if;

  if now() > v_reset + interval '30 days' then
    v_count := 0;
    update public.teachers set reveal_count = 0, reveal_reset_at = now() where id = p_teacher_id;
  end if;

  if v_count >= 2 then
    return query select false, 'limit_reached';
    return;
  end if;

  insert into public.teacher_revealed_requests (teacher_id, student_job_id)
    values (p_teacher_id, p_student_job_id)
    on conflict (teacher_id, student_job_id) do nothing;

  if found then
    update public.teachers set reveal_count = reveal_count + 1 where id = p_teacher_id;
  end if;

  return query select true, 'free_reveal';
end;
$$;

-- ---------------------------------------------------------------------------
-- hagwon_requests: same treatment as student_jobs
-- ---------------------------------------------------------------------------

drop policy if exists "Anyone can create hagwon requests" on public.hagwon_requests;
drop policy if exists "Anyone can update hagwon requests" on public.hagwon_requests;
drop policy if exists "Anyone can view hagwon requests" on public.hagwon_requests;

alter table public.hagwon_requests enable row level security;

create policy hagwon_requests_select_public on public.hagwon_requests
  for select to anon, authenticated using (true);
create policy hagwon_requests_insert_public on public.hagwon_requests
  for insert to anon, authenticated
  with check (status = 'OPEN' and coalesce(views_count, 0) = 0 and found_hagwon_through_platform is null);

revoke select, update, delete on public.hagwon_requests from anon, authenticated;
grant select (
  id, created_at, program_type, ib_subjects, sat_subjects, format, region, level,
  title, description, hourly_rate_min, hourly_rate_max, status,
  found_hagwon_through_platform, views_count
) on public.hagwon_requests to anon, authenticated;

-- Contact info for hagwon accounts on open requests, or admin.
create or replace function public.get_hagwon_request_contact(p_request_id uuid)
returns table (email text, kakao_contact text)
language sql
stable
security definer
set search_path = public
as $$
  select h.email, h.kakao_contact
  from public.hagwon_requests h
  where h.id = p_request_id
    and (
      public.is_admin()
      or (
        h.status = 'OPEN'
        and exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'hagwon')
      )
    );
$$;

-- Read-only password check for the hagwon request edit modal.
create or replace function public.verify_hagwon_request_password(p_id uuid, p_password_hash text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.hagwon_requests
    where id = p_id and edit_password_hash is not null and edit_password_hash = p_password_hash
  );
$$;

create or replace function public.update_hagwon_request_with_password(
  p_id uuid, p_password_hash text, p_changes jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if p_changes ? 'status' and p_changes ->> 'status' not in ('OPEN', 'CLOSED') then
    raise exception 'invalid_status';
  end if;

  update public.hagwon_requests set
    status = case when p_changes ? 'status' then p_changes ->> 'status' else status end,
    found_hagwon_through_platform = case when p_changes ? 'found_hagwon_through_platform'
      then (p_changes ->> 'found_hagwon_through_platform')::boolean else found_hagwon_through_platform end
  where id = p_id and edit_password_hash is not null and edit_password_hash = p_password_hash;

  get diagnostics n = row_count;
  return n > 0;
end;
$$;

create or replace function public.increment_hagwon_views_count(request_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.hagwon_requests set views_count = coalesce(views_count, 0) + 1
  where id = request_id and auth.uid() is not null;
$$;

-- ---------------------------------------------------------------------------
-- View tracking
-- ---------------------------------------------------------------------------

alter table public.student_job_views enable row level security;
create policy student_job_views_insert_own on public.student_job_views
  for insert to authenticated with check (teacher_user_id = auth.uid());
create policy student_job_views_select_own on public.student_job_views
  for select to authenticated using (teacher_user_id = auth.uid() or public.is_admin());

drop policy if exists "Authenticated users can insert views" on public.hagwon_request_views;
drop policy if exists "Users can view their own views" on public.hagwon_request_views;
alter table public.hagwon_request_views enable row level security;
create policy hagwon_request_views_insert_own on public.hagwon_request_views
  for insert to authenticated with check (teacher_user_id = auth.uid());
create policy hagwon_request_views_select_own on public.hagwon_request_views
  for select to authenticated using (teacher_user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------

-- payment_request: teachers create their own pending request (Toss order or
-- bank transfer); admins confirm. Server routes use the service role.
alter table public.payment_request enable row level security;
create policy payment_request_insert_own on public.payment_request
  for insert to authenticated
  with check (
    exists (select 1 from public.teachers t where t.id = teacher_id and t.user_id = auth.uid()::text)
    and coalesce(admin_confirmed, false) = false
    and confirmed_at is null
    and refunded_at is null
  );
create policy payment_request_select_own on public.payment_request
  for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.teachers t where t.id = teacher_id and t.user_id = auth.uid()::text)
  );
create policy payment_request_admin_all on public.payment_request
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.successful_payments enable row level security;
create policy successful_payments_admin_all on public.successful_payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- teacher_premium is read publicly to badge premium teachers on /find.
alter table public.teacher_premium enable row level security;
create policy teacher_premium_select_public on public.teacher_premium
  for select to anon, authenticated using (true);
create policy teacher_premium_admin_all on public.teacher_premium
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- payments (플러스 tier): was open to anyone for read and write.
drop policy if exists open_all on public.payments;
create policy payments_insert_own on public.payments
  for insert to authenticated
  with check (
    exists (select 1 from public.teachers t where t.id = teacher_id and t.user_id = auth.uid()::text)
    and status = 'pending'
    and toss_payment_key is null
  );
create policy payments_select_own on public.payments
  for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.teachers t where t.id = teacher_id and t.user_id = auth.uid()::text)
  );
create policy payments_admin_all on public.payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Only the Toss routes (service role) and admins may grant 플러스.
create or replace function public.activate_plus_tier(p_teacher_id integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'not_allowed';
  end if;
  update public.teachers set tier = 'premium' where id = p_teacher_id;
end;
$$;

-- teacher_revealed_requests: was open to anyone; writes happen only inside
-- reveal_student_job().
drop policy if exists open_all on public.teacher_revealed_requests;
create policy teacher_revealed_requests_select_own on public.teacher_revealed_requests
  for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.teachers t where t.id = teacher_id and t.user_id = auth.uid()::text)
  );

-- ---------------------------------------------------------------------------
-- Newsletter, analytics, misc
-- ---------------------------------------------------------------------------

alter table public.newsletter_subscriptions enable row level security;
create policy newsletter_subscriptions_insert_public on public.newsletter_subscriptions
  for insert to anon, authenticated with check (true);
create policy newsletter_subscriptions_select_admin on public.newsletter_subscriptions
  for select to authenticated using (public.is_admin());

-- Was readable by anyone (every subscriber email).
drop policy if exists "Users can view their own hagwon newsletter subscription" on public.hagwon_newsletter_subscriptions;
create policy hagwon_newsletter_subscriptions_select_admin on public.hagwon_newsletter_subscriptions
  for select to authenticated using (public.is_admin());

alter table public.page_events enable row level security;
create policy page_events_insert_public on public.page_events
  for insert to anon, authenticated with check (true);
create policy page_events_select_admin on public.page_events
  for select to authenticated using (public.is_admin());

alter table public.hagwons enable row level security;
create policy hagwons_select_public on public.hagwons
  for select to anon, authenticated using (true);

-- Admin post editor reads unpublished posts from the browser.
create policy posts_admin_all on public.posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------------

-- The old admin_select policies queried users directly; with
-- users_select_chat_partner (which reads conversations) that would recurse.
drop policy if exists admin_select on public.conversations;
create policy admin_select on public.conversations
  for select to authenticated using (public.is_admin());
drop policy if exists admin_select on public.messages;
create policy admin_select on public.messages
  for select to authenticated using (public.is_admin());

-- Caller must be one of the two participants.
create or replace function public.get_or_create_conversation(p_student_id uuid, p_teacher_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or auth.uid() not in (p_student_id, p_teacher_id) then
    raise exception 'not_allowed';
  end if;

  if p_student_id = p_teacher_id then
    raise exception 'cannot_message_self';
  end if;

  if not exists (select 1 from users where id = p_student_id and role = 'student') then
    raise exception 'not_a_student';
  end if;
  if not exists (select 1 from teachers where user_id = p_teacher_id::text and status = 'approved') then
    raise exception 'not_an_approved_teacher';
  end if;

  select id into v_id from conversations where student_id = p_student_id and teacher_id = p_teacher_id;
  if v_id is null then
    insert into conversations (student_id, teacher_id) values (p_student_id, p_teacher_id) returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- Called only by /api/chat/notify-message with the service role.
revoke execute on function public.should_notify_chat_message(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.should_notify_chat_message(uuid, uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Fixed search_path on the remaining SECURITY DEFINER functions
-- ---------------------------------------------------------------------------

alter function public.increment_community_post_views(text) set search_path = public;
alter function public.increment_post_views(text) set search_path = public;
alter function public.mark_conversation_read(uuid) set search_path = public;
alter function public.record_community_post_view(uuid, text) set search_path = public;
alter function public.should_notify_chat_message(uuid, uuid, integer) set search_path = public;
alter function public.touch_conversation_on_message() set search_path = public;
alter function public.unsubscribe_by_token(uuid, text) set search_path = public;

commit;
