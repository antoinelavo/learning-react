// lib/email/teacherEmail.js
// Server-only helpers for account emails to a teacher (upgrade notices).
// Looks up the teacher's login email (users.email via teachers.user_id)
// with the service-role client and sends through Resend.
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'IBMaster <onboarding@resend.dev>';

// Hardcoded on purpose, like notify-approved: emails always link to the real site.
export const SITE_URL = 'https://www.ibmaster.net';

// Returns { teacher, email } or { error }.
export async function getTeacherRecipient(teacherId, columns = 'id, name, user_id') {
  const supabase = getSupabaseAdmin();
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select(columns)
    .eq('id', teacherId)
    .maybeSingle();

  if (teacherError || !teacher?.user_id) {
    console.error('teacherEmail: teacher not found', teacherId, teacherError);
    return { error: 'teacher_not_found' };
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email')
    .eq('id', teacher.user_id)
    .maybeSingle();

  if (userError || !user?.email) {
    console.error('teacherEmail: no email for user_id', teacher.user_id, userError);
    return { error: 'email_not_found' };
  }

  return { teacher, email: user.email };
}

// Returns { ok: true } or { ok: false, error }.
export async function sendTeacherEmail({ to, subject, html }) {
  const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  if (error) {
    console.error('teacherEmail: resend error', error);
    return { ok: false, error: 'send_failed' };
  }
  return { ok: true };
}
