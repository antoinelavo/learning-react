'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const SUBJECT_SCORES = ['7', '6', '5', '4', '3', '2', '1'];
const EE_TOK_SCORES = ['A', 'B', 'C', 'D', 'E'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + 1 - i);

const emptyForm = {
  title: '',
  description: '',
  subject: '',
  resource_type: 'subject',
  session_month: 'May',
  session_year: CURRENT_YEAR,
  score: '7',
  price_krw: 3000,
};

export default function TeacherResourcesPage() {
  const router = useRouter();
  const { user, role, teacherStatus, loading: authLoading } = useAuth();

  const [resources, setResources] = useState([]);
  const [monthEarnings, setMonthEarnings] = useState(0);
  const [monthSalesCount, setMonthSalesCount] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (role !== 'teacher') {
      router.push('/dashboard');
    }
  }, [authLoading, user, role, router]);

  async function loadMine() {
    setListLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/resources/mine', {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setResources(data.resources || []);
      setMonthEarnings(data.monthEarningsKrw || 0);
      setMonthSalesCount(data.monthSalesCount || 0);
    }
    setListLoading(false);
  }

  useEffect(() => {
    if (user && role === 'teacher') loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  const scoreOptions = form.resource_type === 'subject' ? SUBJECT_SCORES : EE_TOK_SCORES;

  const handleUpload = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!file) {
      setFormError('PDF 파일을 선택해주세요.');
      return;
    }
    if (file.type !== 'application/pdf') {
      setFormError('PDF 파일만 업로드할 수 있습니다.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      body.append('file', file);

      const res = await fetch('/api/resources/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '업로드에 실패했습니다.');

      setForm(emptyForm);
      setFile(null);
      e.target.reset();
      await loadMine();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (resource) => {
    const nextStatus = resource.status === 'active' ? 'unpublished' : 'active';
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/resources/${resource.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) loadMine();
  };

  if (authLoading || !user || role !== 'teacher') {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-gray-500">불러오는 중...</div>;
  }

  if (teacherStatus !== 'approved') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-gray-700">승인된 선생님만 자료를 업로드할 수 있습니다.</p>
        <Link href="/dashboard" className="text-blue-600">대시보드로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-blue-600">&larr; 대시보드</Link>
      <h1 className="text-2xl font-bold text-black mt-4 mb-1">내 자료 관리</h1>
      <p className="text-gray-500 mb-6">
        이번 달 판매 {monthSalesCount}건 · 예상 정산액 ₩{monthEarnings.toLocaleString()}
        <span className="text-xs text-gray-400"> (수수료 15% 제외, 매달 계좌이체로 정산)</span>
      </p>

      <form onSubmit={handleUpload} className="bg-white border rounded-2xl p-6 space-y-4 mb-10">
        <h2 className="font-semibold text-gray-800">새 자료 업로드</h2>
        {formError && <p className="text-red-500 text-sm">{formError}</p>}

        <input
          type="text"
          required
          placeholder="제목"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
        <textarea
          placeholder="설명 (선택)"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full px-3 py-2 border rounded-lg text-sm"
          rows={3}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <input
            type="text"
            required
            placeholder="과목 (예: Economics)"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <select
            value={form.resource_type}
            onChange={(e) => {
              const resource_type = e.target.value;
              setForm((f) => ({
                ...f,
                resource_type,
                score: resource_type === 'subject' ? SUBJECT_SCORES[0] : EE_TOK_SCORES[0],
              }));
            }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="subject">기출/내신</option>
            <option value="ee">EE</option>
            <option value="tok">TOK</option>
          </select>
          <select
            value={form.score}
            onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            {scoreOptions.map((s) => <option key={s} value={s}>{s}점</option>)}
          </select>
          <select
            value={form.session_month}
            onChange={(e) => setForm((f) => ({ ...f, session_month: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="May">May</option>
            <option value="November">November</option>
          </select>
          <select
            value={form.session_year}
            onChange={(e) => setForm((f) => ({ ...f, session_year: Number(e.target.value) }))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <input
            type="number"
            required
            min={0}
            step={500}
            placeholder="가격 (원)"
            value={form.price_krw}
            onChange={(e) => setForm((f) => ({ ...f, price_krw: Number(e.target.value) }))}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-600">PDF 파일 (최대 20MB)</label>
          <input
            type="file"
            accept="application/pdf"
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? '업로드 중...' : '업로드'}
        </button>
      </form>

      <h2 className="font-semibold text-gray-800 mb-3">내가 올린 자료</h2>
      {listLoading ? (
        <p className="text-gray-500">불러오는 중...</p>
      ) : resources.length === 0 ? (
        <p className="text-gray-500">아직 업로드한 자료가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {resources.map((r) => (
            <div key={r.id} className="bg-white border rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-black truncate">{r.title}</p>
                <p className="text-xs text-gray-500">
                  {r.subject} · {r.session_month} {r.session_year} · 점수 {r.score} · ₩{r.price_krw.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    r.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {r.status === 'active' ? '판매중' : '숨김'}
                </span>
                <button
                  onClick={() => toggleStatus(r)}
                  className="text-xs px-3 py-1 rounded border text-gray-600 hover:bg-gray-50"
                >
                  {r.status === 'active' ? '숨기기' : '다시 게시'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
