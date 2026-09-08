'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUnreadCount, subscribeToMyMessages, startConversation } from '@/lib/chat/chatClient';

const ChatContext = createContext({
  unreadCount: 0,
  isPanelOpen: false,
  activeConversationId: null,
  listVersion: 0,
  openPanel: () => {},
  closePanel: () => {},
  selectConversation: () => {},
  openChatWithTeacher: async () => {},
  decrementUnread: () => {},
});

export function ChatProvider({ children }) {
  const { user, role } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  // Bumped whenever something should make the conversation list refetch
  // (a new message arrived, or a new conversation was just started).
  const [listVersion, setListVersion] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;
    getUnreadCount(user.id).then((c) => {
      if (!cancelled) setUnreadCount(c);
    });

    const unsubscribe = subscribeToMyMessages(user.id, () => {
      setUnreadCount((c) => c + 1);
      setListVersion((v) => v + 1);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user?.id]);

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setActiveConversationId(null);
  }, []);
  const selectConversation = useCallback((id) => setActiveConversationId(id), []);
  const decrementUnread = useCallback((n) => setUnreadCount((c) => Math.max(0, c - n)), []);

  // Only students can start a conversation with a teacher (enforced again
  // server-side by get_or_create_conversation's role check) — redirect to
  // login if not signed in at all.
  const openChatWithTeacher = useCallback(
    async (teacherUserId) => {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      const conversationId = await startConversation(user.id, teacherUserId);
      setActiveConversationId(conversationId);
      setIsPanelOpen(true);
      setListVersion((v) => v + 1);
    },
    [user]
  );

  return (
    <ChatContext.Provider
      value={{
        user,
        role,
        unreadCount,
        isPanelOpen,
        activeConversationId,
        listVersion,
        openPanel,
        closePanel,
        selectConversation,
        openChatWithTeacher,
        decrementUnread,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
