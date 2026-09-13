'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { getMessages, sendMessage, markRead, subscribeToConversation } from '@/lib/chat/chatClient';
import TeacherSummaryCard from './TeacherSummaryCard.client';
import ChatInputBar from './ChatInputBar.client';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function MessageThread({ conversation }) {
  const { user } = useAuth();
  const { decrementUnread } = useChat();
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
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

  const handleSend = async (body) => {
    if (sending) return;

    setSending(true);
    try {
      const message = await sendMessage({
        conversationId: conversation.id,
        senderId: user.id,
        recipientId: conversation.otherUserId,
        body,
      });
      if (message) {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      }
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
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

      <ChatInputBar onSend={handleSend} disabled={sending} />
    </div>
  );
}
