'use client';

import Link from 'next/link';
import { Badge, Button } from '@/components/ui';

export function formatDate(iso) {
  if (!iso) return '메시지 없음';
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RoleBadge({ role }) {
  if (role === 'teacher') return <Badge color="blue">선생님</Badge>;
  if (role === 'admin') return <Badge color="gray">관리자</Badge>;
  return <Badge color="green">학생</Badge>;
}

// Role badge + name, linking to that user's chat list.
export function PersonLink({ person, className = '' }) {
  return (
    <Link
      href={`/admin/conversations/user/${person.id}`}
      className={`inline-flex items-center gap-1.5 min-w-0 hover:underline ${className}`}
    >
      <RoleBadge role={person.role} />
      <span className="font-medium text-gray-900 truncate">{person.name}</span>
    </Link>
  );
}

// Teacher ↔ student row for a conversation list.
export function ConversationRow({ conversation: c }) {
  return (
    <div className="px-4 py-3 space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <PersonLink person={c.teacher} />
        <span className="text-gray-400" aria-hidden="true">↔</span>
        <PersonLink person={c.student} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm text-gray-500 truncate">{c.lastMessage || '메시지 없음'}</div>
          <div className="text-xs text-gray-400">
            메시지 {c.messageCount}개 · {formatDate(c.lastMessageAt)}
          </div>
        </div>
        <Button href={`/admin/conversations/${c.id}`} variant="secondary" size="sm" className="flex-shrink-0">
          대화 보기
        </Button>
      </div>
    </div>
  );
}
