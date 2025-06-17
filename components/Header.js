import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[1000] text-center flex justify-center items-center py-[30px] h-0 bg-white border-b border-[#e5e7eb]">
      <div className="flex justify-center flex-grow w-full max-w-7xl px-4">
        <Link href="/home" className="mr-[8em]">
          <Image
            src="/images/mainlogo.svg"
            alt="IB 과외 찾기"
            width={150}
            height={40}
            className="cursor-pointer mt-1"
          />
        </Link>
        <div className="hidden lg:flex justify-center">
            {/* Desktop Menu */}
            <ul className="hidden lg:flex menu_items gap-[30px] items-center">
            <li className="px-5">
                <Link href="/find" className="text-sm text-black font-normal hover:text-blue-500">과외 찾기</Link>
            </li>
            <li className="px-5">
                <Link href="/hagwons" className="text-sm text-black font-normal hover:text-blue-500">학원 추천</Link>
            </li>
            <li className="px-5">
                <Link href="/apply" className="text-sm text-black font-normal hover:text-blue-500">선생님 등록하기</Link>
            </li>
            <li className="px-5">
                <Link href="/blog" className="text-sm text-black font-normal hover:text-blue-500">IB 관련 정보</Link>
            </li>
            </ul>
        </div>
        

        {/* Mobile Menu Button */}
        <div className="lg:hidden cursor-pointer" onClick={() => setSidebarOpen(true)}>
          <svg viewBox="0 0 100 100" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 40 H80" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 60 H80" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 80 H80" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Sidebar for mobile */}
      {sidebarOpen && (
        <ul className="fixed top-0 right-0 h-screen w-[250px] bg-white shadow-xl flex flex-col items-center justify-start z-[999]">
          <li className="items-center my-[5dvh] cursor-pointer" onClick={() => setSidebarOpen(false)}>
            <svg viewBox="0 0 100 100" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 20 L80 80" stroke="#000" strokeWidth="3" strokeLinecap="round" />
              <path d="M80 20 L20 80" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </li>
          <li className="w-full h-[10%] text-center">
            <Link href="/find" className="block w-full py-4 hover:text-blue-500">과외 찾기</Link>
          </li>
          <li className="w-full h-[10%] text-center">
            <Link href="/hagwons" className="block w-full py-4 hover:text-blue-500">학원 추천</Link>
          </li>
          <li className="w-full h-[10%] text-center">
            <Link href="/apply" className="block w-full py-4 hover:text-blue-500">선생님 등록하기</Link>
          </li>
          <li className="w-full h-[10%] text-center">
            <Link href="/blog" className="block w-full py-4 hover:text-blue-500">IB 관련 정보</Link>
          </li>
        </ul>
      )}
      
    </header>
  );
}
