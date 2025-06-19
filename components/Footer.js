import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 p-[5em]">
      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col justify-between items-center md:flex-row md:justify-between gap-[4em] max-w-[70em]">
          <div className="flex items-center gap-2">
            <img
              src="/images/mainlogo.svg"
              alt="IB Master Logo"
              className="h-6"
            />
          </div>

          <div className="flex flex-col md:flex-row flex-wrap items-start gap-4 font-medium text-gray-800 dark:text-gray-200">
            <Link href="/aboutus" className="hover:underline">
              소개
            </Link>
            <Link href="/terms" className="hover:underline">
              이용약관
            </Link>
            <Link href="/privacy-policy" className="hover:underline">
              개인정보처리방침
            </Link>
            <Link href="/sat-hagwons" className="hover:underline">
              SAT 학원 추천
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
