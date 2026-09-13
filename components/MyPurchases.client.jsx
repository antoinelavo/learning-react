'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// "My Purchases" list for the student dashboard — every paid resource
// purchase, with a Download button that hits the access-gated download
// route (no stored/public link to the file; a fresh authenticated request
// every time).
export default function MyPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/purchases/mine', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleDownload = async (purchase) => {
    setDownloadingId(purchase.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/resources/${purchase.resource_id}/download`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('다운로드에 실패했습니다.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${purchase.resources?.title || 'resource'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return null;
  if (purchases.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-3">구매한 자료</h2>
      <div className="space-y-2">
        {purchases.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-4">
            <div className="min-w-0">
              <p className="font-medium truncate">{p.resources?.title}</p>
              <p className="text-xs text-gray-500">
                {p.resources?.subject} · {p.resources?.session_month} {p.resources?.session_year} · 점수 {p.resources?.score}
              </p>
            </div>
            <button
              onClick={() => handleDownload(p)}
              disabled={downloadingId === p.id}
              className="shrink-0 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {downloadingId === p.id ? '다운로드 중...' : '다운로드'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
