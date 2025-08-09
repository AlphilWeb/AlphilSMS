'use client';

import dynamic from 'next/dynamic';

const LecturerCoursesClient = dynamic(
  () => import('./lecturer.manage.courses'),
  { ssr: false }
);

export default function LecturerCoursesWrapper() {
  return <LecturerCoursesClient />;
}
