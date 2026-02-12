import JobDetailClient from './JobDetailClient';

export default function JobDetailPage({ params }) {
  const { id } = params;
  return <JobDetailClient jobId={id} />;
}

