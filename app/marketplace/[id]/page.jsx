'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const TYPE_LABEL = { subject: '기출/내신', ee: 'EE', tok: 'TOK' };

export default function ResourceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [owned, setOwned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/resources/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '자료를 찾을 수 없습니다.');
        setResource(data.resource);

        if (user) {
          const { data: { session } } = await supabase.auth.getSession();
          const purchasesRes = await fetch('/api/purchases/mine', {
            headers: { Authorization: `Bearer ${session?.access_token}` },
          });
          if (purchasesRes.ok) {
            const { purchases } = await purchasesRes.json();
            setOwned(purchases.some((p) => p.resource_id === id));
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (!payment) return;
    if (payment === 'failed') {
      alert('결제에 실패했습니다. 다시 시도해주세요.');
    }
    router.replace(`/marketplace/${id}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuy = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (processing) return;
    if (typeof window === 'undefined' || typeof window.TossPayments === 'undefined') {
      alert('결제 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/resources/${id}/purchase`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.alreadyOwned) {
          setOwned(true);
        } else {
          alert(data.error || '구매를 시작할 수 없습니다.');
        }
        setProcessing(false);
        return;
      }

      const tossPayments = window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
      tossPayments
        .requestPayment('CARD', {
          amount: data.amount,
          orderId: data.orderId,
          orderName: data.orderName,
          customerName: user.email,
          successUrl: `${window.location.origin}/api/toss/resource-success`,
          failUrl: `${window.location.origin}/api/toss/resource-fail`,
        })
        .catch((result) => {
          if (result?.code !== 'USER_CANCEL') {
            alert(`결제 실패: ${result?.message || '알 수 없는 오류'}`);
          }
          setProcessing(false);
        });
    } catch (err) {
      alert('결제 처리 중 오류가 발생했습니다.');
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/resources/${id}/download`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '다운로드에 실패했습니다.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resource.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-gray-500">불러오는 중...</div>;
  if (error || !resource) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-red-500 mb-4">{error || '자료를 찾을 수 없습니다.'}</p>
        <Link href="/marketplace" className="text-blue-600">마켓플레이스로 돌아가기</Link>
      </div>
    );
  }

  const teacherName = resource.teachers?.name || '선생님';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Script src="https://js.tosspayments.com/v1/payment" strategy="afterInteractive" />

      <Link href="/marketplace" className="text-sm text-gray-500 hover:text-blue-600">&larr; 마켓플레이스</Link>

      <div className="mt-4 flex items-center gap-2 mb-3">
        <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded bg-blue-50 text-blue-600">
          {TYPE_LABEL[resource.resource_type] || resource.resource_type}
        </span>
        <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600">
          {resource.session_month} {resource.session_year}
        </span>
        <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded bg-yellow-50 text-yellow-700">
          점수 {resource.score}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-black mb-2">{resource.title}</h1>
      <p className="text-gray-500 mb-1">{resource.subject}</p>
      <p className="text-sm text-gray-400 mb-6">{teacherName}</p>

      {resource.description && (
        <p className="text-gray-700 whitespace-pre-wrap mb-8">{resource.description}</p>
      )}

      <div className="border-t pt-6 flex items-center justify-between">
        <span className="text-2xl font-semibold text-blue-600">
          ₩{resource.price_krw.toLocaleString()}
        </span>

        {owned ? (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-6 py-3 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {downloading ? '다운로드 중...' : '다운로드'}
          </button>
        ) : (
          <button
            onClick={handleBuy}
            disabled={processing}
            className="px-6 py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {processing ? '결제 진행 중...' : '구매하기'}
          </button>
        )}
      </div>
    </div>
  );
}
