// components/Header.server.jsx
import MobileMenuToggle from './MobileMenuToggle.client';
import DesktopNav from './DesktopNav.client';

export default function Header() {
  return (
    <header className="sticky top-0 z-[1000] text-center flex justify-center items-center py-[1em] bg-white border-b border-[#e5e7eb]">
      <div className="flex justify-between items-center flex-grow w-full max-w-7xl px-[10dvw]">
        <a href="/" className="mr-[8em]">
          <img
            src="/images/mainlogo.svg"
            alt="IB 과외 찾기"
            width={150}
            height={40}
            className="cursor-pointer mt-1"
          />
        </a>

        {/* Desktop nav */}
        <DesktopNav />

        {/* Mobile toggle/sidebar */}
        <MobileMenuToggle />
      </div>
    </header>
  );
}