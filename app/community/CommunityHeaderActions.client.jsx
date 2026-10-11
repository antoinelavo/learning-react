'use client';

import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function CommunityHeaderActions() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Button href="/community/me" variant="secondary" size="sm" className="shrink-0">내 활동</Button>
  );
}
