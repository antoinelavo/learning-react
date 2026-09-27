'use client';

import { useState } from 'react';
import { communityAuthHeaders } from '@/lib/communityClient';

const REASONS = [
  { value: 'spam', label: '스팸/광고' },
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
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-4">
            <p className="text-sm font-medium text-gray-900 mb-4">신고가 접수되었습니다.</p>
            <button onClick={onClose} className="text-sm text-blue-500 hover:underline">닫기</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">신고하기</h2>
            <div className="space-y-2">
              {REASONS.map(r => (
                <label key={r.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
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
            <textarea
              value={detail}
              onChange={e => setDetail(e.target.value)}
              placeholder="상세 내용 (선택)"
              rows={3}
              maxLength={500}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 text-sm font-medium py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 text-sm font-medium py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white"
              >
                {submitting ? '접수 중...' : '신고하기'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
