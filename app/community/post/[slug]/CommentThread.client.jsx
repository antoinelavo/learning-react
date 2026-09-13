'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsUp, Flag, Trash2, Reply } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { communityAuthHeaders } from '@/lib/communityClient';
import { timeAgo } from '@/lib/timeAgo';
import ReportModal from '@/components/community/ReportModal.client';

function CommentComposer({ onSubmit, submitting, placeholder = '댓글을 입력해주세요', autoFocus = false }) {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    const ok = await onSubmit({ content: content.trim(), is_anonymous: isAnonymous, imageFile });
    if (ok) {
      setContent('');
      setIsAnonymous(false);
      setImageFile(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={placeholder}
        rows={2}
        maxLength={1000}
        autoFocus={autoFocus}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
      />
      {imageFile && (
        <div className="text-xs text-gray-500 flex items-center gap-2">
          📎 {imageFile.name}
          <button type="button" onClick={() => setImageFile(null)} className="text-red-400 hover:underline">제거</button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
            익명
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-gray-400 hover:text-blue-500"
          >
            + 사진
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={e => setImageFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="text-sm font-medium px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white"
        >
          {submitting ? '등록 중...' : '등록'}
        </button>
      </div>
    </form>
  );
}

function CommentRow({ comment, isReply, onLike, onReply, onReport, onDelete, currentReplyTarget, onSubmitReply, replySubmitting }) {
  const isDeleted = !!comment.deleted_at;

  return (
    <div className={isReply ? 'ml-8 mt-3' : 'py-3'}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-gray-800">{comment.author_display_name}</span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-400">{timeAgo(comment.created_at)}</span>
          </div>
          <p className={`text-sm mt-0.5 whitespace-pre-wrap break-words ${isDeleted ? 'text-gray-400 italic' : 'text-gray-800'}`}>
            {comment.content}
          </p>
          {comment.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={comment.image_url} alt="" className="mt-2 max-w-[200px] rounded-lg" />
          )}

          {!isDeleted && (
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
              <button onClick={() => onLike(comment.id)} className={`flex items-center gap-1 hover:text-blue-500 ${comment.liked ? 'text-blue-500' : ''}`}>
                <ThumbsUp size={11} /> {comment.like_count}
              </button>
              {!isReply && (
                <button onClick={() => onReply(comment.id)} className="flex items-center gap-1 hover:text-blue-500">
                  <Reply size={11} /> 답글
                </button>
              )}
              <button onClick={() => onReport(comment.id)} className="flex items-center gap-1 hover:text-red-500">
                <Flag size={11} />
              </button>
              {comment.is_mine && (
                <button onClick={() => onDelete(comment.id)} className="flex items-center gap-1 hover:text-red-500">
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {currentReplyTarget === comment.id && (
        <div className="ml-8 mt-2">
          <CommentComposer
            onSubmit={data => onSubmitReply(comment.id, data)}
            submitting={replySubmitting}
            placeholder="답글을 입력해주세요"
            autoFocus
          />
        </div>
      )}

      {comment.replies?.map(reply => (
        <CommentRow
          key={reply.id}
          comment={reply}
          isReply
          onLike={onLike}
          onReply={onReply}
          onReport={onReport}
          onDelete={onDelete}
          currentReplyTarget={currentReplyTarget}
          onSubmitReply={onSubmitReply}
          replySubmitting={replySubmitting}
        />
      ))}
    </div>
  );
}

export default function CommentThread({ slug }) {
  const { user } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [reportTarget, setReportTarget] = useState(null); // { commentId }

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await communityAuthHeaders();
      const res = await fetch(`/api/community/posts/${slug}/comments`, { headers });
      const data = await res.json();
      if (res.ok) setComments(data.comments || []);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  async function uploadImage(file, headers) {
    if (!file) return null;
    const formData = new FormData();
    formData.append('files', file);
    const res = await fetch('/api/community/images', { method: 'POST', headers, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '이미지 업로드에 실패했습니다.');
    return data.urls?.[0] || null;
  }

  async function handleNewComment({ content, is_anonymous, imageFile }) {
    if (!user) { router.push('/login'); return false; }
    setSubmitting(true);
    try {
      const headers = await communityAuthHeaders();
      const image_url = await uploadImage(imageFile, headers);
      const res = await fetch(`/api/community/posts/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ content, is_anonymous, image_url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchComments();
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentCommentId, { content, is_anonymous, imageFile }) {
    if (!user) { router.push('/login'); return false; }
    setReplySubmitting(true);
    try {
      const headers = await communityAuthHeaders();
      const image_url = await uploadImage(imageFile, headers);
      const res = await fetch(`/api/community/posts/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ content, is_anonymous, image_url, parent_comment_id: parentCommentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReplyTarget(null);
      await fetchComments();
      return true;
    } catch {
      return false;
    } finally {
      setReplySubmitting(false);
    }
  }

  async function toggleCommentLike(commentId) {
    if (!user) { router.push('/login'); return; }
    const headers = await communityAuthHeaders();
    const res = await fetch('/api/community/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ commentId }),
    });
    if (!res.ok) return;
    const { liked, likeCount } = await res.json();
    setComments(prev => prev.map(c => updateCommentInTree(c, commentId, { liked, like_count: likeCount })));
  }

  function updateCommentInTree(comment, targetId, patch) {
    if (comment.id === targetId) return { ...comment, ...patch };
    if (comment.replies) {
      return { ...comment, replies: comment.replies.map(r => r.id === targetId ? { ...r, ...patch } : r) };
    }
    return comment;
  }

  async function handleDelete(commentId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    const headers = await communityAuthHeaders();
    const res = await fetch(`/api/community/comments/${commentId}`, { method: 'DELETE', headers });
    if (res.ok) await fetchComments();
  }

  const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

  return (
    <section className="mt-16 border-t border-gray-200 pt-8">
      <h2 className="text-base font-semibold text-gray-700 mb-4">댓글 {totalCount}</h2>

      {user ? (
        <div className="mb-6">
          <CommentComposer onSubmit={handleNewComment} submitting={submitting} />
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-6">
          <a href="/login" className="text-blue-500 hover:underline">로그인</a>하면 댓글을 작성할 수 있습니다.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : comments.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-6 text-center text-sm text-gray-400">
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map(comment => (
            <CommentRow
              key={comment.id}
              comment={comment}
              onLike={toggleCommentLike}
              onReply={id => setReplyTarget(prev => prev === id ? null : id)}
              onReport={id => setReportTarget({ commentId: id })}
              onDelete={handleDelete}
              currentReplyTarget={replyTarget}
              onSubmitReply={handleReply}
              replySubmitting={replySubmitting}
            />
          ))}
        </div>
      )}

      {reportTarget && (
        <ReportModal commentId={reportTarget.commentId} onClose={() => setReportTarget(null)} />
      )}
    </section>
  );
}
