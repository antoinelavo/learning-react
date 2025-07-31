'use client';

import { useEffect, useState } from 'react';
import { supabase, getUserRole } from '@/lib/supabase';
import DashboardCards from './components/DashboardCards';
import TeacherList from './components/TeacherList';
import ABTestTable from './components/ABTestTable';
import FilterUsageTable from './components/FilterUsageTable';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkRole() {
      const role = await getUserRole();
      if (role !== 'admin') {
        alert('Access denied: Admins only.');
        router.push('/');
      } else {
        setAuthorized(true);
      }
      setLoading(false);
    }

    checkRole();
  }, []);

  if (loading) return <div className="text-center mt-20">Loading...</div>;
  if (!authorized) return null;

  return (
    <div className="max-w-screen-lg mx-auto pt-20 px-4">
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
