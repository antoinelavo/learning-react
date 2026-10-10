-- Community launch: pinned notices, scraps, admin-deleted marker, bans,
-- and removal of the legacy admin `posts` table.
-- Run by hand in the Supabase dashboard (SQL Editor) after
-- 20260908_create_community_board.sql and
-- 20260927_community_teacher_and_view_dedup.sql (both already applied).

-- ── Pinned notices (공지) ────────────────────────────────────────────
alter table community_posts
  add column if not exists is_pinned boolean not null default false;

create index if not exists community_posts_pinned_idx
  on community_posts (is_pinned) where is_pinned and deleted_at is null;

-- ── Admin soft-delete marker (shown as "관리자에 의해 삭제된 …") ───────
alter table community_posts
  add column if not exists deleted_by_admin boolean not null default false;
alter table community_comments
  add column if not exists deleted_by_admin boolean not null default false;

-- ── Scraps (bookmarks) ──────────────────────────────────────────────
create table if not exists community_post_scraps (
  post_id    uuid not null references community_posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists community_post_scraps_user_idx
  on community_post_scraps (user_id, created_at desc);

alter table community_post_scraps enable row level security;
revoke all on community_post_scraps from anon, authenticated;
grant all on community_post_scraps to service_role;

-- ── Community bans ──────────────────────────────────────────────────
-- Own table, not a column on `users`: users can update their own `users`
-- row with the anon key, so a ban stored there could be lifted by the
-- banned user. Only the service role can touch this table.
-- Permanent bans use 9999-12-31; lifting a ban deletes the row.
create table if not exists community_bans (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  banned_until timestamptz not null,
  banned_by    uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table community_bans enable row level security;
revoke all on community_bans from anon, authenticated;
grant all on community_bans to service_role;

-- ── View counting: server only ──────────────────────────────────────
-- The API calls this with the service role; anon could otherwise call it
-- directly with made-up viewer keys and inflate view counts.
revoke execute on function record_community_post_view(uuid, text) from public, anon, authenticated;
grant execute on function record_community_post_view(uuid, text) to service_role;

-- ── Public read view: add is_pinned, hide test teachers' identity ───
-- Dropped and recreated because new columns are added mid-list.
drop view if exists community_posts_public;
create view community_posts_public
  with (security_barrier) as
  select
    p.id, p.slug, p.category, p.title, p.content, p.is_anonymous,
    p.image_urls, p.view_count, p.like_count, p.comment_count,
    p.is_pinned, p.created_at, p.updated_at,
    case when p.is_anonymous then null else u.username end as author_username,
    case when p.is_anonymous then null else t.name end as teacher_name,
    case when p.is_anonymous then null else t.profile_picture end as teacher_profile_picture
  from community_posts p
  left join public.users u on u.id = p.user_id
  left join teachers t
    on t.user_id = p.user_id::text
   and t.status = 'approved'
   and coalesce(t.is_test, false) = false
  where p.deleted_at is null;

grant select on community_posts_public to anon, authenticated;

-- ── Remove legacy pieces ────────────────────────────────────────────
drop function if exists increment_community_post_views(text);
drop function if exists increment_post_views(text);
drop table if exists posts;
