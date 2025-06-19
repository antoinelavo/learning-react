// components/Header.server.jsx
import Link from 'next/link';
import MobileMenuToggle from './MobileMenuToggle.client';

export default function Header() {
  return (
    <header className="sticky top-0 z-[1000] text-center flex justify-center items-center py-[30px] bg-white border-b border-[#e5e7eb]">
    <div className="flex justify-between items-center flex-grow w-full max-w-7xl px-[10dvw]">
        <Link href="/home" className="mr-[8em]">
          <img
            src="/images/mainlogo.svg"
            alt="IB 과외 찾기"
            width={150}
            height={40}
            className="cursor-pointer mt-1"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex justify-center">
          <ul className="menu_items flex gap-[30px] items-center">
            {[
              ['과외 찾기', '/find'],
              ['학원 추천', '/hagwons'],
              ['선생님 등록하기', '/apply'],
              ['IB 관련 정보', '/blog']
            ].map(([label, href]) => (
              <li key={href} className="px-5">
                <Link href={href} className="text-sm text-black font-normal hover:text-blue-500">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile toggle/sidebar */}
        <MobileMenuToggle />
      </div>
    </header>
  );
}