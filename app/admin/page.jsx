'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import DashboardCards from './components/DashboardCards';
import TeacherList from './components/TeacherList';
import ABTestTable from './components/ABTestTable';
import FilterUsageTable from './components/FilterUsageTable';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const authorized = role === 'admin';

  useEffect(() => {
    if (!loading && role !== 'admin') {
      alert('Access denied: Admins only.');
      router.push('/');
    }
  }, [loading, role]);

  // Pending 플러스 bank-transfer requests, shown on the link below.
  const [pendingPlusCount, setPendingPlusCount] = useState(null);

  useEffect(() => {
    if (!authorized) return;
    supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('provider', 'bank_transfer')
      .eq('status', 'pending')
      .then(({ count, error }) => {
        if (!error) setPendingPlusCount(count ?? 0);
      });
  }, [authorized]);

  if (loading) return <div className="text-center mt-20">Loading...</div>;
  if (!authorized) return null;

  return (
    <div className="max-w-screen-lg mx-auto pt-6 sm:pt-8 px-4 mb-[20dvh]">
      <div className="flex flex-wrap justify-end gap-2 mb-3">
        <Link
          href="/admin/conversations"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          채팅 대화 →
        </Link>
        <Link
          href="/admin/teachers"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          선생님 검색 →
        </Link>
        <Link
          href="/admin/statistics"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          통계 →
        </Link>
        <Link
          href="/admin/payments"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          결제 요청 →
        </Link>
        <Link
          href="/admin/tiers"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          플러스 회원 →
        </Link>
        <Link
          href="/admin/plus-payments"
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          플러스 결제 요청
          {pendingPlusCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 leading-none">
              {pendingPlusCount}
            </span>
          )}
          →
        </Link>
      </div>
      <DashboardCards />
      {/* <section className="mt-10">
        <h3 className="text-lg font-semibold mb-4">🔍 A/B Test Stats</h3>
        <ABTestTable />
      </section> */}
      <TeacherList />
      {/* <FilterUsageTable /> */}
    </div>
  );
}
