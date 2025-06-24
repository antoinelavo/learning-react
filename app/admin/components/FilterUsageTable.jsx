'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function FilterUsageTable() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('page_events')
        .select('details')
        .eq('event_type', 'filter_click');

      if (error) {
        console.error('❌ Filter usage error:', error);
        return;
      }

      const counts = {};
      data.forEach((row) => {
        const { filter_type, value } = row.details || {};
        if (!filter_type || !value) return;
        const key = `${filter_type}: ${value}`;
        counts[key] = (counts[key] || 0) + 1;
      });

      setStats(counts);
    }

    fetchData();
  }, []);

  const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">📊 필터 사용 순위</h2>
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="text-left px-4 py-2">필터</th>
            <th className="text-left px-4 py-2">선택 수</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(([key, count]) => (
            <tr key={key} className="border-t">
              <td className="px-4 py-2">{key}</td>
              <td className="px-4 py-2">{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
