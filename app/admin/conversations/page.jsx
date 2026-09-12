'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    <div className="max-w-screen-lg mx-auto pt-12 px-4 mb-20">
      <div className="mb-6">
        <h1 className="text-xl font-bold">채팅 대화 목록</h1>
        <Link href="/admin" className="text-sm text-blue-500 hover:underline">← 어드민 홈</Link>
      </div>
      <ConversationsTable />
    </div>
  );
}
