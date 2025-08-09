'use client';

import dynamic from 'next/dynamic';
import { getStudentEnrolledCourses } from '@/lib/actions/student.course.actions';
import { useEffect, useState } from 'react';
import type { EnrolledCourse } from '@/lib/actions/student.course.actions';

const StudentCoursesClient = dynamic(
  () => import('./student.courses'),
  { ssr: false }
);

export default function StudentCoursesWrapper() {
  // Add proper type annotations to your state
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [availableCourses] = useState<
    {
      id: number;
      name: string;
      code: string;
      credits: number;
      description: string | null;
      lecturer: {
        firstName: string | null;
        lastName: string | null;
      } | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const enrolled = await getStudentEnrolledCourses();
        setEnrolledCourses(enrolled);
        
        // If you have a function to get available courses:
        // const available = await getAvailableCourses();
        // setAvailableCourses(available);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load courses:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <StudentCoursesClient 
      enrolledCourses={enrolledCourses}
      availableCourses={availableCourses}
    />
  );
}