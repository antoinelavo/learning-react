'use client';

import { useEffect, useState } from 'react';
import { getConversationsWithParticipants } from '@/lib/chat/chatClient';

function relativeTime(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

// WhatsApp-style conversation list: avatar, display name, last message
// preview, timestamp, unread indicator.
export default function ConversationList({ userId, refreshKey, onSelect }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getConversationsWithParticipants(userId)
      .then((data) => {
        if (!cancelled) setConversations(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  if (loading) {
    return <p className="text-sm text-gray-400 text-center py-8">불러오는 중...</p>;
  }

  if (conversations.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">아직 대화가 없습니다.</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c)}
          className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
        >
          <img
            src={c.avatarUrl || 'https://ibmaster.antoinelavo.com/teachers/default.jpg'}
            alt={c.displayName}
            className="w-11 h-11 rounded-full object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm text-gray-900 truncate">{c.displayName}</span>
              <span className="text-[11px] text-gray-400 flex-shrink-0">{relativeTime(c.lastMessageAt)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500 truncate">{c.lastMessage || '대화를 시작해보세요'}</span>
              {c.unreadCount > 0 && (
                <span className="h-4 min-w-[16px] px-[3px] rounded-full bg-red-500 text-white text-[10px] leading-4 font-semibold flex items-center justify-center flex-shrink-0">
                  {c.unreadCount > 9 ? '9+' : c.unreadCount}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
