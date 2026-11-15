-- Chat cleanup and realtime. Run by hand in the Supabase dashboard.
--
-- 1) Delete conversations with no messages. Until now "메시지 보내기" created
--    the row on click, so most conversations (118 of 127 on 2026-11-15) were
--    empty. The app now creates the row on the first message.
--    chat_notification_state rows cascade.
-- 2) Add messages to the supabase_realtime publication. It had no tables, so
--    the chat's postgres_changes subscriptions never fired: new messages and
--    the unread badge only showed up after a reload. Realtime applies the
--    messages RLS (participant_select / admin_select), so each user only
--    receives messages they sent or received.

begin;

-- Skips rows from the last 10 minutes: one could be a first message that is
-- being sent right now (conversation created, message not inserted yet).
delete from public.conversations c
where c.created_at < now() - interval '10 minutes'
  and not exists (select 1 from public.messages m where m.conversation_id = c.id);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

commit;
