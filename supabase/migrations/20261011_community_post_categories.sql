-- Posts can belong to several boards (1–3), like tags. `category` stays as
-- the first board for anything that still reads it; `categories` is the
-- source of truth. Additive: nothing is dropped.

alter table community_posts
  add column if not exists categories text[] not null default '{}';

update community_posts
  set categories = array[category]
  where cardinality(categories) = 0;

alter table community_posts
  drop constraint if exists community_posts_categories_check;
alter table community_posts
  add constraint community_posts_categories_check check (
    cardinality(categories) between 1 and 3
    and categories <@ array['자유게시판','질문답변','IB','SAT','특례입학','정보공유']::text[]
  );

create index if not exists community_posts_categories_idx
  on community_posts using gin (categories);

-- Expose categories on the public view (appended, so create-or-replace).
create or replace view community_posts_public
  with (security_barrier) as
  select
    p.id, p.slug, p.category, p.title, p.content, p.is_anonymous,
    p.image_urls, p.view_count, p.like_count, p.comment_count,
    p.created_at, p.updated_at,
    case when p.is_anonymous then null else u.username end as author_username,
    case when p.is_anonymous then null else t.name end as teacher_name,
    case when p.is_anonymous then null else t.profile_picture end as teacher_profile_picture,
    p.is_pinned,
    case when p.is_anonymous then null else u.role end as author_role,
    p.categories
  from community_posts p
  left join public.users u on u.id = p.user_id
  left join teachers t
    on t.user_id = p.user_id::text
   and t.status = 'approved'
   and coalesce(t.is_test, false) = false
  where p.deleted_at is null;

grant select on community_posts_public to anon, authenticated;
