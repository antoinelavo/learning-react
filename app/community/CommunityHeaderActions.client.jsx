'use client';

import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function CommunityHeaderActions() {
  const { user } = useAuth();
  return (
    <div className="flex items-center gap-2 shrink-0">
      {user && (
        <Button href="/community/me" variant="secondary" size="sm">내 활동</Button>
      )}
      <Button href={user ? '/community/post/new' : '/login'} size="sm">글쓰기</Button>
    </div>
  );
}
