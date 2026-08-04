-- Unsubscribe support for the students & hagwon newsletter lists
alter table newsletter_subscriptions
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

alter table hagwon_newsletter_subscriptions
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

-- Deletes the subscriber row matching the token for the given list.
-- security definer so the anon-key client can unsubscribe without an RLS delete policy.
create or replace function unsubscribe_by_token(p_token uuid, p_list text)
returns boolean language plpgsql security definer as $$
declare
  deleted_count int;
begin
  if p_list = 'student' then
    delete from newsletter_subscriptions where unsubscribe_token = p_token;
  elsif p_list = 'hagwon' then
    delete from hagwon_newsletter_subscriptions where unsubscribe_token = p_token;
  else
    return false;
  end if;
  get diagnostics deleted_count = row_count;
  return deleted_count > 0;
end;
$$;
