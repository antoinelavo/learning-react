// app/api/chat/notify-message/route.js
//
// Sends a "new chat message" email. Called fire-and-forget from
// lib/chat/chatClient.js's sendMessage() right after the message row is
// inserted. Must never be able to block sending a message — any problem
// here just means no email went out, logged server-side, returned as
// {ok:false} rather than thrown.
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import { buildChatMessageEmailHtml } from '@/lib/email/chatMessageTemplate';

const resend = new Resend(process.env.RESEND_API_KEY);
// Hardcoded on purpose — see notify-approved/route.js for why
// NEXT_PUBLIC_SITE_URL isn't used here.
const DASHBOARD_URL = 'https://ibmaster.net/dashboard';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'IBMaster <onboarding@resend.dev>';

async function studentDisplayName(userId) {
  const { data } = await supabase.from('users').select('username, email').eq('id', userId).single();
  if (!data) return '학생';
  return data.username || (data.email ? data.email.split('@')[0] : '학생');
}

export async function POST(request) {
  try {
    const { conversationId, senderId, recipientId, messageBody } = await request.json();
    if (!conversationId || !senderId || !recipientId || !messageBody) {
      return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
    }

    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('email, chat_email_notifications')
      .eq('id', recipientId)
      .single();

    if (recipientError || !recipient?.email) {
      console.error('chat notify-message: recipient not found', recipientId, recipientError);
      return NextResponse.json({ ok: false, error: 'recipient_not_found' });
    }

    if (recipient.chat_email_notifications === false) {
      return NextResponse.json({ ok: true, skipped: 'opted_out' });
    }

    // Throttle: only email on the first unread message since the recipient
    // last read this conversation — a rapid back-and-forth shouldn't send
    // one email per message.
    const { count: unreadCount, error: countError } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('recipient_id', recipientId)
      .is('read_at', null);

    if (countError) {
      console.error('chat notify-message: unread count failed', countError);
    } else if ((unreadCount || 0) > 1) {
      return NextResponse.json({ ok: true, skipped: 'already_notified' });
    }

    const { data: senderUser } = await supabase.from('users').select('role').eq('id', senderId).single();

    let senderName;
    if (senderUser?.role === 'teacher') {
      const { data: teacher } = await supabase.from('teachers').select('name').eq('user_id', senderId).single();
      senderName = teacher?.name || '선생님';
    } else {
      senderName = await studentDisplayName(senderId);
    }

    const { error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipient.email,
      subject: `[IBMaster] ${senderName}님이 메시지를 보냈습니다`,
      html: buildChatMessageEmailHtml({
        senderName,
        messagePreview: messageBody,
        dashboardUrl: DASHBOARD_URL,
      }),
    });

    if (sendError) {
      console.error('chat notify-message: resend error', sendError);
      return NextResponse.json({ ok: false, error: 'send_failed' });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('chat notify-message: unhandled error', err);
    return NextResponse.json({ ok: false, error: 'unhandled_error' });
  }
}
