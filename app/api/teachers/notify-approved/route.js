// app/api/teachers/notify-approved/route.js
//
// Sends the "profile approved" email. Called (fire-and-forget from the
// caller's perspective) right after an admin approves a teacher in
// app/admin/components/TeacherList.jsx. Must never be able to block or
// fail the approval itself — any problem here just means no email went
// out, logged server-side, returned as {ok:false} rather than thrown.
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import { buildApprovalEmailHtml } from '@/lib/email/approvalTemplate';

const resend = new Resend(process.env.RESEND_API_KEY);
// Hardcoded on purpose — NEXT_PUBLIC_SITE_URL is shared with the NicePay
// integration and can point elsewhere (e.g. a preview URL) depending on
// deploy config; this email should always link to the real site.
const DASHBOARD_URL = 'https://ibmaster.net/dashboard';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'IBMaster <onboarding@resend.dev>';

export async function POST(request) {
  try {
    const { teacherId } = await request.json();
    if (!teacherId) {
      return NextResponse.json({ ok: false, error: 'missing_teacher_id' }, { status: 400 });
    }

    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('name, user_id')
      .eq('id', teacherId)
      .single();

    if (teacherError || !teacher?.user_id) {
      console.error('notify-approved: teacher not found', teacherId, teacherError);
      return NextResponse.json({ ok: false, error: 'teacher_not_found' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', teacher.user_id)
      .single();

    if (userError || !user?.email) {
      console.error('notify-approved: no email for user_id', teacher.user_id, userError);
      return NextResponse.json({ ok: false, error: 'email_not_found' });
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
      console.error('notify-approved: resend error', sendError);
      return NextResponse.json({ ok: false, error: 'send_failed' });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('notify-approved: unhandled error', err);
    return NextResponse.json({ ok: false, error: 'unhandled_error' });
  }
}
