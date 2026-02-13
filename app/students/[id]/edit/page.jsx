import StudentEditClient from './StudentEditClient';

export default function StudentEditPage({ params }) {
  const { id } = params;
  return <StudentEditClient studentId={id} />;
}

