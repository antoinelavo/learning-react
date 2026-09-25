-- Two-tier teacher account system (free / premium), replacing the paid
-- expedited-verification feature entirely (dropped, not deprecated — its
-- code is removed from the app in this same change).
--
-- Naming note: "premium" here is an unrelated concept from teacher_premium
-- (the existing paid top-of-search PROFILE PLACEMENT feature, untouched by
-- this migration). This tier is about unlimited student_jobs contact
-- reveals. To avoid confusing the two, the app's UI copy calls this tier
-- "플러스" (Plus) everywhere a user sees it — only the database column
-- itself uses the literal value 'premium'.

alter table teachers
  add column if not exists tier text not null default 'free' check (tier in ('free', 'premium')),
  add column if not exists reveal_count int not null default 0,
  add column if not exists reveal_reset_at timestamptz not null default now();
-- `add column ... default` backfills every existing row with these same
-- defaults in one step (tier='free', reveal_count=0, reveal_reset_at=this
-- migration's run time) — no separate UPDATE needed.

-- Tracks which specific student_jobs a teacher has already unlocked, so
-- re-viewing a previously revealed request never costs another credit or
-- re-triggers the free-tier count logic.
-- teacher_id is integer here (not uuid) because teachers.id itself is an
-- integer primary key in this database, unlike student_jobs.id (uuid).
create table if not exists teacher_revealed_requests (
  id uuid primary key default gen_random_uuid(),
  teacher_id integer not null references teachers(id) on delete cascade,
  student_job_id uuid not null references student_jobs(id) on delete cascade,
  revealed_at timestamptz not null default now(),
  unique (teacher_id, student_job_id)
);
-- Intended to have no RLS, matching payment_request/successful_payments/
-- teacher_premium elsewhere in this app — but this project defaults new
-- tables to RLS-on, so it actually came up locked with no policy (blocking
-- everything). See 20260925_fix_payments_rls.sql for the permissive
-- policy that fixes this, added once that turned out to be necessary.

-- Payment log for the 플러스 upgrade (₩9,000, one-time, permanent — no
-- expiration/renewal/refund). Needed for Toss's site review and later
-- 세금계산서 issuance.
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  teacher_id integer not null references teachers(id) on delete cascade,
  amount integer not null,
  currency text not null default 'KRW',
  provider text not null default 'toss',
  toss_order_id text unique,
  toss_payment_key text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now()
);
-- Same reasoning as teacher_revealed_requests above — see
-- 20260925_fix_payments_rls.sql.

-- Reveals a student_job's contact info for a teacher, enforcing the
-- free-tier limit of 2 reveals per rolling 30-day window (premium:
-- unlimited). security definer + a row lock on the teacher's own row
-- (`for update`) makes this safe against two rapid concurrent reveal
-- clicks double-counting the same request.
--
-- Returns one row: (revealed boolean, reason text). reason is one of
-- already_revealed | premium | free_reveal | limit_reached |
-- teacher_not_found. The client redirects to the dashboard's pricing tab
-- on limit_reached instead of showing an inline modal.
create or replace function reveal_student_job(p_teacher_id integer, p_student_job_id uuid)
returns table (revealed boolean, reason text) language plpgsql security definer as $$
declare
  v_tier text;
  v_count int;
  v_reset timestamptz;
begin
  if exists (
    select 1 from teacher_revealed_requests
    where teacher_id = p_teacher_id and student_job_id = p_student_job_id
  ) then
    return query select true, 'already_revealed';
    return;
  end if;

  select tier, reveal_count, reveal_reset_at into v_tier, v_count, v_reset
  from teachers where id = p_teacher_id
  for update;

  if v_tier is null then
    return query select false, 'teacher_not_found';
    return;
  end if;

  if v_tier = 'premium' then
    insert into teacher_revealed_requests (teacher_id, student_job_id)
      values (p_teacher_id, p_student_job_id)
      on conflict (teacher_id, student_job_id) do nothing;
    return query select true, 'premium';
    return;
  end if;

  -- Lazy rolling-window reset: only rolls over when a reveal is actually
  -- attempted after the window has elapsed, per spec.
  if now() > v_reset + interval '30 days' then
    v_count := 0;
    update teachers set reveal_count = 0, reveal_reset_at = now() where id = p_teacher_id;
  end if;

  if v_count >= 2 then
    return query select false, 'limit_reached';
    return;
  end if;

  insert into teacher_revealed_requests (teacher_id, student_job_id)
    values (p_teacher_id, p_student_job_id)
    on conflict (teacher_id, student_job_id) do nothing;

  -- FOUND reflects whether the insert above actually added a row (false if
  -- a concurrent call won the race via the unique constraint) — only
  -- charge a credit for a reveal that actually happened.
  if found then
    update teachers set reveal_count = reveal_count + 1 where id = p_teacher_id;
  end if;

  return query select true, 'free_reveal';
end;
$$;
