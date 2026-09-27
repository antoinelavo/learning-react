-- 1) Teacher identity on community posts: an approved teacher posting
--    non-anonymously should show their teacher name + photo instead of
--    their plain username, so the view now also joins `teachers`.
--    (create or replace is safe to re-run.)
create or replace view community_posts_public
  with (security_barrier) as
  select
    p.id, p.slug, p.category, p.title, p.content, p.is_anonymous,
    p.image_urls, p.view_count, p.like_count, p.comment_count,
    p.created_at, p.updated_at,
    case when p.is_anonymous then null else u.username end as author_username,
    case when p.is_anonymous then null else t.name end as teacher_name,
    case when p.is_anonymous then null else t.profile_picture end as teacher_profile_picture
  from community_posts p
  left join public.users u on u.id = p.user_id
  left join teachers t on t.user_id = p.user_id and t.status = 'approved'
  where p.deleted_at is null;

-- 2) View-count dedup: one view per visitor per post per day, instead of
--    incrementing on every single page load/refresh. "Visitor" is the
--    logged-in user's id, or the requester's IP for logged-out visitors
--    (best-effort — good enough for this scale, not abuse-proof).
create table if not exists community_post_views (
  post_id     uuid not null references community_posts(id) on delete cascade,
  viewer_key  text not null,
  viewed_date date not null default current_date,
  created_at  timestamptz not null default now(),
  primary key (post_id, viewer_key, viewed_date)
);

alter table community_post_views enable row level security;
revoke all on community_post_views from anon, authenticated;
grant all on community_post_views to service_role;

create or replace function record_community_post_view(p_post_id uuid, p_viewer_key text)
returns void language plpgsql security definer as $$
declare
  did_insert boolean := false;
begin
  insert into community_post_views (post_id, viewer_key, viewed_date)
  values (p_post_id, p_viewer_key, current_date)
  on conflict (post_id, viewer_key, viewed_date) do nothing
  returning true into did_insert;

  if did_insert then
    update community_posts set view_count = view_count + 1
    where id = p_post_id and deleted_at is null;
  end if;
end;
$$;
grant execute on function record_community_post_view(uuid, text) to anon, authenticated;

-- Old per-request increment_community_post_views() is left in place
-- (unused after this migration, harmless) rather than dropped, in case
-- anything still references it during a rolling deploy.
