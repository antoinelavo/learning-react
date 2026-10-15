import StudentEditClient from './StudentEditClient';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function StudentEditPage({ params }) {
  const { id } = params;
  return <StudentEditClient studentId={id} />;
}

