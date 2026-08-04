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

export async function POST(request) {
  try {
    const { type, post } = await request.json();

    if (!type || !post) {
      return NextResponse.json({ error: 'Missing type or post data' }, { status: 400 });
    }

    // Determine which subscriber table and build email
    const isStudent = type === 'student';
    const subscriberTable = isStudent ? 'newsletter_subscriptions' : 'hagwon_newsletter_subscriptions';

    const { data: subscribers, error: subError } = await supabase
      .from(subscriberTable)
      .select('email, unsubscribe_token');

    if (subError || !subscribers?.length) {
      return NextResponse.json({ message: 'No subscribers found', subscriberCount: 0 });
    }

    const TEST_OVERRIDE_EMAIL = process.env.TEST_OVERRIDE_EMAIL;
    const recipients = TEST_OVERRIDE_EMAIL
      ? subscribers.map((s) => ({ ...s, email: TEST_OVERRIDE_EMAIL }))
      : subscribers;

    const subject = isStudent
      ? `[IBMaster] 새로운 학생 요청이 도착했습니다.`
      : `[IBMaster] 새로운 학생 요청이 도착했습니다.`;

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const results = [];

    for (const sub of recipients) {
      const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${sub.unsubscribe_token}&list=${isStudent ? 'student' : 'hagwon'}`;
      const html = isStudent
        ? buildStudentEmailHtml(post, unsubscribeUrl)
        : buildHagwonEmailHtml(post, unsubscribeUrl);

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: sub.email,
        subject,
        html,
      });
      results.push({ email: sub.email, success: !error, error: error?.message });
      await delay(600);
    }

    return NextResponse.json({
      emailsSent: results.length,
      results,
    });
  } catch (err) {
    console.error('Notify subscribers error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- Email templates ---

function pill(text, bg, color, border) {
  return `<span style="display: inline-block; padding: 2px 8px; background: ${bg}; color: ${color}; border: 1px solid ${border}; border-radius: 9999px; font-size: 11px; line-height: 18px; margin: 0 4px 4px 0; white-space: nowrap;">${text}</span>`;
}

function formatFormat(format, region) {
  const label =
    format === 'online' ? '온라인' : format === 'offline' ? '대면' : '대면/온라인';
  return region && format !== 'online' ? `${label} · ${region}` : label;
}

function buildStudentEmailHtml(post, unsubscribeUrl) {
  const pills = [];
  if (post.subject) {
    post.subject.split(', ').forEach((s) => pills.push(pill(s, '#eff6ff', '#1d4ed8', '#bfdbfe')));
  }
  if (post.level) pills.push(pill(post.level, '#f9fafb', '#374151', '#e5e7eb'));
  pills.push(pill(formatFormat(post.format, post.region), '#f9fafb', '#374151', '#e5e7eb'));
  if (post.hourly_rate_min && post.hourly_rate_max) {
    pills.push(pill(`${post.hourly_rate_min}-${post.hourly_rate_max}만원/시간`, '#eff6ff', '#1d4ed8', '#bfdbfe'));
  }

  return wrapInLayout(
    '새로운 학생 요청이 도착했습니다.',
    buildPostCard(post, pills, `${SITE_URL}/students`),
    unsubscribeUrl
  );
}

function buildHagwonEmailHtml(post, unsubscribeUrl) {
  const pills = [];
  if (post.program_type) {
    post.program_type.split(', ').forEach((t) => pills.push(pill(t === 'both' ? 'IB + SAT' : t, '#faf5ff', '#7e22ce', '#e9d5ff')));
  }
  if (post.ib_subjects) {
    post.ib_subjects.split(', ').forEach((s) => pills.push(pill(s, '#eff6ff', '#1d4ed8', '#bfdbfe')));
  }
  if (post.sat_subjects) {
    post.sat_subjects.split(', ').forEach((s) => pills.push(pill(`SAT ${s}`, '#fff7ed', '#c2410c', '#fed7aa')));
  }
  if (post.level) pills.push(pill(post.level, '#f9fafb', '#374151', '#e5e7eb'));
  pills.push(pill(formatFormat(post.format, post.region), '#f9fafb', '#374151', '#e5e7eb'));
  if (post.hourly_rate_min && post.hourly_rate_max) {
    pills.push(pill(`${post.hourly_rate_min}-${post.hourly_rate_max}만원/1달`, '#eff6ff', '#1d4ed8', '#bfdbfe'));
  }

  return wrapInLayout(
    '새 학원 요청이 올라왔습니다',
    buildPostCard(post, pills, `${SITE_URL}/hagwon-requests`),
    unsubscribeUrl
  );
}

function buildPostCard(post, pills, linkUrl) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 12px;">
      <tr>
        <td style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-weight: 600; font-size: 14px; color: #111827; padding-bottom: 2px;">
              ${Array.isArray(post.title) ? post.title.join(' · ') : post.title}
            </td>
            <td width="50" align="right" valign="top">
              <span style="display: inline-block; padding: 2px 8px; background: #f0fdf4; color: #15803d; border: 1px solid #86efac; border-radius: 9999px; font-size: 11px; font-weight: 500; white-space: nowrap;">모집중</span>
            </td>
          </tr></table>
          <div style="padding-top: 10px; line-height: 26px;">
            ${pills.join('')}
          </div>
          <div style="padding-top: 8px;">
            <a href="${linkUrl}" style="color: #2563eb; font-size: 13px; text-decoration: none; font-weight: 500;">자세히 보기 →</a>
          </div>
        </td>
      </tr>
    </table>`;
}

function wrapInLayout(heading, cardHtml, unsubscribeUrl) {
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
          <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">${heading}</h1>
        </td>
      </tr>
    </table>

    <!-- Post card -->
    ${cardHtml}

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
