// lib/teacherColumns.js
// Columns of `teachers` that anon/authenticated may read (see
// supabase/migrations/20261011_security_rls.sql). select('*') fails on this
// table for normal users because bank details, student ID number and email
// are not granted. Owners read their full row via the get_my_teacher_profile
// RPC; admins via admin_list_teachers.
export const TEACHER_PUBLIC_COLUMNS = [
  'id', 'name', 'preferred_lesson_time', 'school', 'age', 'gender',
  'shortintroduction', 'longintroduction', 'experience', 'contact_information',
  'profile_picture', 'status', 'subjects', 'lesson_type', 'extra_subject',
  'last_updated', 'created_date', 'click_count', 'IB', 'user_id',
  'profile_clicks', 'rate', 'rate_description', 'tier', 'reveal_count',
  'reveal_reset_at', 'is_test',
].join(', ');
