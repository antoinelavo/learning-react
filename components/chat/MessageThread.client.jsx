'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { getMessages, sendMessage, markRead, subscribeToConversation, startConversation } from '@/lib/chat/chatClient';
import TeacherSummaryCard from './TeacherSummaryCard.client';
import ChatInputBar from './ChatInputBar.client';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function MessageThread({ conversation, onCreated }) {
  const { user } = useAuth();
  const { decrementUnread } = useChat();
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Draft thread: no conversation row yet, so nothing to load or watch.
    if (!conversation.id) return;
    let cancelled = false;

    getMessages(conversation.id).then((data) => {
      if (cancelled) return;
      setMessages(data);
      const unreadIncoming = data.filter((m) => m.recipient_id === user.id && !m.read_at).length;
      if (unreadIncoming > 0) {
        markRead(conversation.id);
        decrementUnread(unreadIncoming);
      }
    });

    const unsubscribe = subscribeToConversation(conversation.id, (message) => {
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      if (message.recipient_id === user.id) {
        markRead(conversation.id);
        decrementUnread(1);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [conversation.id, user.id, decrementUnread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Returns true when the message was saved, so the input bar knows whether
  // to keep or restore the typed text.
  const handleSend = async (body) => {
    if (sending) return false;

    setSending(true);
    setSendError(null);
    let createdId = null;
    try {
      let conversationId = conversation.id;
      if (!conversationId) {
        // First message of a draft: create the conversation row now.
        createdId = await startConversation(user.id, conversation.otherUserId);
        conversationId = createdId;
      }
      const message = await sendMessage({
        conversationId,
        senderId: user.id,
        recipientId: conversation.otherUserId,
        body,
      });
      if (message) {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      }
      return true;
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      setSendError('메시지를 보내지 못했습니다. 다시 시도해주세요.');
      return false;
    } finally {
      // Hand the new id over only after the message is saved, so the thread's
      // reload for that id already includes it. Skipped if the user already
      // left this draft, so the panel doesn't jump back to it.
      if (createdId && mountedRef.current) onCreated?.(createdId);
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {conversation.otherIsTeacher && <TeacherSummaryCard teacherUserId={conversation.otherUserId} />}

      <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2">
        {messages.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                  mine ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
              >
                {m.body}
                <div className={`text-[10px] mt-1 ${mine ? 'text-blue-100' : 'text-gray-400'}`}>
                  {formatTime(m.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <p role="alert" className="px-3 pt-2 text-sm text-red-600">
          {sendError}
        </p>
      )}
      <ChatInputBar onSend={handleSend} disabled={sending} />
    </div>
  );
}
