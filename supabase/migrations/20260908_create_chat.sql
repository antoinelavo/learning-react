-- Chat between students and teachers.
-- One conversation per (student, teacher) pair; messages belong to a
-- conversation. student_id/teacher_id/sender_id/recipient_id all reference
-- auth.users directly (same convention as posts.user_id in
-- 20260605_create_posts.sql) rather than the public `users` table, since
-- that table isn't guaranteed to carry its own primary key constraint in
-- this codebase's (untracked) schema history.

create table if not exists conversations (
  id                   uuid primary key default gen_random_uuid(),
  student_id           uuid not null references auth.users on delete cascade,
  teacher_id           uuid not null references auth.users on delete cascade, -- this is the teacher's own user id (teachers.user_id), not teachers.id
  created_at           timestamptz not null default now(),
  last_message_at      timestamptz,
  last_message_preview text,
  unique (student_id, teacher_id)
);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references auth.users on delete cascade,
  recipient_id    uuid not null references auth.users on delete cascade, -- denormalized (the conversation's other participant) so RLS and Realtime can filter on it directly
  body            text not null,
  created_at      timestamptz not null default now(),
  read_at         timestamptz
);

create index if not exists messages_conversation_id_idx on messages(conversation_id);
create index if not exists messages_recipient_id_idx on messages(recipient_id);
create index if not exists conversations_student_id_idx on conversations(student_id);
create index if not exists conversations_teacher_id_idx on conversations(teacher_id);

alter table users add column if not exists chat_email_notifications boolean not null default true;

-- Only sanctioned way to create a conversation: validates that p_student_id
-- is actually a student and p_teacher_id is an approved teacher, then
-- atomically gets-or-creates the single conversation row for that pair.
-- security definer, following this repo's existing pattern
-- (increment_post_views, unsubscribe_by_token) for privileged writes,
-- since teachers/users have no RLS of their own to check against directly
-- from a plain anon-key insert.
create or replace function get_or_create_conversation(p_student_id uuid, p_teacher_id uuid)
returns uuid language plpgsql security definer as $$
declare
  v_id uuid;
begin
  if p_student_id = p_teacher_id then
    raise exception 'cannot_message_self';
  end if;

  if not exists (select 1 from users where id = p_student_id and role = 'student') then
    raise exception 'not_a_student';
  end if;
  if not exists (select 1 from teachers where user_id = p_teacher_id and status = 'approved') then
    raise exception 'not_an_approved_teacher';
  end if;

  select id into v_id from conversations where student_id = p_student_id and teacher_id = p_teacher_id;
  if v_id is null then
    insert into conversations (student_id, teacher_id) values (p_student_id, p_teacher_id) returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- Marks every unread message addressed to the caller in one conversation as read.
create or replace function mark_conversation_read(p_conversation_id uuid)
returns void language plpgsql security definer as $$
begin
  update messages set read_at = now()
  where conversation_id = p_conversation_id
    and recipient_id = auth.uid()
    and read_at is null;
end;
$$;

-- Keeps conversations.last_message_at/preview in sync on every new message,
-- so the conversation list can be rendered without an N+1 "latest message
-- per conversation" query.
create or replace function touch_conversation_on_message()
returns trigger language plpgsql as $$
begin
  update conversations
  set last_message_at = new.created_at,
      last_message_preview = left(new.body, 200)
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on messages
  for each row execute function touch_conversation_on_message();

alter table conversations enable row level security;
alter table messages enable row level security;

create policy "participant_select" on conversations
  for select using (auth.uid() = student_id or auth.uid() = teacher_id);

create policy "admin_select" on conversations
  for select using (exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin'));

create policy "participant_select" on messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "admin_select" on messages
  for select using (exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin'));

-- Sender must be the caller, and the (sender, recipient) pair must match an
-- existing conversation's two participants -- prevents forging messages
-- into a conversation you're not part of, or with a mismatched recipient.
create policy "participant_insert" on messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.student_id = auth.uid() or c.teacher_id = auth.uid())
        and recipient_id in (c.student_id, c.teacher_id)
        and recipient_id <> auth.uid()
    )
  );

-- Only the recipient can update a message (used to set read_at).
create policy "recipient_update" on messages
  for update using (auth.uid() = recipient_id);
