// lib/email/upgradeTemplates.js
// Transactional emails sent when an admin upgrades a teacher: 플러스 tier
// (/admin/plus-payments, /admin/tiers) and premium profile placement
// (/admin/payments). Same visual style as approvalTemplate.js; account
// emails, so no unsubscribe link.

const BODY_STYLE = 'margin: 12px 0 0; font-size: 14px; color: #374151; line-height: 22px;';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function button(href, label, primary) {
  const style = primary
    ? 'background: #2563eb; color: #ffffff; border: 1px solid #2563eb;'
    : 'background: #ffffff; color: #2563eb; border: 1px solid #bfdbfe;';
  return `<a href="${escapeHtml(href)}" style="display: inline-block; margin: 0 4px 8px; padding: 12px 24px; ${style} text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">${label}</a>`;
}

function list(items) {
  const lis = items
    .map((item) => `<li style="margin: 0 0 4px;">${item}</li>`)
    .join('');
  return `<ul style="margin: 12px 0 0; padding-left: 20px; font-size: 14px; color: #374151; line-height: 22px;">${lis}</ul>`;
}

function layout({ teacherName, bodyHtml, buttonsHtml }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 16px;">
      <tr>
        <td style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <h1 style="margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #111827;">축하합니다, ${escapeHtml(teacherName)} 선생님!</h1>
          ${bodyHtml}
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 4px;">
      <tr>
        <td align="center" style="padding: 8px 0 8px;">
          ${buttonsHtml}
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280; text-align: center; line-height: 20px;">
      IBMaster 드림
    </p>

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

export const PLUS_EMAIL_SUBJECT = '[IBMaster] 플러스 업그레이드가 완료되었습니다';
export const PREMIUM_EMAIL_SUBJECT = '[IBMaster] 프리미엄 프로필 등록이 완료되었습니다';

export function buildPlusEmailHtml({ teacherName, studentsUrl }) {
  return layout({
    teacherName,
    bodyHtml: `
          <p style="${BODY_STYLE}">플러스 업그레이드가 완료되었습니다. 지금부터 다음 혜택을 이용하실 수 있습니다.</p>
          ${list(['학생 요청글 연락처 무제한 열람', '별도의 갱신 없이 계속 유지'])}
          <p style="${BODY_STYLE}">새로 올라오는 학생 요청을 가장 먼저 확인하고, 좋은 수업 인연을 만들어 보세요.</p>`,
    buttonsHtml: button(studentsUrl, '학생 찾기 바로가기', true),
  });
}

// Dates are shown in KST, e.g. "2026년 11월 12일".
export function formatKoreanDate(date) {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  });
}

export function buildPremiumEmailHtml({ teacherName, subjects, startDate, endDate, profileUrl, dashboardUrl }) {
  const subjectText = escapeHtml((subjects || []).join(', '));
  return layout({
    teacherName,
    bodyHtml: `
          <p style="${BODY_STYLE}">입금이 확인되어 프리미엄 프로필 등록이 완료되었습니다.</p>
          ${list([
            `노출 과목: ${subjectText}`,
            `노출 기간: ${formatKoreanDate(startDate)} ~ ${formatKoreanDate(endDate)}`,
          ])}
          <p style="${BODY_STYLE}">기간 동안 해당 과목을 검색하는 학생과 학부모님께 선생님의 프로필이 가장 먼저 보여집니다. 프로필 사진과 소개글을 최신 상태로 유지하시면 더 많은 문의를 받으실 수 있습니다.</p>`,
    buttonsHtml: button(profileUrl, '내 프로필 보기', true) + button(dashboardUrl, '대시보드에서 수정하기', false),
  });
}
