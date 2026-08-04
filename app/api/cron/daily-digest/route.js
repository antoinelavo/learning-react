import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const SITE_URL = 'https://ibmaster.net';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'IBMaster <onboarding@resend.dev>';

export async function GET(request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // TEMP: widen window for production test — revert to 24 hours after
    const twentyFourHoursAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch new student jobs and hagwon requests from the last 24 hours
    const [studentResult, hagwonResult] = await Promise.all([
      supabase
        .from('student_jobs')
        .select('id, title, subject, level, format, region, hourly_rate_min, hourly_rate_max, created_at')
        .gte('created_at', twentyFourHoursAgo)
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false }),
      supabase
        .from('hagwon_requests')
        .select('id, title, type, ib_subjects, sat_subjects, level, format, region, hourly_rate_min, hourly_rate_max, created_at')
        .gte('created_at', twentyFourHoursAgo)
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false }),
    ]);

    const newStudentJobs = studentResult.data || [];
    const newHagwonRequests = hagwonResult.data || [];

    if (newStudentJobs.length === 0 && newHagwonRequests.length === 0) {
      return NextResponse.json({ message: 'No new posts today, no emails sent.' });
    }

    // Fetch subscribers
    const [studentSubs, hagwonSubs] = await Promise.all([
      newStudentJobs.length > 0
        ? supabase.from('newsletter_subscriptions').select('email, unsubscribe_token')
        : { data: [] },
      newHagwonRequests.length > 0
        ? supabase.from('hagwon_newsletter_subscriptions').select('email, unsubscribe_token')
        : { data: [] },
    ]);

    const results = [];
    const TEST_OVERRIDE_EMAIL = process.env.TEST_OVERRIDE_EMAIL;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Send student digest
    if (newStudentJobs.length > 0 && studentSubs.data?.length > 0) {
      const studentRecipients = TEST_OVERRIDE_EMAIL
        ? studentSubs.data.map((s) => ({ ...s, email: TEST_OVERRIDE_EMAIL }))
        : studentSubs.data;

      for (const sub of studentRecipients) {
        const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${sub.unsubscribe_token}&list=student`;
        const studentHtml = buildStudentDigestHtml(newStudentJobs, unsubscribeUrl);
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: sub.email,
          subject: `[IBMaster] 오늘의 새 학생 요청 ${newStudentJobs.length}건`,
          html: studentHtml,
        });
        results.push({ type: 'student', email: sub.email, success: !error, error: error?.message });
        await delay(600);
      }
    }

    // Send hagwon digest
    if (newHagwonRequests.length > 0 && hagwonSubs.data?.length > 0) {
      const hagwonRecipients = TEST_OVERRIDE_EMAIL
        ? hagwonSubs.data.map((s) => ({ ...s, email: TEST_OVERRIDE_EMAIL }))
        : hagwonSubs.data;

      for (const sub of hagwonRecipients) {
        const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${sub.unsubscribe_token}&list=hagwon`;
        const hagwonHtml = buildHagwonDigestHtml(newHagwonRequests, unsubscribeUrl);
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: sub.email,
          subject: `[IBMaster] 오늘의 새 학원 요청 ${newHagwonRequests.length}건`,
          html: hagwonHtml,
        });
        results.push({ type: 'hagwon', email: sub.email, success: !error, error: error?.message });
        await delay(600);
      }
    }

    return NextResponse.json({
      studentJobs: newStudentJobs.length,
      hagwonRequests: newHagwonRequests.length,
      emailsSent: results.length,
      results,
    });
  } catch (err) {
    console.error('Daily digest error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });
}

function formatFormat(format, region) {
  const label =
    format === 'online' ? '온라인' : format === 'offline' ? '대면' : '대면/온라인';
  return region && format !== 'online' ? `${label} · ${region}` : label;
}

function pill(text, bg, color, border) {
  return `<span style="display: inline-block; padding: 2px 8px; background: ${bg}; color: ${color}; border: 1px solid ${border}; border-radius: 9999px; font-size: 11px; line-height: 18px; margin: 0 4px 4px 0; white-space: nowrap;">${text}</span>`;
}

function buildStudentDigestHtml(jobs, unsubscribeUrl) {
  const cards = jobs
    .map(
      (job) => {
        const pills = [];
        if (job.subject) {
          job.subject.split(', ').forEach((s) => pills.push(pill(s, '#eff6ff', '#1d4ed8', '#bfdbfe')));
        }
        if (job.level) pills.push(pill(job.level, '#f9fafb', '#374151', '#e5e7eb'));
        pills.push(pill(formatFormat(job.format, job.region), '#f9fafb', '#374151', '#e5e7eb'));
        if (job.hourly_rate_min && job.hourly_rate_max) {
          pills.push(pill(`${job.hourly_rate_min}-${job.hourly_rate_max}만원/시간`, '#eff6ff', '#1d4ed8', '#bfdbfe'));
        }

        return `
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 12px;">
          <tr>
            <td style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-weight: 600; font-size: 14px; color: #111827; padding-bottom: 2px;">
                  ${Array.isArray(job.title) ? job.title.join(' · ') : job.title}
                </td>
                <td width="50" align="right" valign="top">
                  <span style="display: inline-block; padding: 2px 8px; background: #f0fdf4; color: #15803d; border: 1px solid #86efac; border-radius: 9999px; font-size: 11px; font-weight: 500; white-space: nowrap;">모집중</span>
                </td>
              </tr></table>
              <div style="padding-top: 10px; line-height: 26px;">
                ${pills.join('')}
              </div>
              <div style="padding-top: 8px;">
                <a href="${SITE_URL}/students" style="color: #2563eb; font-size: 13px; text-decoration: none; font-weight: 500;">자세히 보기 →</a>
              </div>
            </td>
          </tr>
        </table>`;
      }
    )
    .join('');

  return wrapInLayout(
    '학생 게시판',
    `오늘 새로 올라온 학생 요청 <strong>${jobs.length}건</strong>을 확인하세요.`,
    cards,
    `${SITE_URL}/students`,
    unsubscribeUrl
  );
}

function buildHagwonDigestHtml(requests, unsubscribeUrl) {
  const cards = requests
    .map(
      (req) => {
        const pills = [];
        if (req.type) {
          req.type.split(', ').forEach((t) => pills.push(pill(t === 'both' ? 'IB + SAT' : t, '#faf5ff', '#7e22ce', '#e9d5ff')));
        }
        if (req.ib_subjects) {
          req.ib_subjects.split(', ').forEach((s) => pills.push(pill(s, '#eff6ff', '#1d4ed8', '#bfdbfe')));
        }
        if (req.sat_subjects) {
          req.sat_subjects.split(', ').forEach((s) => pills.push(pill(`SAT ${s}`, '#fff7ed', '#c2410c', '#fed7aa')));
        }
        if (req.level) pills.push(pill(req.level, '#f9fafb', '#374151', '#e5e7eb'));
        pills.push(pill(formatFormat(req.format, req.region), '#f9fafb', '#374151', '#e5e7eb'));
        if (req.hourly_rate_min && req.hourly_rate_max) {
          pills.push(pill(`${req.hourly_rate_min}-${req.hourly_rate_max}만원/1달`, '#eff6ff', '#1d4ed8', '#bfdbfe'));
        }

        return `
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 12px;">
          <tr>
            <td style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-weight: 600; font-size: 14px; color: #111827; padding-bottom: 2px;">
                  ${Array.isArray(req.title) ? req.title.join(' · ') : req.title}
                </td>
                <td width="50" align="right" valign="top">
                  <span style="display: inline-block; padding: 2px 8px; background: #f0fdf4; color: #15803d; border: 1px solid #86efac; border-radius: 9999px; font-size: 11px; font-weight: 500; white-space: nowrap;">모집중</span>
                </td>
              </tr></table>
              <div style="padding-top: 10px; line-height: 26px;">
                ${pills.join('')}
              </div>
              <div style="padding-top: 8px;">
                <a href="${SITE_URL}/hagwon-requests" style="color: #2563eb; font-size: 13px; text-decoration: none; font-weight: 500;">자세히 보기 →</a>
              </div>
            </td>
          </tr>
        </table>`;
      }
    )
    .join('');

  return wrapInLayout(
    '학원 요청 게시판',
    `오늘 새로 올라온 학원 요청 <strong>${requests.length}건</strong>을 확인하세요.`,
    cards,
    `${SITE_URL}/hagwon-requests`,
    unsubscribeUrl
  );
}

function wrapInLayout(heading, subtitle, cards, ctaUrl, unsubscribeUrl) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">

    <!-- Header card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 16px;">
      <tr>
        <td style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <h1 style="margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #111827;">${heading}</h1>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">${subtitle}</p>
        </td>
      </tr>
    </table>

    <!-- Post cards -->
    ${cards}

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 4px;">
      <tr>
        <td align="center" style="padding: 8px 0 16px;">
          <a href="${ctaUrl}" style="display: inline-block; padding: 12px 32px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
            전체 게시판 보기
          </a>
        </td>
      </tr>
    </table>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 16px 0 0; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0 0 4px;">IBMaster · ibmaster.net</p>
          <p style="margin: 0;">이 이메일은 IBMaster 알림 구독자에게 발송됩니다. <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">수신거부</a></p>
        </td>
      </tr>
    </table>

  </div>
</body>
</html>`;
}
