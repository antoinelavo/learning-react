// lib/email/sendApprovalEmail.js
// Sends the "profile approved" email for one teacher. Never throws: returns
// { ok: true } or { ok: false, error } so a mail problem can't undo an
// approval. Shared by the admin notify route and the auto-approve route.
import { Resend } from 'resend';
import { buildApprovalEmailHtml } from '@/lib/email/approvalTemplate';

const resend = new Resend(process.env.RESEND_API_KEY);
// Hardcoded on purpose: NEXT_PUBLIC_SITE_URL is shared with the NicePay
// integration and can point elsewhere (e.g. a preview URL); this email
// should always link to the real site.
const DASHBOARD_URL = 'https://www.ibmaster.net/dashboard';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'IBMaster <onboarding@resend.dev>';

// `db` is the service-role client. The teacher must already be approved.
export async function sendApprovalEmail(db, teacherId) {
  try {
    const { data: teacher, error: teacherError } = await db
      .from('teachers')
      .select('name, user_id')
      .eq('id', teacherId)
      .eq('status', 'approved')
      .single();

    if (teacherError || !teacher?.user_id) {
      console.error('sendApprovalEmail: teacher not found', teacherId, teacherError);
      return { ok: false, error: 'teacher_not_found' };
    }

    const { data: user, error: userError } = await db
      .from('users')
      .select('email')
      .eq('id', teacher.user_id)
      .single();

    if (userError || !user?.email) {
      console.error('sendApprovalEmail: no email for user_id', teacher.user_id, userError);
      return { ok: false, error: 'email_not_found' };
    }

    const { error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: '[IBMaster] 프로필이 승인되었습니다!',
      html: buildApprovalEmailHtml({
        teacherName: teacher.name,
        dashboardUrl: DASHBOARD_URL,
      }),
    });

    if (sendError) {
      console.error('sendApprovalEmail: resend error', sendError);
      return { ok: false, error: 'send_failed' };
    }
    return { ok: true };
  } catch (err) {
    console.error('sendApprovalEmail: unhandled error', err);
    return { ok: false, error: 'unhandled_error' };
  }
}
