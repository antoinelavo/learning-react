'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThumbsUp, Flag, Pencil, Trash2 } from 'lucide-react';
import { communityAuthHeaders } from '@/lib/communityClient';
import ReportModal from '@/components/community/ReportModal.client';

export default function PostActions({ slug, initialLikeCount }) {
  const router = useRouter();
  const [postId, setPostId] = useState(null);
  const [isMine, setIsMine] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const headers = await communityAuthHeaders();
      const res = await fetch(`/api/community/posts/${slug}`, { headers });
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setPostId(data.id);
      setIsMine(!!data.is_mine);
      setLiked(!!data.liked);
      setLikeCount(data.like_count);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  async function toggleLike() {
    if (!postId) return;
    const headers = await communityAuthHeaders();
    if (!headers.Authorization) { router.push('/login'); return; }

    const res = await fetch('/api/community/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ postId }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setLiked(data.liked);
    setLikeCount(data.likeCount);
  }

  async function handleDelete() {
    if (!confirm('게시글을 삭제하시겠습니까?')) return;
    const headers = await communityAuthHeaders();
    const res = await fetch(`/api/community/posts/${slug}`, { method: 'DELETE', headers });
    if (res.ok) router.push('/community');
  }

  return (
    <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
      <button
        onClick={toggleLike}
        className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${
          liked ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
      >
        <ThumbsUp size={14} /> {likeCount}
      </button>

      <button
        onClick={() => setShowReport(true)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 px-3 py-1.5"
      >
        <Flag size={14} /> 신고
      </button>

      {isMine && (
        <div className="flex items-center gap-1 ml-auto">
          <Link
            href={`/community/post/${slug}/edit`}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-500 px-2 py-1.5"
          >
            <Pencil size={14} /> 수정
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 px-2 py-1.5"
          >
            <Trash2 size={14} /> 삭제
          </button>
        </div>
      )}

      {showReport && postId && (
        <ReportModal postId={postId} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}
