'use client';

import { useState, useRef } from 'react';
import { X, ImagePlus } from 'lucide-react';
import { Button, Input, Notice, Select, Textarea } from '@/components/ui';
import { communityAuthHeaders } from '@/lib/communityClient';
import { CATEGORY_LIST } from '@/lib/community';

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Write/edit form for community posts. Uploads any new images first, then
// calls onSubmit({ title, category, content, is_anonymous, image_urls }),
// which should throw an Error with a Korean message on failure.
export default function PostForm({ initial, submitLabel, submittingLabel, onSubmit }) {
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState(initial?.title || '');
  const [category, setCategory] = useState(initial?.category || CATEGORY_LIST[0]);
  const [content, setContent] = useState(initial?.content || '');
  const [isAnonymous, setIsAnonymous] = useState(!!initial?.is_anonymous);
  // Each image is { url } (already uploaded) or { file, previewUrl } (new).
  const [images, setImages] = useState((initial?.image_urls || []).map(url => ({ url })));
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (images.length + files.length > MAX_IMAGES) {
      setError(`이미지는 최대 ${MAX_IMAGES}개까지 첨부할 수 있습니다.`);
      return;
    }
    if (files.some(f => f.size > MAX_IMAGE_BYTES)) {
      setError('이미지는 5MB 이하만 첨부할 수 있습니다.');
      return;
    }
    setError('');
    setImages(prev => [...prev, ...files.map(file => ({ file, previewUrl: URL.createObjectURL(file) }))]);
  }

  function removeImage(index) {
    setImages(prev => {
      const img = prev[index];
      if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadNewImages() {
    const newImages = images.filter(img => img.file);
    if (!newImages.length) return images.map(img => img.url);

    setUploading(true);
    try {
      const headers = await communityAuthHeaders();
      const formData = new FormData();
      newImages.forEach(img => formData.append('files', img.file));
      const res = await fetch('/api/community/images', { method: 'POST', headers, body: formData });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || '이미지 업로드에 실패했습니다.');

      let next = 0;
      return images.map(img => (img.file ? json.urls[next++] : img.url));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('제목을 입력해주세요.'); return; }
    if (!content.trim()) { setError('내용을 입력해주세요.'); return; }

    setSubmitting(true);
    try {
      const imageUrls = await uploadNewImages();
      await onSubmit({
        title: title.trim(),
        category,
        content: content.trim(),
        is_anonymous: isAnonymous,
        image_urls: imageUrls,
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="post-category" className="block text-sm font-medium text-gray-700 mb-1">게시판</label>
        <Select id="post-category" value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      <div>
        <label htmlFor="post-title" className="block text-sm font-medium text-gray-700 mb-1">제목</label>
        <Input
          id="post-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="제목을 입력해주세요"
          maxLength={100}
        />
      </div>

      <div>
        <label htmlFor="post-content" className="block text-sm font-medium text-gray-700 mb-1">내용</label>
        <Textarea
          id="post-content"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="내용을 입력해주세요."
          rows={12}
          maxLength={20000}
          className="resize-y"
        />
        <p className="text-xs text-gray-400 mt-1 mb-0">**굵게**, *기울임*, ## 제목, - 목록 등 마크다운을 사용할 수 있습니다.</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mt-0 mb-1">사진 (최대 {MAX_IMAGES}개, 5MB 이하)</p>
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={img.url || img.previewUrl} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url || img.previewUrl} alt={`첨부 이미지 ${i + 1}`} className="w-full h-full object-cover" />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => removeImage(i)}
                aria-label="사진 제거"
                className="absolute top-1 right-1 min-h-0 p-1 rounded-full"
              >
                <X size={12} aria-hidden="true" />
              </Button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 flex-col gap-1 text-xs"
            >
              <ImagePlus size={18} aria-hidden="true" />
              사진
            </Button>
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

      {error && <Notice color="red" compact>{error}</Notice>}

      <Button type="submit" fullWidth disabled={submitting}>
        {submitting ? (uploading ? '사진 업로드 중...' : submittingLabel) : submitLabel}
      </Button>
    </form>
  );
}
