import { getAllPostSlugs, getPostData } from '@/lib/blog';

export default function Post({ postData }) {
  return (
    <article className="prose mx-auto max-w-3xl py-10">
      <h1>{postData.title}</h1>
      <p className="text-sm text-gray-500">{postData.date}</p>
      <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
    </article>
  );
}

export async function getStaticPaths() {
  const paths = getAllPostSlugs();
  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const postData = await getPostData(params.slug);
  return {
    props: {
      postData,
    },
  };
}
