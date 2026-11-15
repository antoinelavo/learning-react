// app/api/teachers/notify-premium/route.js
//
// Sends the "premium profile active" email. Called by /admin/payments right
// after a bank-transfer payment_request is confirmed. Subjects and dates come
// from the teacher_premium row that confirmation created (matched by
// payment_request_id), never from the request body. Never blocks the
// upgrade: failures return {ok:false} and the admin page shows a notice.
import { NextResponse } from 'next/server';
import { getAdminFromRequest, getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getTeacherRecipient, sendTeacherEmail, SITE_URL } from '@/lib/email/teacherEmail';
import { buildPremiumEmailHtml, PREMIUM_EMAIL_SUBJECT } from '@/lib/email/upgradeTemplates';

export async function POST(request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const { paymentRequestId } = await request.json();
    if (!paymentRequestId) {
      return NextResponse.json({ ok: false, error: 'missing_payment_request_id' }, { status: 400 });
    }

    const { data: premium, error: premiumError } = await getSupabaseAdmin()
      .from('teacher_premium')
      .select('teacher_id, subject, start_date, end_date')
      .eq('payment_request_id', paymentRequestId)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (premiumError || !premium) {
      console.error('notify-premium: premium row not found', paymentRequestId, premiumError);
      return NextResponse.json({ ok: false, error: 'premium_not_found' });
    }

    const recipient = await getTeacherRecipient(premium.teacher_id);
    if (recipient.error) {
      return NextResponse.json({ ok: false, error: recipient.error });
    }

    const result = await sendTeacherEmail({
      to: recipient.email,
      subject: PREMIUM_EMAIL_SUBJECT,
      html: buildPremiumEmailHtml({
        teacherName: recipient.teacher.name,
        subjects: premium.subject,
        startDate: premium.start_date,
        endDate: premium.end_date,
        profileUrl: `${SITE_URL}/profile/${encodeURIComponent(recipient.teacher.name)}`,
        dashboardUrl: `${SITE_URL}/dashboard`,
      }),
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('notify-premium: unhandled error', err);
    return NextResponse.json({ ok: false, error: 'unhandled_error' });
  }
}
