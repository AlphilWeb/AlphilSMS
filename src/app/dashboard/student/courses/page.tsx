// app/dashboard/student/courses/page.tsx
import { getStudentEnrolledCourses, getAvailableCoursesForEnrollment } from '@/lib/actions/student.course.actions';
import ErrorMessage from '@/components/ui/error-message';
import { Suspense } from 'react';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import StudentCoursesWrapper from '@/components/students/StudentCourseWrapper';

export default async function StudentCoursesPage() {
  try {
    // Fetch data in parallel but add error handling for each request
    const [enrolledCourses, availableCourses] = await Promise.all([
      getStudentEnrolledCourses().catch(() => []),
      getAvailableCoursesForEnrollment().catch(() => [])
    ]);

    return (
      <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 max-w-7xl mx-auto min-h-[calc(100vh-8rem)]">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-800">My Courses</h1>
              {availableCourses.length > 0 && (
                <a href="/dashboard/student/enrollment" className="...">
                  Enroll in New Courses ({availableCourses.length} of {enrolledCourses.length + availableCourses.length})
                </a>
              )}
            </div>
            
            <Suspense fallback={<LoadingSkeleton className="h-64" />}>
              <StudentCoursesWrapper />
            </Suspense>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error rendering StudentCoursesPage:', error);
    return (
      <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <ErrorMessage
            title="Failed to load courses"
            message={error instanceof Error ? error.message : 'There was an error loading your courses.'}
          />
        </div>
      </main>
    );
  }
}