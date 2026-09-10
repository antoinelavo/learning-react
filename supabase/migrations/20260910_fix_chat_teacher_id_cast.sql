-- teachers.user_id is stored as text (not uuid) in this database, so
-- comparing it directly against the uuid parameter fails with
-- "operator does not exist: text = uuid". Cast the parameter to text for
-- that one comparison.
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
  if not exists (select 1 from teachers where user_id = p_teacher_id::text and status = 'approved') then
    raise exception 'not_an_approved_teacher';
  end if;

  select id into v_id from conversations where student_id = p_student_id and teacher_id = p_teacher_id;
  if v_id is null then
    insert into conversations (student_id, teacher_id) values (p_student_id, p_teacher_id) returning id into v_id;
  end if;
  return v_id;
end;
$$;
