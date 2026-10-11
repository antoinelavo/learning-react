-- Expose the (non-anonymous) author's role on the public posts view so
-- posts can show a 학생 / 선생님 pill. Appended last so this is a
-- create-or-replace (no drop). Anonymous posts keep a null role.
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
    case when p.is_anonymous then null else u.role end as author_role
  from community_posts p
  left join public.users u on u.id = p.user_id
  left join teachers t
    on t.user_id = p.user_id::text
   and t.status = 'approved'
   and coalesce(t.is_test, false) = false
  where p.deleted_at is null;

grant select on community_posts_public to anon, authenticated;
