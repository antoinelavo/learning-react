-- touch_conversation_on_message() runs (via trigger) as whatever role sent
-- the message, but conversations has no UPDATE RLS policy — so its
-- "update conversations set last_message_at = ..., last_message_preview = ..."
-- silently matches 0 rows every time (RLS filters it out, no error raised).
-- Result: last_message_preview never gets set, so the conversation list
-- always falls back to the "대화를 시작해보세요" placeholder for both
-- students and teachers, no matter how many messages were sent.
--
-- Fix: mark the function security definer, same as get_or_create_conversation
-- and mark_conversation_read, so it bypasses RLS like they do.
create or replace function touch_conversation_on_message()
returns trigger language plpgsql security definer as $$
begin
  update conversations
  set last_message_at = new.created_at,
      last_message_preview = left(new.body, 200)
  where id = new.conversation_id;
  return new;
end;
$$;

-- Backfill existing conversations that already have messages but never got
-- last_message_at/preview set because of the bug above.
update conversations c
set last_message_at = m.created_at,
    last_message_preview = left(m.body, 200)
from (
  select distinct on (conversation_id) conversation_id, body, created_at
  from messages
  order by conversation_id, created_at desc
) m
where c.id = m.conversation_id;
