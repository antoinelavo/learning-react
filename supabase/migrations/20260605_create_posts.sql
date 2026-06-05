-- Community posts table (admin-authored + user-authored)
create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  description text,
  content     text not null default '',
  category    text not null default '일반',   -- 'IB' | 'SAT' | '특례입학' | '일반'
  type        text not null default 'user',   -- 'admin' | 'user'
  featured    boolean not null default false,
  published   boolean not null default false,
  user_id     uuid references auth.users on delete set null,
  views       int not null default 0,
  date        date not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- RLS
alter table posts enable row level security;

-- Anyone can read published posts
create policy "public_read" on posts
  for select using (published = true);

-- Authenticated users can insert their own user posts
create policy "user_insert" on posts
  for insert with check (
    auth.uid() = user_id
    and type = 'user'
    and published = true
  );

-- Users can update their own user posts
create policy "user_update_own" on posts
  for update using (
    auth.uid() = user_id
    and type = 'user'
  );

-- Admins bypass RLS via service role key (handled in API routes)
-- Increment views helper (bypasses RLS)
create or replace function increment_post_views(post_slug text)
returns void language plpgsql security definer as $$
begin
  update posts set views = views + 1 where slug = post_slug and published = true;
end;
$$;
