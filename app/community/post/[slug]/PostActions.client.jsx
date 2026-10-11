'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsUp, Bookmark, Flag, Pencil, Trash2, Pin } from 'lucide-react';
import { Button, Notice } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { communityAuthHeaders } from '@/lib/communityClient';
import ReportModal from '@/components/community/ReportModal.client';
import AdminAuthor from '@/components/community/AdminAuthor.client';

export default function PostActions({ slug, postId, initialLikeCount, initialPinned }) {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const isAdmin = role === 'admin';

  const [isMine, setIsMine] = useState(false);
  const [liked, setLiked] = useState(false);
  const [scrapped, setScrapped] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [pinned, setPinned] = useState(initialPinned);
  const [adminAuthor, setAdminAuthor] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [message, setMessage] = useState('');

  // Records the view and loads the viewer's like/scrap/owner state. Waits
  // for auth so the view is counted once, under the right viewer.
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      const headers = await communityAuthHeaders();
      const res = await fetch(`/api/community/posts/${slug}`, { headers });
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setIsMine(!!data.is_mine);
      setLiked(!!data.liked);
      setScrapped(!!data.scrapped);
      setLikeCount(data.like_count);
    })();
    return () => { cancelled = true; };
  }, [slug, loading]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      const headers = await communityAuthHeaders();
      const res = await fetch(`/api/admin/community/posts/${slug}`, { headers });
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setAdminAuthor(data.post?.author || null);
    })();
    return () => { cancelled = true; };
  }, [isAdmin, slug]);

  // POSTs JSON with the auth header; sends logged-out users to /login and
  // surfaces server errors (e.g. a ban) above the buttons.
  async function send(url, method, body) {
    const headers = await communityAuthHeaders();
    if (!headers.Authorization) { router.push('/login'); return null; }
    setMessage('');
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setMessage(json.error || '처리에 실패했습니다.'); return null; }
    return json;
  }

  async function toggleLike() {
    const data = await send('/api/community/likes', 'POST', { postId });
    if (data) { setLiked(data.liked); setLikeCount(data.likeCount); }
  }

  async function toggleScrap() {
    const data = await send('/api/community/scraps', 'POST', { postId });
    if (data) setScrapped(data.scrapped);
  }

  async function togglePin() {
    const data = await send(`/api/admin/community/posts/${slug}`, 'PATCH', { is_pinned: !pinned });
    if (data) { setPinned(data.is_pinned); router.refresh(); }
  }

  async function handleDelete() {
    if (!confirm('게시글을 삭제하시겠습니까?')) return;
    const data = await send(`/api/community/posts/${slug}`, 'DELETE');
    if (data) { router.push('/community'); router.refresh(); }
  }

  function openReport() {
    if (!user) { router.push('/login'); return; }
    setShowReport(true);
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
      {message && <Notice color="red" compact>{message}</Notice>}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={liked ? 'tinted' : 'secondary'} size="sm" onClick={toggleLike} aria-pressed={liked}>
          <ThumbsUp size={14} aria-hidden="true" /> 좋아요 {likeCount}
        </Button>
        <Button variant={scrapped ? 'tinted' : 'secondary'} size="sm" onClick={toggleScrap} aria-pressed={scrapped}>
          <Bookmark size={14} aria-hidden="true" /> {scrapped ? '스크랩됨' : '스크랩'}
        </Button>
        <Button variant="ghost" size="sm" onClick={openReport}>
          <Flag size={14} aria-hidden="true" /> 신고
        </Button>

        {(isMine || isAdmin) && (
          <div className="flex items-center gap-2 ml-auto">
            {isMine && (
              <Button href={`/community/post/${slug}/edit`} variant="ghost" size="sm">
                <Pencil size={14} aria-hidden="true" /> 수정
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 size={14} aria-hidden="true" /> 삭제
            </Button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="rounded-xl bg-gray-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-700 m-0">관리자</p>
          <Button variant={pinned ? 'tinted' : 'secondary'} size="sm" onClick={togglePin}>
            <Pin size={14} aria-hidden="true" /> {pinned ? '공지 해제' : '공지로 고정'}
          </Button>
          <AdminAuthor author={adminAuthor} />
        </div>
      )}

      {showReport && (
        <ReportModal postId={postId} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}
