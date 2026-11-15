'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUnreadCount, subscribeToMyMessages, findConversation } from '@/lib/chat/chatClient';
import { rememberReturnPath } from '@/lib/postLoginRedirect';

const ChatContext = createContext({
  unreadCount: 0,
  isPanelOpen: false,
  activeConversationId: null,
  draft: null,
  listVersion: 0,
  openPanel: () => {},
  closePanel: () => {},
  selectConversation: () => {},
  clearSelection: () => {},
  openChatWithTeacher: async () => {},
  conversationCreated: () => {},
  decrementUnread: () => {},
});

function goToLogin() {
  rememberReturnPath(window.location.pathname + window.location.search);
  window.location.href = '/login';
}

export function ChatProvider({ children }) {
  const { user, role, loading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  // A thread with a teacher that has no conversation row yet:
  // { teacherUserId, name, avatarUrl }. The row is created on the first
  // message (see MessageThread), so opening the panel saves nothing.
  const [draft, setDraft] = useState(null);
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

  // Deep link from the new-message email: /?chat=<conversation id> opens the
  // panel on that conversation (ChatPanel falls back to the list if the user
  // is not a participant). Logged-out users log in first and come back here.
  useEffect(() => {
    if (authLoading) return;
    const params = new URLSearchParams(window.location.search);
    const chatId = params.get('chat');
    if (!chatId) return;
    if (!user) {
      goToLogin();
      return;
    }
    params.delete('chat');
    const rest = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash);
    setDraft(null);
    setActiveConversationId(chatId);
    setIsPanelOpen(true);
  }, [authLoading, user?.id]);

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const clearSelection = useCallback(() => {
    setActiveConversationId(null);
    setDraft(null);
  }, []);
  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setActiveConversationId(null);
    setDraft(null);
  }, []);
  const selectConversation = useCallback((id) => {
    setDraft(null);
    setActiveConversationId(id);
  }, []);
  const decrementUnread = useCallback((n) => setUnreadCount((c) => Math.max(0, c - n)), []);

  // Only students start conversations (enforced again server-side by
  // get_or_create_conversation). Opens the existing conversation if there is
  // one, otherwise a draft — no row is created until a message is sent.
  const openChatWithTeacher = useCallback(
    async (teacherUserId, { name, avatarUrl } = {}) => {
      if (!user) {
        goToLogin();
        return;
      }
      const existingId = await findConversation(user.id, teacherUserId);
      if (existingId) {
        setDraft(null);
        setActiveConversationId(existingId);
      } else {
        setActiveConversationId(null);
        setDraft({ teacherUserId, name: name || '선생님', avatarUrl: avatarUrl || null });
      }
      setIsPanelOpen(true);
    },
    [user]
  );

  // Called by MessageThread once the first message of a draft created the
  // conversation row.
  const conversationCreated = useCallback((id) => {
    setDraft(null);
    setActiveConversationId(id);
    setListVersion((v) => v + 1);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        user,
        role,
        unreadCount,
        isPanelOpen,
        activeConversationId,
        draft,
        listVersion,
        openPanel,
        closePanel,
        selectConversation,
        clearSelection,
        openChatWithTeacher,
        conversationCreated,
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
