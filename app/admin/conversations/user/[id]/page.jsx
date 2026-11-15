'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminPeople, getConversationsForAdmin } from '@/lib/chat/chatClient';
import { Button, cardClasses } from '@/components/ui';
import { ConversationRow, RoleBadge } from '../../AdminChatParts';

// Every conversation one user is part of, as teacher or student.
export default function AdminUserConversationsPage() {
  const { role, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams();

  const [person, setPerson] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!authLoading && role !== 'admin') {
      alert('Access denied: Admins only.');
      router.push('/');
    }
  }, [authLoading, role, router]);

  useEffect(() => {
    if (authLoading || role !== 'admin' || !id) return;
    Promise.all([getAdminPeople([id]), getConversationsForAdmin({ userId: id })])
      .then(([people, list]) => {
        setPerson(people[id] || null);
        setConversations(list);
      })
      .catch((err) => {
        console.error('사용자 대화를 불러오지 못했습니다:', err);
        setLoadError('사용자 대화를 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, [authLoading, role, id]);

  if (authLoading) return <div className="text-center mt-20">Loading...</div>;
  if (role !== 'admin') return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 mb-20">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">사용자 대화</h1>
        <Button href="/admin/conversations" variant="secondary" size="sm">
          대화 목록
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      ) : loadError ? (
        <p className="text-red-500 text-sm">{loadError}</p>
      ) : (
        <div className="space-y-4">
          <div className={cardClasses({ padding: 'sm' })}>
            <div className="flex items-center gap-2 min-w-0">
              {person && <RoleBadge role={person.role} />}
              <span className="font-semibold text-gray-900 truncate">{person?.name || '(알 수 없음)'}</span>
            </div>
            {person?.email && <div className="text-sm text-gray-500 mt-1 break-all">{person.email}</div>}
            <div className="text-sm text-gray-500 mt-1">
              대화 {conversations.length}건 · 메시지 {conversations.reduce((n, c) => n + c.messageCount, 0)}개
            </div>
          </div>

          {conversations.length === 0 ? (
            <p className="text-center py-16 text-gray-400 text-sm">대화가 없습니다.</p>
          ) : (
            <div className={cardClasses({ className: 'divide-y divide-gray-100 overflow-hidden' })}>
              {conversations.map((c) => (
                <ConversationRow key={c.id} conversation={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
