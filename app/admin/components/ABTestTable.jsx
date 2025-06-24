'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ABTestTable() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase
        .from('page_events')
        .select('event_type, details')
        .in('event_type', ['profile_impression', 'profile_click']);

      if (error) {
        console.error('❌ A/B test fetch error:', error);
        return;
      }

      const stats = {
        A: { impressions: 0, clicks: 0 },
        B: { impressions: 0, clicks: 0 },
        C: { impressions: 0, clicks: 0 },
        null: { impressions: 0, clicks: 0 },
      };

      for (const row of data) {
        let parsedDetails;
        try {
          parsedDetails = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
        } catch (e) {
          parsedDetails = {};
        }
        const variant = parsedDetails.variant ?? 'null';
        if (row.event_type === 'profile_impression') stats[variant].impressions++;
        if (row.event_type === 'profile_click') stats[variant].clicks++;
      }

      const tableRows = Object.entries(stats).map(([variant, values]) => {
        const ctr =
          values.impressions > 0
            ? ((values.clicks / values.impressions) * 100).toFixed(1)
            : '0.0';
        return { variant, ...values, ctr };
      });

      setRows(tableRows);
    }

    fetchStats();
  }, []);

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="px-4 py-2">Variant</th>
            <th className="px-4 py-2">Impressions</th>
            <th className="px-4 py-2">Clicks</th>
            <th className="px-4 py-2">CTR (%)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.variant} className="border-t">
              <td className="px-4 py-2">{row.variant}</td>
              <td className="px-4 py-2">{row.impressions}</td>
              <td className="px-4 py-2">{row.clicks}</td>
              <td className="px-4 py-2">{row.ctr}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
