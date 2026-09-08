// lib/chat/chatClient.js
// Client-side helpers for the student<->teacher chat feature. Thin wrappers
// around the shared anon-key supabase client (lib/supabase.js), matching
// this repo's convention of calling Supabase directly from client code.
import { supabase } from '@/lib/supabase';

// A student's display name falls back to the local part of their email,
// since OAuth (Kakao/Google) signups never collect a username — only the
// email/password signup form does.
export function studentDisplayName({ username, email }) {
  if (username) return username;
  if (email) return email.split('@')[0];
  return '학생';
}

// --- Conversations -----------------------------------------------------

// Creates (or reuses) the single conversation between a student and an
// approved teacher. Role/approval validation happens server-side in the
// get_or_create_conversation() RPC — throws if the pairing is invalid.
export async function startConversation(studentId, teacherUserId) {
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    p_student_id: studentId,
    p_teacher_id: teacherUserId,
  });
  if (error) throw error;
  return data; // conversation id
}

// Fetches every conversation the given user is a participant in, enriched
// with the other participant's display info (teacher profile fields, or
// the student's fallback display name) for a WhatsApp-style list.
export async function getConversationsWithParticipants(userId) {
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`student_id.eq.${userId},teacher_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  if (!conversations || conversations.length === 0) return [];

  const teacherUserIds = Array.from(
    new Set(conversations.filter((c) => c.teacher_id !== userId).map((c) => c.teacher_id))
  );
  const studentUserIds = Array.from(
    new Set(conversations.filter((c) => c.student_id !== userId).map((c) => c.student_id))
  );

  const [teachersRes, studentsRes, unreadRes] = await Promise.all([
    teacherUserIds.length > 0
      ? supabase.from('teachers').select('user_id, name, profile_picture').in('user_id', teacherUserIds)
      : Promise.resolve({ data: [] }),
    studentUserIds.length > 0
      ? supabase.from('users').select('id, username, email').in('id', studentUserIds)
      : Promise.resolve({ data: [] }),
    supabase.from('messages').select('conversation_id').eq('recipient_id', userId).is('read_at', null),
  ]);

  const teacherByUserId = Object.fromEntries((teachersRes.data || []).map((t) => [t.user_id, t]));
  const studentByUserId = Object.fromEntries((studentsRes.data || []).map((s) => [s.id, s]));
  const unreadCountByConversation = {};
  (unreadRes.data || []).forEach((m) => {
    unreadCountByConversation[m.conversation_id] = (unreadCountByConversation[m.conversation_id] || 0) + 1;
  });

  return conversations.map((c) => {
    const iAmStudent = c.student_id === userId;
    const otherUserId = iAmStudent ? c.teacher_id : c.student_id;
    const otherIsTeacher = iAmStudent;
    const teacher = teacherByUserId[otherUserId];
    const student = studentByUserId[otherUserId];

    return {
      id: c.id,
      otherUserId,
      otherIsTeacher,
      displayName: otherIsTeacher ? teacher?.name || '선생님' : studentDisplayName(student || {}),
      avatarUrl: otherIsTeacher ? teacher?.profile_picture : null,
      lastMessage: c.last_message_preview,
      lastMessageAt: c.last_message_at,
      unreadCount: unreadCountByConversation[c.id] || 0,
    };
  });
}

// --- Messages ------------------------------------------------------------

export async function getMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function sendMessage({ conversationId, senderId, recipientId, body }) {
  const trimmed = body.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from('messages')
    .insert([{ conversation_id: conversationId, sender_id: senderId, recipient_id: recipientId, body: trimmed }])
    .select()
    .single();
  if (error) throw error;

  // Best-effort notification email — must never block sending the message.
  fetch('/api/chat/notify-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, senderId, recipientId, messageBody: trimmed }),
  }).catch((err) => console.error('chat notify-message failed:', err));

  return data;
}

export async function markRead(conversationId) {
  const { error } = await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId });
  if (error) console.error('markRead failed:', error);
}

export async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null);
  if (error) {
    console.error('getUnreadCount failed:', error);
    return 0;
  }
  return count || 0;
}

// --- Realtime --------------------------------------------------------------

// Fires on every new message addressed to this user, across all of their
// conversations — drives both the header unread badge and live updates to
// the conversation list.
export function subscribeToMyMessages(userId, onInsert) {
  const channel = supabase
    .channel(`chat-inbox-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` },
      (payload) => onInsert(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// Fires on every new message in one specific conversation (either
// direction) — used only while that thread is open.
export function subscribeToConversation(conversationId, onInsert) {
  const channel = supabase
    .channel(`chat-conversation-${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => onInsert(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// --- Settings --------------------------------------------------------------

export async function toggleEmailNotifications(userId, enabled) {
  const { error } = await supabase.from('users').update({ chat_email_notifications: enabled }).eq('id', userId);
  if (error) throw error;
}
