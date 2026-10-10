-- Community board v2: posts, threaded comments, likes, reports.
-- Additive only — does NOT touch the existing `posts` table (admin-authored
-- editorial content) or its RLS/policies. All access to these new tables
-- goes through Next.js API routes using the service-role key; base tables
-- grant nothing to anon/authenticated so anonymous authorship can never leak
-- via a direct REST call (the `users` table is otherwise world-readable).

-- ── posts ────────────────────────────────────────────────────────────
create table if not exists community_posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  user_id       uuid references auth.users on delete set null,
  category      text not null check (category in ('자유게시판','질문답변','IB','SAT','특례입학','정보공유')),
  title         text not null,
  content       text not null,
  is_anonymous  boolean not null default false,
  image_urls    text[] not null default '{}',
  view_count    int not null default 0,
  like_count    int not null default 0,
  comment_count int not null default 0,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists community_posts_created_at_idx on community_posts (created_at desc);
create index if not exists community_posts_category_idx on community_posts (category, created_at desc);
create index if not exists community_posts_user_id_idx on community_posts (user_id);

-- ── comments (adjacency list; depth capped at 1 by the API layer) ──────
create table if not exists community_comments (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid not null references community_posts(id) on delete cascade,
  parent_comment_id uuid references community_comments(id) on delete cascade,
  depth             smallint not null default 0,
  user_id           uuid references auth.users on delete set null,
  content           text not null,
  is_anonymous      boolean not null default false,
  image_url         text,
  like_count        int not null default 0,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists community_comments_post_id_idx on community_comments (post_id, created_at);
create index if not exists community_comments_parent_id_idx on community_comments (parent_comment_id);

-- ── likes ────────────────────────────────────────────────────────────
create table if not exists community_post_likes (
  post_id    uuid not null references community_posts(id) on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists community_comment_likes (
  comment_id uuid not null references community_comments(id) on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- ── reports ──────────────────────────────────────────────────────────
create table if not exists community_reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references auth.users on delete set null,
  post_id          uuid references community_posts(id) on delete cascade,
  comment_id       uuid references community_comments(id) on delete cascade,
  reason           text not null check (reason in ('spam','abuse','harassment','off_topic','other')),
  detail           text,
  status           text not null default 'pending' check (status in ('pending','resolved','dismissed')),
  resolved_by      uuid references auth.users on delete set null,
  resolved_at      timestamptz,
  created_at       timestamptz not null default now(),
  constraint community_reports_one_target check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  )
);
create index if not exists community_reports_status_idx on community_reports (status, created_at desc);

-- ── updated_at trigger (reuse existing function if 20260605 already ran) ─
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists community_posts_updated_at on community_posts;
create trigger community_posts_updated_at
  before update on community_posts
  for each row execute function update_updated_at();

drop trigger if exists community_comments_updated_at on community_comments;
create trigger community_comments_updated_at
  before update on community_comments
  for each row execute function update_updated_at();

-- ── like_count maintenance ───────────────────────────────────────────
create or replace function community_bump_post_like_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update community_posts set like_count = like_count + 1 where id = new.post_id;
  else
    update community_posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists community_post_like_count_trg on community_post_likes;
create trigger community_post_like_count_trg
  after insert or delete on community_post_likes
  for each row execute function community_bump_post_like_count();

create or replace function community_bump_comment_like_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update community_comments set like_count = like_count + 1 where id = new.comment_id;
  else
    update community_comments set like_count = greatest(like_count - 1, 0) where id = old.comment_id;
  end if;
  return null;
end;
$$;

drop trigger if exists community_comment_like_count_trg on community_comment_likes;
create trigger community_comment_like_count_trg
  after insert or delete on community_comment_likes
  for each row execute function community_bump_comment_like_count();

-- ── comment_count maintenance (also fires on soft-delete transitions) ──
create or replace function community_bump_comment_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update community_posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif TG_OP = 'UPDATE' then
    if old.deleted_at is null and new.deleted_at is not null then
      update community_posts set comment_count = greatest(comment_count - 1, 0) where id = new.post_id;
    elsif old.deleted_at is not null and new.deleted_at is null then
      update community_posts set comment_count = comment_count + 1 where id = new.post_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if old.deleted_at is null then
      update community_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists community_comment_count_trg on community_comments;
create trigger community_comment_count_trg
  after insert or update of deleted_at or delete on community_comments
  for each row execute function community_bump_comment_count();

-- ── public read view: strips user_id, resolves display name ─────────
create or replace view community_posts_public
  with (security_barrier) as
  select
    p.id, p.slug, p.category, p.title, p.content, p.is_anonymous,
    p.image_urls, p.view_count, p.like_count, p.comment_count,
    p.created_at, p.updated_at,
    case when p.is_anonymous then null else u.username end as author_username
  from community_posts p
  left join public.users u on u.id = p.user_id
  where p.deleted_at is null;

-- ── RLS: default-deny on base tables; only the view is public ────────
alter table community_posts enable row level security;
alter table community_comments enable row level security;
alter table community_post_likes enable row level security;
alter table community_comment_likes enable row level security;
alter table community_reports enable row level security;

revoke all on community_posts, community_comments, community_post_likes,
  community_comment_likes, community_reports from anon, authenticated;
grant select on community_posts_public to anon, authenticated;
grant all on community_posts, community_comments, community_post_likes,
  community_comment_likes, community_reports to service_role;

-- Increment view count (kept as an RPC, callable by anon, mirroring the
-- existing increment_post_views pattern on the legacy posts table)
create or replace function increment_community_post_views(post_slug text)
returns void language plpgsql security definer as $$
begin
  update community_posts set view_count = view_count + 1
  where slug = post_slug and deleted_at is null;
end;
$$;
grant execute on function increment_community_post_views(text) to anon, authenticated;
