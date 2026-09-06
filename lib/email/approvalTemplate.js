// lib/email/approvalTemplate.js
// Transactional "profile approved" email for teachers. Reuses the same
// visual style as the newsletter digest/notify emails (see
// app/api/cron/daily-digest/route.js's wrapInLayout) but as its own small
// self-contained template — this is a one-off account email, not a
// subscription, so it has no unsubscribe link.
export function buildApprovalEmailHtml({ teacherName, dashboardUrl }) {
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
          <h1 style="margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #111827;">축하합니다, ${teacherName}님!</h1>
          <p style="margin: 12px 0 0; font-size: 14px; color: #374151; line-height: 22px;">
            선생님의 프로필이 승인되어, 지금부터 학생들이 IBMaster 홈페이지에서 선생님의 프로필을 확인할 수 있습니다.
          </p>
          <p style="margin: 12px 0 0; font-size: 14px; color: #374151; line-height: 22px;">
            프로필을 확인하시고, 필요한 부분이 있다면 대시보드에서 언제든지 수정하실 수 있습니다.
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 4px;">
      <tr>
        <td align="center" style="padding: 8px 0 16px;">
          <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 32px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
            내 프로필 보기
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280; text-align: center; line-height: 20px;">
      앞으로도 많은 학생들과 좋은 인연 만들어가시길 바랍니다.<br />IBMaster 드림
    </p>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 16px 0 0; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">IBMaster · ibmaster.net</p>
        </td>
      </tr>
    </table>

  </div>
</body>
</html>`;
}
