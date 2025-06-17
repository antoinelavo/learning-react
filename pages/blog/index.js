import Link from 'next/link';
import { getSortedPostsData } from '@/lib/blog';

export default function BlogIndex({ allPostsData }) {
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">블로그</h1>
      <ul>
        {allPostsData.map(({ slug, date, title }) => (
          <li key={slug} className="mb-4">
            <Link href={`/blog/${slug}`} className="text-blue-600 hover:underline text-lg font-medium">
              {title}
            </Link>
            <p className="text-sm text-gray-500 mt-1">{date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function getStaticProps() {
  const allPostsData = getSortedPostsData();
  return {
    props: {
      allPostsData,
    },
  };
}
