'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

  if (loading) return <div className="text-center mt-20">Loading...</div>;
  if (!authorized) return null;

  return (
    <div className="max-w-screen-lg mx-auto pt-20 px-4 mb-[20dvh]">
      <div className="flex justify-end mb-4">
        <Link
          href="/admin/teachers"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          선생님 검색 →
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
