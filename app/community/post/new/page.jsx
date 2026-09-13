'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { communityAuthHeaders } from '@/lib/communityClient';
import { CATEGORY_LIST } from '@/components/community/CategoryBadge';
import Link from 'next/link';
import { X } from 'lucide-react';

const MAX_IMAGES = 5;

export default function NewCommunityPostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORY_LIST[0]);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState([]); // { file, previewUrl }
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) return <div className="text-center mt-20 text-gray-400">로딩 중...</div>;
  if (!user) return null;

  function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > MAX_IMAGES) {
      setError(`이미지는 최대 ${MAX_IMAGES}개까지 첨부할 수 있습니다.`);
      return;
    }
    const oversized = files.find(f => f.size > 5 * 1024 * 1024);
    if (oversized) {
      setError('이미지는 5MB 이하만 첨부할 수 있습니다.');
      return;
    }
    setError('');
    setImages(prev => [...prev, ...files.map(file => ({ file, previewUrl: URL.createObjectURL(file) }))]);
    e.target.value = '';
  }

  function removeImage(index) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('제목을 입력해주세요.'); return; }
    if (!content.trim()) { setError('내용을 입력해주세요.'); return; }

    setSubmitting(true);
    try {
      const headers = await communityAuthHeaders();

      let imageUrls = [];
      if (images.length > 0) {
        setUploading(true);
        const formData = new FormData();
        images.forEach(img => formData.append('files', img.file));
        const uploadRes = await fetch('/api/community/images', { method: 'POST', headers, body: formData });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error || '이미지 업로드에 실패했습니다.');
        imageUrls = uploadJson.urls;
        setUploading(false);
      }

      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          title: title.trim(),
          category,
          content: content.trim(),
          is_anonymous: isAnonymous,
          image_urls: imageUrls,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '게시 실패');
      router.push(`/community/post/${json.slug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 mb-20">
      <Link href="/community" className="text-sm text-blue-500 hover:underline mb-6 inline-block">
        ← 커뮤니티로 돌아가기
      </Link>

      <h1 className="text-xl font-bold text-gray-900 mb-6">글쓰기</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력해주세요"
            maxLength={100}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="내용을 입력해주세요. 마크다운 형식을 지원합니다."
            rows={12}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
          />
          <p className="text-xs text-gray-400 mt-1">**굵게**, *기울임*, ## 제목, - 목록 등 마크다운 사용 가능</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이미지 (최대 {MAX_IMAGES}개, 5MB 이하)</label>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 text-xs hover:border-blue-400 hover:text-blue-500"
              >
                + 사진
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
          익명으로 게시하기
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
        >
          {submitting ? (uploading ? '이미지 업로드 중...' : '게시 중...') : '게시하기'}
        </button>
      </form>
    </main>
  );
}
