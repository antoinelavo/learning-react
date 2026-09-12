'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllConversationsForAdmin } from '@/lib/chat/chatClient';

function formatDate(iso) {
  if (!iso) return '메시지 없음';
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConversationsTable() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getAllConversationsForAdmin()
      .then(setConversations)
      .catch((err) => console.error('대화 목록을 불러오지 못했습니다:', err))
      .finally(() => setLoading(false));
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = conversations.filter((c) => {
    if (!q) return true;
    return c.teacherName.toLowerCase().includes(q) || c.studentName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="선생님 또는 학생 이름 검색..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />

      <div className="text-sm text-gray-500">
        총 {conversations.length}건 · {filtered.length}건 검색됨
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">대화가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/admin/conversations/${c.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {c.teacherName} · {c.studentName}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {c.lastMessage || '메시지 없음'}
                </div>
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                {formatDate(c.lastMessageAt)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
