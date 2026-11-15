'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getConversationsForAdmin } from '@/lib/chat/chatClient';
import { Input, Select, Tabs, cardClasses } from '@/components/ui';
import { ConversationRow, RoleBadge, formatDate } from './AdminChatParts';

const TABS = [
  { value: 'all', label: '전체 대화' },
  { value: 'teacher', label: '선생님별' },
  { value: 'student', label: '학생별' },
];

const SORTS = {
  all: [
    { value: 'recent', label: '최근 활동순' },
    { value: 'messages', label: '메시지 많은순' },
  ],
  person: [
    { value: 'recent', label: '최근 활동순' },
    { value: 'chats', label: '대화 많은순' },
  ],
};

const time = (iso) => (iso ? new Date(iso).getTime() : 0);

// One row per teacher or student, aggregated from the conversation list.
function groupByPerson(conversations, side) {
  const map = new Map();
  conversations.forEach((c) => {
    const person = c[side];
    const row = map.get(person.id) || { person, chatCount: 0, messageCount: 0, lastMessageAt: null };
    row.chatCount += 1;
    row.messageCount += c.messageCount;
    if (time(c.lastMessageAt) > time(row.lastMessageAt)) row.lastMessageAt = c.lastMessageAt;
    map.set(person.id, row);
  });
  return Array.from(map.values());
}

function matches(person, q) {
  return person.name.toLowerCase().includes(q) || person.email.toLowerCase().includes(q);
}

export default function ConversationsTable() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('recent');
  const [query, setQuery] = useState('');

  useEffect(() => {
    getConversationsForAdmin()
      .then(setConversations)
      .catch((err) => {
        console.error('대화 목록을 불러오지 못했습니다:', err);
        setLoadError('대화 목록을 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, []);

  const changeTab = (value) => {
    setTab(value);
    setSort('recent');
  };

  const q = query.trim().toLowerCase();

  const rows = useMemo(() => {
    if (tab === 'all') {
      const list = conversations.filter((c) => !q || matches(c.teacher, q) || matches(c.student, q));
      return sort === 'messages'
        ? [...list].sort((a, b) => b.messageCount - a.messageCount || time(b.lastMessageAt) - time(a.lastMessageAt))
        : [...list].sort((a, b) => time(b.lastMessageAt) - time(a.lastMessageAt));
    }
    const list = groupByPerson(conversations, tab).filter((r) => !q || matches(r.person, q));
    return sort === 'chats'
      ? list.sort((a, b) => b.chatCount - a.chatCount || time(b.lastMessageAt) - time(a.lastMessageAt))
      : list.sort((a, b) => time(b.lastMessageAt) - time(a.lastMessageAt));
  }, [conversations, tab, sort, q]);

  return (
    <div className="space-y-4">
      <Tabs tabs={TABS} value={tab} onChange={changeTab} />

      <div className="flex gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 또는 이메일 검색..."
          wrapperClassName="flex-1"
          className="flex-1 min-w-0"
        />
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="정렬"
          className="w-auto"
        >
          {SORTS[tab === 'all' ? 'all' : 'person'].map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="text-sm text-gray-500">
        대화 총 {conversations.length}건 · {rows.length}
        {tab === 'all' ? '건' : '명'} 표시
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      ) : loadError ? (
        <p className="text-red-500 text-sm">{loadError}</p>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">대화가 없습니다.</p>
        </div>
      ) : tab === 'all' ? (
        <div className={cardClasses({ className: 'divide-y divide-gray-100 overflow-hidden' })}>
          {rows.map((c) => (
            <ConversationRow key={c.id} conversation={c} />
          ))}
        </div>
      ) : (
        <div className={cardClasses({ className: 'divide-y divide-gray-100 overflow-hidden' })}>
          {rows.map((r) => (
            <Link
              key={r.person.id}
              href={`/admin/conversations/user/${r.person.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <RoleBadge role={r.person.role} />
                  <span className="font-medium text-gray-900 truncate">{r.person.name}</span>
                </div>
                <div className="text-xs text-gray-400 truncate">{r.person.email}</div>
              </div>
              <div className="text-right text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                <div>
                  대화 {r.chatCount}건 · 메시지 {r.messageCount}개
                </div>
                <div className="text-gray-400">{formatDate(r.lastMessageAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
