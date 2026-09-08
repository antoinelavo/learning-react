'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <ChatProvider>{children}</ChatProvider>
    </AuthProvider>
  );
}
