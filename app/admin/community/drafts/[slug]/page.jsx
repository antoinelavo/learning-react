'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Button, Notice, cardClasses } from '@/components/ui';
import { CategoryBadges } from '@/components/community/CategoryBadge';
import AuthorLine from '@/components/community/AuthorLine';
import BackButton from '@/components/community/BackButton.client';
import { POST_BODY_CLASSES } from '@/components/community/postBodyClasses';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/authFetch';
import { formatKstDate } from '@/lib/community';

// Preview of one admin draft in the post page layout, with publish and
// delete. The body HTML comes from the API, rendered by communityMarkdownToHtml.
export default function AdminCommunityDraftPage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const slug = useParams().slug;
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState(null);

  useEffect(() => {
    if (!loading && role !== 'admin') {
      alert('Access denied: Admins only.');
      router.push('/');
    }
  }, [loading, role, router]);

  useEffect(() => {
    if (role !== 'admin') return;
    (async () => {
      try {
        const res = await authFetch(`/api/admin/community/drafts/${slug}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok) setDraft(data.draft);
        else setError(data.error || '불러오지 못했습니다.');
      } catch {
        setError('불러오지 못했습니다.');
      }
    })();
  }, [role, slug]);

  async function handlePublish() {
    if (!confirm('이 글을 게시하시겠습니까? 게시하면 모든 사용자에게 보입니다.')) return;
    setBusy(true);
    setError('');
    try {
      const res = await authFetch(`/api/admin/community/drafts/${slug}/publish`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setPublishedSlug(data.slug);
      else setError(data.error || '게시하지 못했습니다.');
    } catch {
      setError('게시하지 못했습니다.');
    }
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm('이 초안을 삭제하시겠습니까?')) return;
    setBusy(true);
    setError('');
    try {
      const res = await authFetch(`/api/admin/community/drafts/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/community/drafts');
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || '삭제하지 못했습니다.');
    } catch {
      setError('삭제하지 못했습니다.');
    }
    setBusy(false);
  }

  if (loading) return <p className="text-center text-sm text-gray-400 mt-20">불러오는 중…</p>;
  if (role !== 'admin') return null;

  if (publishedSlug) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen">
        <Notice color="green" className="mb-4 font-semibold">게시되었습니다.</Notice>
        <div className="flex flex-wrap gap-2">
          <Button href={`/community/post/${encodeURIComponent(publishedSlug)}`}>게시글 보기</Button>
          <Button href="/admin/community/drafts" variant="secondary">초안 목록</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen mb-24">
      <BackButton href="/admin/community/drafts" />

      <Notice color="yellow" className="mb-4 font-semibold">
        미리보기: 아직 게시되지 않은 글입니다. 실제 사이트에는 보이지 않아요.
      </Notice>

      {error && <Notice color="red" className="mb-4">{error}</Notice>}

      {!draft ? (
        !error && <p className="text-center text-sm text-gray-400 mt-10">불러오는 중…</p>
      ) : (
        <>
          <article className={cardClasses({ padding: 'md' })}>
            <header className="mb-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge color="purple">미리보기</Badge>
                {draft.is_pinned && <Badge color="red">공지</Badge>}
                <CategoryBadges post={draft} />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug mt-3 mb-0 break-words">{draft.title}</h1>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-xs text-gray-400">
                <AuthorLine
                  name={draft.author?.username || '이름없는 회원'}
                  isTeacher={false}
                  role={draft.author?.role || null}
                  size="md"
                />
                <span aria-hidden="true">·</span>
                <span>게시일은 게시하는 날로 표시돼요</span>
              </div>
            </header>

            {draft.image_urls?.length > 0 && (
              <div className="flex flex-col gap-3 mb-6">
                {draft.image_urls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt={`${draft.title} 첨부 이미지 ${i + 1}`} className="w-full rounded-xl" />
                ))}
              </div>
            )}

            <div className={POST_BODY_CLASSES} dangerouslySetInnerHTML={{ __html: draft.html }} />
          </article>

          <p className="text-xs text-gray-400 mt-3">마지막 수정 {formatKstDate(draft.updated_at)}</p>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={handlePublish} disabled={busy}>게시하기</Button>
            <Button onClick={handleDelete} disabled={busy} variant="danger">삭제</Button>
          </div>
        </>
      )}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-purple-600 text-white text-sm font-semibold px-4 py-2 shadow-lg pointer-events-none">
        미리보기 모드
      </div>
    </main>
  );
}
