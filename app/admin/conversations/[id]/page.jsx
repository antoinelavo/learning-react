'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getConversationForAdmin, getMessages } from '@/lib/chat/chatClient';

function formatTime(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminConversationDetailPage() {
  const { role, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
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
    Promise.all([getConversationForAdmin(id), getMessages(id)])
      .then(([c, m]) => {
        setConversation(c);
        setMessages(m);
      })
      .catch((err) => {
        console.error('대화를 불러오지 못했습니다:', err);
        setLoadError('대화를 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, [authLoading, role, id]);

  if (authLoading) return <div className="text-center mt-20">Loading...</div>;
  if (role !== 'admin') return null;

  return (
    <div className="max-w-screen-md mx-auto pt-12 px-4 mb-20">
      <div className="mb-6">
        <h1 className="text-xl font-bold">
          {conversation ? `${conversation.teacherName} · ${conversation.studentName}` : '대화 보기'}
        </h1>
        <Link href="/admin/conversations" className="text-sm text-blue-500 hover:underline">
          ← 대화 목록
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      ) : loadError ? (
        <p className="text-red-500 text-sm">{loadError}</p>
      ) : messages.length === 0 ? (
        <p className="text-gray-400 text-sm">주고받은 메시지가 없습니다.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          {messages.map((m) => {
            const fromTeacher = m.sender_id === conversation.teacherUserId;
            return (
              <div key={m.id} className={`flex ${fromTeacher ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                    fromTeacher ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <div className={`text-[10px] mb-1 font-medium ${fromTeacher ? 'text-blue-100' : 'text-gray-500'}`}>
                    {fromTeacher ? conversation.teacherName : conversation.studentName}
                  </div>
                  {m.body}
                  <div className={`text-[10px] mt-1 ${fromTeacher ? 'text-blue-100' : 'text-gray-400'}`}>
                    {formatTime(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
