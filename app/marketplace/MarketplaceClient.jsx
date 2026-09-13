'use client';

import { useEffect, useState, useCallback } from 'react';
import ResourceCard from '@/components/ResourceCard';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + 1 - i);

export default function MarketplaceClient() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    q: '',
    subject: '',
    resource_type: '',
    session_month: '',
    session_year: '',
    score: '',
  });

  const loadResources = useCallback(async (activeFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const res = await fetch(`/api/resources?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '자료를 불러오지 못했습니다.');
      setResources(data.resources || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loadResources(filters);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-black mb-1">IB 자료 마켓플레이스</h1>
      <p className="text-gray-500 mb-6">선생님들이 올린 기출 답안, EE, IA 등 자료를 구매하세요.</p>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <input
          type="text"
          placeholder="검색어 (제목)"
          value={filters.q}
          onChange={(e) => handleFilterChange('q', e.target.value)}
          className="col-span-2 sm:col-span-3 lg:col-span-2 px-3 py-2 border rounded-lg text-sm"
        />
        <input
          type="text"
          placeholder="과목 (예: Economics)"
          value={filters.subject}
          onChange={(e) => handleFilterChange('subject', e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        />
        <select
          value={filters.resource_type}
          onChange={(e) => handleFilterChange('resource_type', e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">종류 전체</option>
          <option value="subject">기출/내신</option>
          <option value="ee">EE</option>
          <option value="tok">TOK</option>
        </select>
        <select
          value={filters.session_month}
          onChange={(e) => handleFilterChange('session_month', e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">시험 회차 전체</option>
          <option value="May">May</option>
          <option value="November">November</option>
        </select>
        <select
          value={filters.session_year}
          onChange={(e) => handleFilterChange('session_year', e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">연도 전체</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <div className="col-span-2 sm:col-span-3 lg:col-span-6 flex gap-2">
          <select
            value={filters.score}
            onChange={(e) => handleFilterChange('score', e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">점수 전체</option>
            {['7', '6', '5', '4', '3', '2', '1', 'A', 'B', 'C', 'D', 'E'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            필터 적용
          </button>
        </div>
      </form>

      {loading && <p className="text-gray-500">불러오는 중...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && resources.length === 0 && (
        <p className="text-gray-500">조건에 맞는 자료가 없습니다.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  );
}
