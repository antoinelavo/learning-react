'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setOpen(false);
    window.location.href = '/';
  };

  if (loading) {
    return <div className="hidden lg:block w-[72px]" />;
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="hidden lg:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors ml-4"
      >
        로그인
      </a>
    );
  }

  const initial = (user.user_metadata?.full_name?.[0] || user.email?.[0] || '?').toUpperCase();

  return (
    <div className="hidden lg:block relative ml-4" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-blue-500 text-white text-sm font-semibold flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-[1001]">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <a
            href="/dashboard"
            className="block px-4 py-2 text-sm text-black hover:bg-blue-50 hover:text-blue-500"
            onClick={() => setOpen(false)}
          >
            내 정보
          </a>
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
