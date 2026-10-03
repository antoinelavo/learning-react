'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardCards from './components/DashboardCards';
import TeacherList from './components/TeacherList';
import ABTestTable from './components/ABTestTable';
import FilterUsageTable from './components/FilterUsageTable';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { buttonClasses } from '@/components/ui';

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

  if (loading) return <div className="text-center mt-20">Loading...</div>;
  if (!authorized) return null;

  return (
    <div className="max-w-screen-lg mx-auto pt-6 sm:pt-8 px-4 mb-[20dvh]">
      <div className="flex justify-end gap-2 mb-3">
        <Link
          href="/admin/conversations"
          className={buttonClasses({ size: 'sm' })}
        >
          채팅 대화 →
        </Link>
        <Link
          href="/admin/teachers"
          className={buttonClasses({ size: 'sm' })}
        >
          선생님 검색 →
        </Link>
        <Link
          href="/admin/statistics"
          className={buttonClasses({ size: 'sm' })}
        >
          통계 →
        </Link>
        <Link
          href="/admin/payments"
          className={buttonClasses({ size: 'sm' })}
        >
          결제 요청 →
        </Link>
        <Link
          href="/admin/tiers"
          className={buttonClasses({ size: 'sm' })}
        >
          플러스 회원 →
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
