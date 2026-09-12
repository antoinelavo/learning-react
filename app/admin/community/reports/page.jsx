'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { communityAuthHeaders } from '@/lib/communityClient';
import Link from 'next/link';

const REASON_LABELS = {
  spam: '스팸/광고',
  abuse: '욕설/비방',
  harassment: '괴롭힘',
  off_topic: '주제와 무관함',
  other: '기타',
};

export default function AdminCommunityReportsPage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && role !== 'admin') {
      alert('Access denied: Admins only.');
      router.push('/');
    }
  }, [loading, role, router]);

  const fetchReports = useCallback(async () => {
    setFetching(true);
    const headers = await communityAuthHeaders();
    const res = await fetch('/api/admin/community/reports?status=pending', { headers });
    const data = await res.json();
    setReports(Array.isArray(data.reports) ? data.reports : []);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (role === 'admin') fetchReports();
  }, [role, fetchReports]);

  async function handleAction(reportId, status, deleteContent) {
    const headers = await communityAuthHeaders();
    const res = await fetch(`/api/admin/community/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ status, deleteContent }),
    });
    if (res.ok) setReports(prev => prev.filter(r => r.id !== reportId));
  }

  if (loading) return <div className="text-center mt-20">Loading...</div>;
  if (role !== 'admin') return null;

  return (
    <div className="max-w-4xl mx-auto pt-12 px-4 mb-20">
      <div className="mb-6">
        <h1 className="text-xl font-bold">커뮤니티 신고 관리</h1>
        <Link href="/admin" className="text-sm text-blue-500 hover:underline">← 어드민 홈</Link>
      </div>

      {fetching ? (
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">대기 중인 신고가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => {
            const target = r.post
              ? { label: '게시글', title: r.post.title, url: `/community/post/${r.post.slug}`, deleted: r.post.deleted_at }
              : { label: '댓글', title: r.comment?.content, url: `/community/post/${r.comment?.post_id}`, deleted: r.comment?.deleted_at };

            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    {REASON_LABELS[r.reason] || r.reason}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString('ko-KR')}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{target.label} {target.deleted && '(이미 삭제됨)'}</p>
                <p className="text-sm text-gray-900 line-clamp-2 mb-2">{target.title}</p>
                {r.detail && <p className="text-xs text-gray-500 mb-2">상세: {r.detail}</p>}

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleAction(r.id, 'resolved', true)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                  >
                    콘텐츠 삭제 후 처리
                  </button>
                  <button
                    onClick={() => handleAction(r.id, 'resolved', false)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700"
                  >
                    확인함 (조치 없음)
                  </button>
                  <button
                    onClick={() => handleAction(r.id, 'dismissed', false)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
                  >
                    기각
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
