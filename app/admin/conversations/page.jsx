'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import ConversationsTable from './ConversationsTable';

export default function AdminConversationsPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== 'admin') {
      alert('Access denied: Admins only.');
      router.push('/');
    }
  }, [loading, role, router]);

  if (loading) return <div className="text-center mt-20">Loading...</div>;
  if (role !== 'admin') return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 mb-20">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">채팅 대화 목록</h1>
        <Button href="/admin" variant="secondary" size="sm">
          어드민 홈
        </Button>
      </div>
      <ConversationsTable />
    </div>
  );
}
