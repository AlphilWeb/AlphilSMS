// components/student/courses/enrolled-courses-table.tsx
'use client';

import { useRouter } from 'next/navigation';
import { FiBook, FiCalendar, FiClock } from 'react-icons/fi';

interface Course {
  id: number;
  name: string;
  code: string;
  credits: string;
  description: string | null;
  programName: string | null;
  programCode: string | null;
  semesterName: string | null;
}

interface EnrolledCoursesTableProps {
  courses: Course[];
}

export default function EnrolledCoursesTable({ courses }: EnrolledCoursesTableProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {courses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          You are not enrolled in any courses this semester.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div 
              key={course.id}
              className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-emerald-500 transition-colors cursor-pointer"
              onClick={() => router.push(`/dashboard/student/courses/${course.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{course.name}</h3>
                  <p className="text-sm text-gray-500">{course.code}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                  {course.credits} credits
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {course.description || 'No description available'}
              </p>
              
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <div className="flex items-center">
                  <FiBook className="mr-1" />
                  <span>{course.programName}</span>
                </div>
                <div className="flex items-center">
                  <FiCalendar className="mr-1" />
                  <span>{course.semesterName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}