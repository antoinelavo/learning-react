// lib/requestColumns.js
// Public columns of student_jobs / hagwon_requests. email, kakao_contact and
// edit_password_hash are not readable by anon/authenticated (see
// supabase/migrations/20261011_security_rls.sql); contact info comes from
// the get_student_job_contact / get_hagwon_request_contact RPCs and edits
// go through the *_with_password RPCs.
export const STUDENT_JOB_PUBLIC_COLUMNS =
  'id, subject, level, description, format, status, created_at, region, title, hourly_rate_min, hourly_rate_max, views_count, found_teacher_through_platform';

export const HAGWON_REQUEST_PUBLIC_COLUMNS =
  'id, created_at, program_type, ib_subjects, sat_subjects, format, region, level, title, description, hourly_rate_min, hourly_rate_max, status, found_hagwon_through_platform, views_count';

// SHA-256 hex of the edit password, as stored in edit_password_hash.
export async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
