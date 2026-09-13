'use client';

import { MessageCircle } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';

// Header chat icon + unread red dot. Renders nothing when logged out.
export default function ChatButton() {
  const { user, unreadCount, isPanelOpen, openPanel, closePanel } = useChat();

  if (!user) return null;

  return (
    <button
      onClick={() => (isPanelOpen ? closePanel() : openPanel())}
      aria-label="채팅"
      className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-blue-500 transition-colors ml-2"
    >
      <MessageCircle size={22} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-[3px] rounded-full bg-red-500 text-white text-[10px] leading-4 font-semibold flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
