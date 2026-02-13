import StudentDetailClient from './StudentDetailClient';

export default function StudentDetailPage({ params }) {
  const { id } = params;
  return <StudentDetailClient studentId={id} />;
}

