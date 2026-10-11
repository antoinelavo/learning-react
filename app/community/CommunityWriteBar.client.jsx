'use client';

import { PenSquare } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

// Sticky 글쓰기 bar at the bottom of the feed (same style as the request
// boards' bar). The feed page ends with enough bottom padding to scroll
// its last item clear of it.
export default function CommunityWriteBar() {
  const { user } = useAuth();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="max-w-3xl mx-auto">
        <Button href={user ? '/community/post/new' : '/login'} fullWidth>
          <PenSquare size={18} aria-hidden="true" />
          글쓰기
        </Button>
      </div>
    </div>
  );
}
