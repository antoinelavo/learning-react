'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card } from '@/components/ui';
import EmailNotificationToggle from '@/components/chat/EmailNotificationToggle.client';
import { useChat } from '@/contexts/ChatContext';
import { getConversationsWithParticipants } from '@/lib/chat/chatClient';
import {
  eventCountdown,
  formatEventDate,
  kstToday,
  readSelectedEventId,
  resolveTargetEvent,
} from '@/lib/examCalendar';
import { timeAgo } from '@/lib/timeAgo';

const SHORTCUTS = [
  { href: '/find', label: '선생님 찾기' },
  { href: '/hagwons', label: 'IB 학원' },
  { href: '/sat-hagwons', label: 'SAT 학원' },
  { href: '/community', label: '커뮤니티' },
  { href: '/tools/ib-calculator', label: 'IB 성적 계산기' },
  { href: '/tools/calendar', label: '시험 일정' },
];

const GUIDES = [
  { href: '/blog/ib-ia-how-to-write', label: 'IA 작성법' },
  { href: '/blog/ib-ee-topics', label: 'EE 주제' },
  { href: '/blog/ib-tok-essay', label: 'TOK 에세이' },
  { href: '/blog/IB-exam-schedule', label: 'IB 시험 일정 가이드' },
];

function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold m-0">{children}</h2>
      {action}
    </div>
  );
}

function DdayCard() {
  const [today, setToday] = useState(null);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const t = kstToday();
    setToday(t);
    setTarget(resolveTargetEvent(readSelectedEventId(), t));
  }, []);

  return (
    <Card padding="sm">
      <SectionTitle
        action={<Button href="/tools/calendar" variant="tinted" size="sm">전체 일정</Button>}
      >
        D-day
      </SectionTitle>
      {!today ? (
        <p className="text-sm text-gray-500 m-0">불러오는 중...</p>
      ) : target ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold m-0 truncate">{target.title}</p>
            <p className="text-sm text-gray-600 m-0">{formatEventDate(target)}</p>
          </div>
          <span className="text-2xl font-bold text-blue-600 shrink-0">
            {eventCountdown(target, today)}
          </span>
        </div>
      ) : (
        <p className="text-sm text-gray-600 m-0">예정된 일정이 없습니다.</p>
      )}
    </Card>
  );
}

function ChatsCard({ user }) {
  const { unreadCount, openPanel, selectConversation, listVersion } = useChat();
  const [conversations, setConversations] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getConversationsWithParticipants(user.id)
      .then((list) => {
        if (!cancelled) setConversations(list.slice(0, 3));
      })
      .catch((err) => {
        console.error('Failed to load conversations', err);
        if (!cancelled) setConversations([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id, listVersion]);

  const open = (id) => {
    if (id) selectConversation(id);
    openPanel();
  };

  return (
    <Card padding="sm">
      <SectionTitle action={unreadCount > 0 ? <Badge color="red">읽지 않음 {unreadCount}</Badge> : null}>
        메시지
      </SectionTitle>
      {conversations === null ? (
        <p className="text-sm text-gray-500 m-0">불러오는 중...</p>
      ) : conversations.length === 0 ? (
        <div className="text-sm text-gray-600">
          <p className="m-0 mb-3">아직 대화가 없습니다. 마음에 드는 선생님께 먼저 메시지를 보내보세요.</p>
          <Button href="/find" size="sm">선생님 찾기</Button>
        </div>
      ) : (
        <>
          <ul className="list-none p-0 m-0 divide-y divide-gray-100">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => open(c.id)}
                  className="w-full text-left py-2 flex items-center justify-between gap-3"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold truncate">{c.displayName}</span>
                    <span className="block text-xs text-gray-500 truncate">{c.lastMessage || '대화를 시작해보세요'}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-400 flex items-center gap-2">
                    {c.lastMessageAt && timeAgo(c.lastMessageAt)}
                    {c.unreadCount > 0 && <Badge color="red">{c.unreadCount}</Badge>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => open(null)}>
            모든 대화 보기
          </Button>
        </>
      )}
    </Card>
  );
}

export default function StudentHub({ user, onLogout, onDelete }) {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold m-0">내 대시보드</h1>

      <DdayCard />
      <ChatsCard user={user} />

      <Card padding="sm">
        <SectionTitle>과외 요청</SectionTitle>
        <p className="text-sm text-gray-600 m-0 mb-3">
          요청 글은 계정과 연결되지 않고, 글을 올릴 때 정한 수정 비밀번호로 관리합니다. 요청 목록에서 내 글을 찾아 수정하거나 마감할 수 있어요.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button href="/students/new" size="sm">새 요청 올리기</Button>
          <Button href="/students" variant="secondary" size="sm">요청 목록 보기</Button>
        </div>
      </Card>

      <Card padding="sm">
        <SectionTitle>바로가기</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SHORTCUTS.map((s) => (
            <Button key={s.href} href={s.href} variant="secondary" size="sm">{s.label}</Button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4 mb-2">IB 가이드</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GUIDES.map((s) => (
            <Button key={s.href} href={s.href} variant="tinted" size="sm">{s.label}</Button>
          ))}
        </div>
      </Card>

      <Card padding="sm">
        <SectionTitle>커뮤니티</SectionTitle>
        <p className="text-sm text-gray-600 m-0 mb-3">내가 쓴 글, 댓글, 스크랩을 한곳에서 볼 수 있어요.</p>
        <Button href="/community/me" variant="secondary" size="sm">내 활동 보기</Button>
      </Card>

      <Card padding="sm">
        <SectionTitle>계정 설정</SectionTitle>
        {user?.email && <p className="text-sm font-medium m-0 mb-1">계정 아이디: {user.email}</p>}
        <p className="text-sm text-gray-600 m-0">학생 계정으로 로그인하셨습니다.</p>
        <div className="mt-3">
          <EmailNotificationToggle userId={user.id} />
        </div>
        <div className="mt-6 flex gap-4 w-full">
          <Button onClick={onLogout} variant="secondary" className="w-1/2">로그아웃</Button>
          <Button onClick={onDelete} variant="danger" className="w-1/2">탈퇴하기</Button>
        </div>
      </Card>
    </div>
  );
}
