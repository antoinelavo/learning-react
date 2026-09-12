-- The previous throttle in app/api/chat/notify-message/route.js (skip if
-- recipient already has >1 unread message in the conversation) never
-- actually engages in a normal back-and-forth: if the recipient reads each
-- message as it arrives (or replies promptly), unread count stays <=1 per
-- new message, so every single message ("hi", "hello", ...) sent an email.
--
-- Replace it with a real cooldown: track the last time we emailed a given
-- recipient about a given conversation, and skip sending again until N
-- minutes have passed, regardless of read state. This is done as a single
-- security-definer RPC (get-and-set in one call) so it's race-safe against
-- messages sent in quick succession, and so the anon-key route can use it
-- despite RLS on the underlying table.

create table if not exists chat_notification_state (
  conversation_id uuid not null references conversations(id) on delete cascade,
  recipient_id uuid not null references users(id) on delete cascade,
  last_notified_at timestamptz not null default now(),
  primary key (conversation_id, recipient_id)
);

alter table chat_notification_state enable row level security;
-- No client-facing policies: this table is only ever touched through the
-- security-definer function below, never queried/updated directly.

create or replace function should_notify_chat_message(
  p_conversation_id uuid,
  p_recipient_id uuid,
  p_cooldown_minutes int default 5
)
returns boolean language plpgsql security definer as $$
declare
  v_last timestamptz;
begin
  select last_notified_at into v_last
  from chat_notification_state
  where conversation_id = p_conversation_id and recipient_id = p_recipient_id
  for update;

  if v_last is not null and v_last > now() - make_interval(mins => p_cooldown_minutes) then
    return false;
  end if;

  insert into chat_notification_state (conversation_id, recipient_id, last_notified_at)
  values (p_conversation_id, p_recipient_id, now())
  on conflict (conversation_id, recipient_id) do update set last_notified_at = now();

  return true;
end;
$$;
