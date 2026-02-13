// components/MobileMenuToggle.client.jsx
'use client';

import { useState, useEffect } from 'react';
import { getUserRole, getTeacherStatus } from '@/lib/supabase';

export default function MobileMenuToggle() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hagwonExpanded, setHagwonExpanded] = useState(false);
  const [role, setRole] = useState(null);
  const [teacherStatus, setTeacherStatus] = useState(null);

  // Load user info
  useEffect(() => {
    async function loadUserInfo() {
      try {
        const userRole = await getUserRole();
        setRole(userRole);

        if (userRole === 'teacher') {
          const status = await getTeacherStatus();
          setTeacherStatus(status);
        }
      } catch (err) {
        console.error('Error loading user info:', err);
      }
    }

    loadUserInfo();
  }, []);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  const handleClose = () => {
    setSidebarOpen(false);
    setHagwonExpanded(false);
  };

  return (
    <>
      {/* Hamburger button (only on mobile) */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden cursor-pointer p-2"
        aria-label="Open menu"
      >
        <svg viewBox="0 0 100 100" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 40 H80" stroke="#000" strokeWidth="4" strokeLinecap="round" />
          <path d="M20 60 H80" stroke="#000" strokeWidth="4" strokeLinecap="round" />
          <path d="M20 80 H80" stroke="#000" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </button>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[998]"
          onClick={handleClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-screen w-[250px] bg-white shadow-xl flex flex-col pt-8 z-[999] transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleClose}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 100 100" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 20 L80 80" stroke="#000" strokeWidth="4" strokeLinecap="round" />
              <path d="M80 20 L20 80" stroke="#000" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Menu items */}
        <nav className="flex-1">
          {/* 선생님 찾기 */}
          <a
            href="/find"
            className="block w-full py-4 px-6 text-base text-left text-black hover:text-blue-500 hover:bg-blue-50 border-b border-gray-100"
            onClick={handleClose}
          >
            선생님 찾기
          </a>

          {/* 학생 찾기 */}
          <a
            href="/students"
            className="block w-full py-4 px-6 text-base text-left text-black hover:text-blue-500 hover:bg-blue-50 border-b border-gray-100"
            onClick={handleClose}
          >
            학생 찾기
          </a>

          {/* 선생님 등록하기 OR 내 프로필 보기 */}
          {role === 'teacher' && teacherStatus === 'approved' ? (
            <a
              href="/dashboard"
              className="block w-full py-4 px-6 text-base text-left text-black hover:text-blue-500 hover:bg-blue-50 border-b border-gray-100"
              onClick={handleClose}
            >
              내 프로필 보기
            </a>
          ) : (
            <a
              href="/apply"
              className="block w-full py-4 px-6 text-base text-left text-black hover:text-blue-500 hover:bg-blue-50 border-b border-gray-100"
              onClick={handleClose}
            >
              선생님 등록하기
            </a>
          )}

          {/* 학원 추천 (expandable) */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => setHagwonExpanded(!hagwonExpanded)}
              className="flex items-center justify-between w-full py-4 px-6 text-base text-left text-black hover:text-blue-500 hover:bg-blue-50"
            >
              <span>학원 추천</span>
              <svg
                className={`w-5 h-5 transition-transform ${hagwonExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Sub-items */}
            {hagwonExpanded && (
              <div className="bg-gray-50">
                <a
                  href="/hagwons"
                  className="block w-full py-3 pl-12 pr-6 text-sm text-left text-gray-700 hover:text-blue-500 hover:bg-blue-50"
                  onClick={handleClose}
                >
                  IB 학원 추천
                </a>
                <a
                  href="/sat-hagwons"
                  className="block w-full py-3 pl-12 pr-6 text-sm text-left text-gray-700 hover:text-blue-500 hover:bg-blue-50"
                  onClick={handleClose}
                >
                  SAT 학원 추천
                </a>
              </div>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
