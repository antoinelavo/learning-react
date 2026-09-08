// lib/email/chatMessageTemplate.js
// "New chat message" transactional email — same visual style as
// approvalTemplate.js (white rounded card, blue CTA, plain footer). No
// unsubscribe link: opting out is handled via the per-user
// chat_email_notifications toggle, not a mailing-list unsubscribe.
export function buildChatMessageEmailHtml({ senderName, messagePreview, dashboardUrl }) {
  const preview = messagePreview.length > 140 ? `${messagePreview.slice(0, 140)}...` : messagePreview;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 16px;">
      <tr>
        <td style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <h1 style="margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #111827;">${senderName}님에게 새 메시지가 도착했습니다</h1>
          <p style="margin: 12px 0 0; font-size: 14px; color: #374151; line-height: 22px; padding: 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
            ${preview}
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 4px;">
      <tr>
        <td align="center" style="padding: 8px 0 16px;">
          <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 32px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
            메시지 확인하기
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 16px 0 0; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">IBMaster · ibmaster.net</p>
          <p style="margin: 4px 0 0;">채팅 알림은 대시보드 설정에서 끌 수 있습니다.</p>
        </td>
      </tr>
    </table>

  </div>
</body>
</html>`;
}
