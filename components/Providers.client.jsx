'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import OnboardingGate from '@/components/OnboardingGate.client';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <ChatProvider>{children}</ChatProvider>
      <OnboardingGate />
    </AuthProvider>
  );
}
