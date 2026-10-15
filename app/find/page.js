import TeacherList from './TeacherList';
import { supabase } from '@/lib/supabase';
import { jsonLdString } from '@/lib/hagwonNeis';
import { cardClasses } from '@/components/ui';

const SITE_URL = 'https://www.ibmaster.net';

// The card list is client-rendered, so this server-rendered directory gives
// search engines plain links to every public profile.
export const revalidate = 3600;

// Same filter as TeacherList: approved, non-test teachers only.
async function getDirectoryTeachers() {
  const { data, error } = await supabase
    .from('teachers')
    .select('name')
    .eq('status', 'approved')
    .eq('is_test', false)
    .order('name');
  if (error) {
    console.error('find: failed to fetch teacher directory', error);
    return [];
  }
  return (data || []).filter(t => t.name?.trim());
}

const profilePath = name => `/profile/${encodeURIComponent(name)}`;

function directoryJsonLd(teachers) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'IB 과외 선생님 목록',
    url: `${SITE_URL}/find`,
    numberOfItems: teachers.length,
    itemListElement: teachers.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      url: `${SITE_URL}${profilePath(t.name)}`,
    })),
  };
}

export const metadata = {
  title: 'IB 과외 찾기 | IB Master',
  description: 'IB 과외 선생님을 수수료 없이 쉽고 빠르게 찾아보세요.',
  alternates: {
    canonical: '/find',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/images/favicon.ico',
  },
  openGraph: {
    title: 'IB 과외 찾기',
    description: 'IB 과외 선생님을 수수료 없이 쉽고 빠르게 찾아보세요.',
    url: 'https://www.ibmaster.net/find',
    siteName: 'IB Master',
    locale: 'ko-KR',
    type: 'website',
  },
};

export default async function FindPage() {
  const teachers = await getDirectoryTeachers();
  return (
    <>
      <TeacherList />
      {teachers.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 pb-8">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdString(directoryJsonLd(teachers)) }}
          />
          <details className={cardClasses({ className: 'p-4' })}>
            <summary className="cursor-pointer text-sm font-semibold text-gray-700">
              전체 선생님 목록 ({teachers.length}명)
            </summary>
            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {teachers.map(t => (
                <li key={t.name}>
                  <a href={profilePath(t.name)} className="text-gray-600 hover:underline">{t.name}</a>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </>
  );
}