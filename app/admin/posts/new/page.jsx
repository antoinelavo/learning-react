'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = ['IB', 'SAT', '특례입학', '일반'];

export default function AdminNewPostPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('IB');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && role !== 'admin') {
      alert('Access denied.');
      router.push('/');
    }
  }, [loading, role, router]);

  if (loading) return <div className="text-center mt-20">Loading...</div>;
  if (role !== 'admin') return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, description, category, featured, published, slug, date }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '저장 실패');
      router.push('/admin/posts');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto pt-12 px-4 mb-20">
      <Link href="/admin/posts" className="text-sm text-blue-500 hover:underline mb-6 inline-block">
        ← 포스트 목록
      </Link>
      <h1 className="text-xl font-bold mb-6">새 포스트 작성</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="카테고리">
          <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="제목">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="포스트 제목" maxLength={100} className={inputCls} />
        </Field>

        <Field label="슬러그 (URL, 비워두면 자동 생성)">
          <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
            placeholder="my-post-slug" className={inputCls} />
        </Field>

        <Field label="날짜">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </Field>

        <Field label="설명 (SEO 메타 설명, 비워두면 내용에서 자동 추출)">
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="검색 결과에 표시될 설명 (150자 이내)" rows={2} className={inputCls} />
        </Field>

        <Field label="내용 (마크다운)">
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="## 제목&#10;&#10;내용을 입력하세요..." rows={18} className={`${inputCls} font-mono`} />
        </Field>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)}
              className="rounded" />
            📌 주요 정보로 고정 (커뮤니티 상단 표시)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}
              className="rounded" />
            즉시 게시
          </label>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          {submitting ? '저장 중...' : '저장하기'}
        </button>
      </form>
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
