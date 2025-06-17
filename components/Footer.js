import Link from 'next/link';

export default function Footer() {
  return (
    <footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 p-[5em]">
        <div class="max-w-screen-xl mx-auto px-4 py-6 space-y-4">

            <div class="flex flex-col justify-between items-center md:flex-row md:justify-between gap-[4em] max-w-[70em]">
                <div class="flex items-center gap-2">
                    <img src="/images/mainlogo.svg" alt="IB Master Logo" class="h-6" />
                </div>

                <div class="flex flex-col md:flex-row items-center flex-wrap items-start gap-4 font-medium text-gray-800 dark:text-gray-200">
                    <a href="/aboutus" class="hover:underline">소개</a>
                    <a href="/terms" class="hover:underline">이용약관</a>
                    <a href="/privacy-policy" class="hover:underline">개인정보처리방침</a>
                    <a href="/sat-hagwons" class="hover:underline">SAT 학원 추천</a>
                </div>
            </div>


        </div>
        </footer>
    
  );
}
