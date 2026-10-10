'use client';

import { useState } from 'react';
import { Button, Notice, Textarea, choiceClasses } from '@/components/ui';
import { communityAuthHeaders } from '@/lib/communityClient';

const REASONS = [
  { value: 'spam', label: '스팸/홍보/광고' },
  { value: 'abuse', label: '욕설/비방' },
  { value: 'harassment', label: '괴롭힘' },
  { value: 'off_topic', label: '주제와 무관함' },
  { value: 'other', label: '기타' },
];

export default function ReportModal({ postId, commentId, onClose }) {
  const [reason, setReason] = useState('spam');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const headers = await communityAuthHeaders();
      const res = await fetch('/api/community/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ postId, commentId, reason, detail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '신고 접수에 실패했습니다.');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5"
        onClick={e => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-4">
            <p className="text-sm font-medium text-gray-900 mt-0 mb-4">신고가 접수되었습니다.</p>
            <Button variant="secondary" size="sm" onClick={onClose}>닫기</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 m-0">신고하기</h2>
            <div className="space-y-2">
              {REASONS.map(r => (
                <label key={r.value} className={choiceClasses({ selected: reason === r.value, className: 'flex items-center gap-2 text-sm text-gray-700 cursor-pointer' })}>
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                  />
                  {r.label}
                </label>
              ))}
            </div>
            <Textarea
              value={detail}
              onChange={e => setDetail(e.target.value)}
              placeholder="상세 내용 (선택)"
              rows={3}
              maxLength={500}
              className="text-sm resize-none"
            />
            {error && <Notice color="red" compact>{error}</Notice>}
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={onClose}>취소</Button>
              <Button type="submit" variant="danger" fullWidth disabled={submitting}>
                {submitting ? '접수 중...' : '신고하기'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
