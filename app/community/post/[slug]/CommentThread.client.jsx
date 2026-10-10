'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsUp, Flag, Trash2, Reply, ImagePlus, X } from 'lucide-react';
import { Button, Notice, Textarea, cardClasses } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { communityAuthHeaders } from '@/lib/communityClient';
import { timeAgo } from '@/lib/timeAgo';
import ReportModal from '@/components/community/ReportModal.client';
import UsernamePrompt from '@/components/community/UsernamePrompt.client';
import AuthorLine from '@/components/community/AuthorLine';
import AdminAuthor from '@/components/community/AdminAuthor.client';

function CommentComposer({ onSubmit, submitting, placeholder = '댓글을 입력해주세요', autoFocus = false, onCancel }) {
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
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={placeholder}
        rows={2}
        maxLength={1000}
        autoFocus={autoFocus}
        className="text-sm resize-none"
      />
      {imageFile && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="truncate">{imageFile.name}</span>
          <Button variant="ghost" size="sm" onClick={() => setImageFile(null)} aria-label="사진 제거">
            <X size={14} aria-hidden="true" />
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
            익명
          </label>
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus size={14} aria-hidden="true" /> 사진
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={e => { setImageFile(e.target.files?.[0] || null); e.target.value = ''; }}
            className="hidden"
          />
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="secondary" size="sm" onClick={onCancel}>취소</Button>
          )}
          <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
            {submitting ? '등록 중...' : '등록'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function CommentRow({ comment, isReply, ctx }) {
  const isDeleted = !!comment.deleted_at;
  const adminAuthor = ctx.adminAuthors?.[comment.id];

  return (
    <div className={isReply ? 'ml-6 sm:ml-8 mt-3 pl-3 border-l-2 border-gray-100' : 'py-3'}>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <AuthorLine
          name={comment.author_display_name}
          isTeacher={comment.is_teacher}
          profilePicture={comment.author_profile_picture}
          profileLink={comment.author_profile_link}
        />
        <span className="text-gray-300" aria-hidden="true">·</span>
        <span className="text-gray-400">{timeAgo(comment.created_at)}</span>
      </div>
      <p className={`text-sm mt-1 mb-0 whitespace-pre-wrap break-words ${isDeleted ? 'text-gray-400' : 'text-gray-800'}`}>
        {comment.content}
      </p>
      {comment.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={comment.image_url} alt="댓글 첨부 이미지" className="mt-2 max-w-[200px] rounded-lg" loading="lazy" />
      )}

      {!isDeleted && (
        <div className="flex flex-wrap items-center gap-1 mt-1 -ml-2">
          <Button
            variant={comment.liked ? 'tinted' : 'ghost'}
            size="sm"
            onClick={() => ctx.onLike(comment.id)}
            aria-pressed={comment.liked}
            aria-label="좋아요"
          >
            <ThumbsUp size={13} aria-hidden="true" /> {comment.like_count}
          </Button>
          {!isReply && (
            <Button variant="ghost" size="sm" onClick={() => ctx.onReply(comment.id)}>
              <Reply size={13} aria-hidden="true" /> 답글
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => ctx.onReport(comment.id)}>
            <Flag size={13} aria-hidden="true" /> 신고
          </Button>
          {(comment.is_mine || ctx.isAdmin) && (
            <Button variant="ghost" size="sm" onClick={() => ctx.onDelete(comment.id)}>
              <Trash2 size={13} aria-hidden="true" /> 삭제
            </Button>
          )}
        </div>
      )}

      {ctx.isAdmin && adminAuthor && (
        <div className="mt-1">
          <AdminAuthor author={adminAuthor} />
        </div>
      )}

      {ctx.replyTarget === comment.id && (
        <div className="ml-6 sm:ml-8 mt-2">
          {ctx.needsUsername ? (
            <UsernamePrompt />
          ) : (
            <CommentComposer
              onSubmit={data => ctx.onSubmitReply(comment.id, data)}
              submitting={ctx.replySubmitting}
              placeholder="답글을 입력해주세요"
              autoFocus
              onCancel={() => ctx.onReply(comment.id)}
            />
          )}
        </div>
      )}

      {comment.replies?.map(reply => (
        <CommentRow key={reply.id} comment={reply} isReply ctx={ctx} />
      ))}
    </div>
  );
}

function updateCommentInTree(comment, targetId, patch) {
  if (comment.id === targetId) return { ...comment, ...patch };
  if (comment.replies) {
    return { ...comment, replies: comment.replies.map(r => (r.id === targetId ? { ...r, ...patch } : r)) };
  }
  return comment;
}

export default function CommentThread({ slug }) {
  const { user, username, role } = useAuth();
  const isAdmin = role === 'admin';
  const needsUsername = !!user && !username;
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [adminAuthors, setAdminAuthors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [error, setError] = useState('');

  const fetchComments = useCallback(async () => {
    try {
      const headers = await communityAuthHeaders();
      const res = await fetch(`/api/community/posts/${slug}/comments`, { headers });
      const data = await res.json();
      if (res.ok) setComments(data.comments || []);

      if (isAdmin) {
        const adminRes = await fetch(`/api/admin/community/posts/${slug}`, { headers });
        if (adminRes.ok) setAdminAuthors((await adminRes.json()).commentAuthors || null);
      }
    } finally {
      setLoading(false);
    }
  }, [slug, isAdmin]);

  useEffect(() => { fetchComments(); }, [fetchComments, user?.id]);

  async function uploadImage(file, headers) {
    if (!file) return null;
    const formData = new FormData();
    formData.append('files', file);
    const res = await fetch('/api/community/images', { method: 'POST', headers, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '이미지 업로드에 실패했습니다.');
    return data.urls?.[0] || null;
  }

  async function postComment({ content, is_anonymous, imageFile }, parentCommentId) {
    if (!user) { router.push('/login'); return false; }
    setError('');
    try {
      const headers = await communityAuthHeaders();
      const image_url = await uploadImage(imageFile, headers);
      const res = await fetch(`/api/community/posts/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ content, is_anonymous, image_url, parent_comment_id: parentCommentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '댓글 작성에 실패했습니다.');
      await fetchComments();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  async function handleNewComment(data) {
    setSubmitting(true);
    const ok = await postComment(data, null);
    setSubmitting(false);
    return ok;
  }

  async function handleReply(parentCommentId, data) {
    setReplySubmitting(true);
    const ok = await postComment(data, parentCommentId);
    setReplySubmitting(false);
    if (ok) setReplyTarget(null);
    return ok;
  }

  async function toggleCommentLike(commentId) {
    if (!user) { router.push('/login'); return; }
    setError('');
    const headers = await communityAuthHeaders();
    const res = await fetch('/api/community/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ commentId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error || '처리에 실패했습니다.'); return; }
    setComments(prev => prev.map(c => updateCommentInTree(c, commentId, { liked: data.liked, like_count: data.likeCount })));
  }

  async function handleDelete(commentId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    setError('');
    const headers = await communityAuthHeaders();
    const res = await fetch(`/api/community/comments/${commentId}`, { method: 'DELETE', headers });
    if (res.ok) {
      await fetchComments();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || '삭제에 실패했습니다.');
    }
  }

  function openReport(commentId) {
    if (!user) { router.push('/login'); return; }
    setReportTarget(commentId);
  }

  const totalCount = comments.reduce(
    (sum, c) => sum + (c.deleted_at ? 0 : 1) + (c.replies?.filter(r => !r.deleted_at).length || 0),
    0
  );

  const ctx = {
    isAdmin,
    adminAuthors,
    needsUsername,
    replyTarget,
    replySubmitting,
    onLike: toggleCommentLike,
    onReply: id => {
      if (!user) { router.push('/login'); return; }
      setReplyTarget(prev => (prev === id ? null : id));
    },
    onReport: openReport,
    onDelete: handleDelete,
    onSubmitReply: handleReply,
  };

  return (
    <section className={cardClasses({ padding: 'md' })}>
      <h2 className="text-base font-semibold text-gray-900 mt-0 mb-4">댓글 {totalCount}</h2>

      {user ? (
        <div className="mb-4">
          {needsUsername ? <UsernamePrompt /> : <CommentComposer onSubmit={handleNewComment} submitting={submitting} />}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 rounded-xl bg-gray-50 p-3">
          <p className="text-sm text-gray-500 m-0">로그인하면 댓글을 작성할 수 있습니다.</p>
          <Button href="/login" size="sm">로그인</Button>
        </div>
      )}

      {error && <Notice color="red" compact className="mb-3">{error}</Notice>}

      {loading ? (
        <p className="text-center text-sm text-gray-400 my-6">불러오는 중…</p>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-gray-400 my-6">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map(comment => (
            <CommentRow key={comment.id} comment={comment} ctx={ctx} />
          ))}
        </div>
      )}

      {reportTarget && (
        <ReportModal commentId={reportTarget} onClose={() => setReportTarget(null)} />
      )}
    </section>
  );
}
