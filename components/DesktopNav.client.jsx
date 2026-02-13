// components/DesktopNav.client.jsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DesktopNav() {
  const [showHagwonDropdown, setShowHagwonDropdown] = useState(false);
  const [isApprovedTeacher, setIsApprovedTeacher] = useState(false);
  const [teacherId, setTeacherId] = useState(null);

  useEffect(() => {
    async function checkTeacherStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacher } = await supabase
        .from('teachers')
        .select('id, status')
        .eq('user_id', user.id)
        .single();

      if (teacher && teacher.status === 'approved') {
        setIsApprovedTeacher(true);
        setTeacherId(teacher.id);
      }
    }

    checkTeacherStatus();
  }, []);

  return (
    <nav className="hidden lg:flex justify-center">
      <ul className="menu_items flex gap-[30px] items-center">
        {/* 선생님 찾기 */}
        <li className="px-5">
          <a href="/find" className="text-sm text-black font-normal hover:text-blue-500">
            선생님 찾기
          </a>
        </li>

        {/* 학생 찾기 */}
        <li className="px-5">
          <a href="/students" className="text-sm text-black font-normal hover:text-blue-500">
            학생 찾기
          </a>
        </li>

        {/* 선생님 등록하기 / 내 프로필 보기 */}
        <li className="px-5">
          {isApprovedTeacher ? (
            <a href={`/dashboard`} className="text-sm text-black font-normal hover:text-blue-500">
              내 프로필 보기
            </a>
          ) : (
            <a href="/apply" className="text-sm text-black font-normal hover:text-blue-500">
              선생님 등록하기
            </a>
          )}
        </li>

        {/* 학원 추천 (with dropdown) */}
        <li className="px-5 relative group">
          <button className="text-sm text-black font-normal hover:text-blue-500 flex items-center gap-1">
            학원 추천
            <svg
              className={`w-4 h-4 transition-transform ${showHagwonDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          <ul className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[180px] z-[1001] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <li>
              <a
                href="/hagwon-requests"
                className="block px-4 py-2 text-sm text-black hover:bg-blue-50 hover:text-blue-500"
              >
                학원 찾기 게시판
              </a>
            </li>
            <li>
              <a
                href="/hagwons"
                className="block px-4 py-2 text-sm text-black hover:bg-blue-50 hover:text-blue-500"
              >
                IB 학원 추천
              </a>
            </li>
            <li>
              <a
                href="/sat-hagwons"
                className="block px-4 py-2 text-sm text-black hover:bg-blue-50 hover:text-blue-500"
              >
                SAT 학원 추천
              </a>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}
