-- lib/tierActivation.js was updating teachers.tier directly via the
-- anon-key client from a server-side route (no forwarded user session).
-- Same class of bug as the payments RLS issue: if teachers' own RLS
-- doesn't grant the anon role write access (the only precedent — the
-- dashboard's profile-save update — runs from an authenticated browser
-- session, not the anon role, so it proves nothing about this path), the
-- update silently matches 0 rows and the teacher never actually gets
-- upgraded, even though the payment succeeded and the redirect looked fine.
--
-- Fix: do it through a security-definer RPC instead, exactly like
-- reveal_student_job() already does for the same table — bypasses RLS
-- entirely rather than depending on whatever policy happens to exist.
create or replace function activate_plus_tier(p_teacher_id integer)
returns void language plpgsql security definer as $$
begin
  update teachers set tier = 'premium' where id = p_teacher_id;
end;
$$;
