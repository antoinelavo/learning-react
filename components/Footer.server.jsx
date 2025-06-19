import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 p-[5em]">
      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col justify-between items-center md:flex-row md:justify-between gap-[4em] max-w-[70em] mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/">
              
                <img
                  src="/images/mainlogo.svg"
                  alt="IB Master Logo"
                  className="h-6"
                />
              
            </Link>
          </div>

          {/* Links */}
          <div className="flex flex-col md:flex-row flex-wrap items-start gap-4 font-medium text-gray-800 dark:text-gray-200">
            <Link href="/aboutus"><div className="hover:underline">소개</div></Link>
            <Link href="/terms"><div className="hover:underline">이용약관</div></Link>
            <Link href="/privacy-policy"><div className="hover:underline">개인정보처리방침</div></Link>
            <Link href="/sat-hagwons"><div className="hover:underline">SAT 학원 추천</div></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}