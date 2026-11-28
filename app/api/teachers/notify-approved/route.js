// app/api/teachers/notify-approved/route.js
//
// Sends the "profile approved" email. Called (fire-and-forget from the
// caller's perspective) right after an admin approves a teacher in
// app/admin/components/TeacherList.jsx. Must never be able to block or
// fail the approval itself — any problem here just means no email went
// out, logged server-side, returned as {ok:false} rather than thrown.
import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getAdminFromRequest } from '@/lib/supabaseAdmin';
import { sendApprovalEmail } from '@/lib/email/sendApprovalEmail';

export async function POST(request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const { teacherId } = await request.json();
    if (!teacherId) {
      return NextResponse.json({ ok: false, error: 'missing_teacher_id' }, { status: 400 });
    }

    const result = await sendApprovalEmail(getSupabaseAdmin(), teacherId);
    return NextResponse.json(result);
  } catch (err) {
    console.error('notify-approved: unhandled error', err);
    return NextResponse.json({ ok: false, error: 'unhandled_error' });
  }
}
