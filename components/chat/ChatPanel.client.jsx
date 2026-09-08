'use client';

import { useEffect, useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { getConversationsWithParticipants } from '@/lib/chat/chatClient';
import ConversationList from './ConversationList.client';
import MessageThread from './MessageThread.client';

// Slide-out drawer hosting the conversation list and, once one is picked,
// the message thread. Mirrors MobileMenuToggle.client.jsx's drawer pattern
// (fixed backdrop + translate-x transition + body scroll lock).
export default function ChatPanel() {
  const { user } = useAuth();
  const { isPanelOpen, closePanel, activeConversationId, listVersion } = useChat();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    document.body.style.overflow = isPanelOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isPanelOpen]);

  // Reset back to the list view every time the panel closes, regardless of
  // how it was closed (X button, backdrop click, or the header toggle).
  useEffect(() => {
    if (!isPanelOpen) setSelected(null);
  }, [isPanelOpen]);

  // Resolve activeConversationId (set e.g. by a teacher profile's "메시지
  // 보내기" button, via openChatWithTeacher) into a full conversation
  // object so the thread view has a display name/avatar to show.
  useEffect(() => {
    if (!activeConversationId || !user) return;
    let cancelled = false;
    getConversationsWithParticipants(user.id).then((list) => {
      if (cancelled) return;
      const match = list.find((c) => c.id === activeConversationId);
      if (match) setSelected(match);
    });
    return () => {
      cancelled = true;
    };
  }, [activeConversationId, user?.id]);

  if (!user) return null;

  return (
    <>
      {isPanelOpen && <div className="fixed inset-0 bg-black/30 z-[998]" onClick={closePanel} />}

      <div
        className={`fixed top-0 right-0 h-screen w-full sm:w-[380px] bg-white shadow-xl flex flex-col z-[999] transform transition-transform duration-300 ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          {selected ? (
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-500"
            >
              <ArrowLeft size={18} /> {selected.displayName}
            </button>
          ) : (
            <span className="font-semibold text-gray-900">채팅</span>
          )}
          <button onClick={closePanel} aria-label="닫기" className="p-1 text-gray-500 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 min-h-0">
          {selected ? (
            <MessageThread conversation={selected} />
          ) : (
            <div className="h-full overflow-y-auto">
              <ConversationList userId={user.id} refreshKey={listVersion} onSelect={setSelected} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
