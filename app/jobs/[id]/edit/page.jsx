import JobEditClient from './JobEditClient';

export default function JobEditPage({ params }) {
  const { id } = params;
  return <JobEditClient jobId={id} />;
}

