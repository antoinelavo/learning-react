'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Notice, Tabs, cardClasses } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { communityAuthHeaders } from '@/lib/communityClient';
import AdminAuthor from '@/components/community/AdminAuthor.client';

const REASON_LABELS = {
  spam: '스팸/홍보/광고',
  abuse: '욕설/비방',
  harassment: '괴롭힘',
  off_topic: '주제와 무관함',
  other: '기타',
};

const STATUS_TABS = [
  { value: 'pending', label: '대기' },
  { value: 'resolved', label: '처리됨' },
  { value: 'dismissed', label: '기각' },
];

function reportTarget(r) {
  if (r.post) {
    return { label: '게시글', text: r.post.title, slug: r.post.slug, deleted: r.post.deleted_at, anonymous: r.post.is_anonymous };
  }
  return { label: '댓글', text: r.comment?.content, slug: r.comment?.post?.slug, deleted: r.comment?.deleted_at, anonymous: r.comment?.is_anonymous };
}

export default function AdminCommunityReportsPage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState('pending');
  const [reports, setReports] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && role !== 'admin') {
      alert('Access denied: Admins only.');
      router.push('/');
    }
  }, [loading, role, router]);

  const fetchReports = useCallback(async () => {
    setFetching(true);
    setError('');
    const headers = await communityAuthHeaders();
    const res = await fetch(`/api/admin/community/reports?status=${status}`, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || '불러오지 못했습니다.');
    setReports(Array.isArray(data.reports) ? data.reports : []);
    setFetching(false);
  }, [status]);

  useEffect(() => {
    if (role === 'admin') fetchReports();
  }, [role, fetchReports]);

  async function handleAction(reportId, nextStatus, deleteContent) {
    if (deleteContent && !confirm('콘텐츠를 삭제하고 처리하시겠습니까?')) return;
    const headers = await communityAuthHeaders();
    const res = await fetch(`/api/admin/community/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ status: nextStatus, deleteContent }),
    });
    if (res.ok) {
      setReports(prev => prev.filter(r => r.id !== reportId));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || '처리에 실패했습니다.');
    }
  }

  if (loading) return <p className="text-center text-sm text-gray-400 mt-20">불러오는 중…</p>;
  if (role !== 'admin') return null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen mb-16">
      <Button href="/admin" variant="ghost" size="sm" className="mb-3">어드민 홈</Button>
      <h1 className="text-lg sm:text-xl font-bold text-gray-900 mt-0 mb-4">커뮤니티 신고 관리</h1>

      <Tabs tabs={STATUS_TABS} value={status} onChange={setStatus} className="mb-4" />

      {error && <Notice color="red" compact className="mb-3">{error}</Notice>}

      {fetching ? (
        <p className="text-center text-sm text-gray-400 mt-10">불러오는 중…</p>
      ) : reports.length === 0 ? (
        <p className="text-center text-sm text-gray-400 mt-10">신고가 없습니다.</p>
      ) : (
        <ul className="space-y-3 list-none p-0 m-0">
          {reports.map(r => {
            const target = reportTarget(r);
            return (
              <li key={r.id} className={cardClasses({ padding: 'sm' })}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Badge color="red">{REASON_LABELS[r.reason] || r.reason}</Badge>
                    <Badge color="gray">{target.label}</Badge>
                    {target.anonymous && <Badge color="gray">익명</Badge>}
                    {target.deleted && <Badge color="gray">삭제됨</Badge>}
                  </div>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString('ko-KR')}</span>
                </div>

                {target.slug ? (
                  <Link href={`/community/post/${target.slug}`} className="block text-sm text-gray-900 line-clamp-2 hover:text-blue-600 break-words">
                    {target.text}
                  </Link>
                ) : (
                  <p className="text-sm text-gray-900 line-clamp-2 m-0 break-words">{target.text}</p>
                )}
                {r.detail && <p className="text-xs text-gray-500 mt-2 mb-0">상세: {r.detail}</p>}

                <div className="mt-3">
                  <AdminAuthor author={r.author} />
                </div>

                {status === 'pending' && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {!target.deleted && (
                      <Button variant="danger" size="sm" onClick={() => handleAction(r.id, 'resolved', true)}>
                        삭제 후 처리
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => handleAction(r.id, 'resolved', false)}>
                      처리 (조치 없음)
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleAction(r.id, 'dismissed', false)}>
                      기각
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
