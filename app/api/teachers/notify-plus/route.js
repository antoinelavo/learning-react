// app/api/teachers/notify-plus/route.js
//
// Sends the "플러스 upgrade complete" email. Called by the admin pages
// (/admin/plus-payments, /admin/tiers) right after a teacher is switched to
// 플러스. Never blocks the upgrade: failures return {ok:false} and the
// admin page shows a notice.
import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/supabaseAdmin';
import { getTeacherRecipient, sendTeacherEmail, SITE_URL } from '@/lib/email/teacherEmail';
import { buildPlusEmailHtml, PLUS_EMAIL_SUBJECT } from '@/lib/email/upgradeTemplates';

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

    const recipient = await getTeacherRecipient(teacherId, 'id, name, user_id, tier');
    if (recipient.error) {
      return NextResponse.json({ ok: false, error: recipient.error });
    }

    // Only mail a teacher who actually is 플러스 now ('premium' in the DB).
    if (recipient.teacher.tier !== 'premium') {
      return NextResponse.json({ ok: false, error: 'not_plus' });
    }

    const result = await sendTeacherEmail({
      to: recipient.email,
      subject: PLUS_EMAIL_SUBJECT,
      html: buildPlusEmailHtml({
        teacherName: recipient.teacher.name,
        studentsUrl: `${SITE_URL}/students`,
      }),
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('notify-plus: unhandled error', err);
    return NextResponse.json({ ok: false, error: 'unhandled_error' });
  }
}
