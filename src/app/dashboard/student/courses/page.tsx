// app/dashboard/student/courses/page.tsx
import { getStudentEnrolledCourses, getAvailableCoursesForEnrollment } from '@/lib/actions/student.course.actions';
import StudentDashboardHeader from '@/components/studentDashboardHeader';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';
import StudentCourseManager from '@/components/students/student.courses';

export default async function StudentCoursesPage() {
  try {
    const [enrolledCourses, availableCourses] = await Promise.all([
      getStudentEnrolledCourses(),
      getAvailableCoursesForEnrollment()
    ]);

    return (
      <>
        <StudentDashboardHeader />
        
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">My Courses</h1>
                {availableCourses.length > 0 && (
                  <a
                    href="/dashboard/student/enrollment"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Enroll in New Courses ({availableCourses.length})
                  </a>
                )}
              </div>
              
              <StudentCourseManager 
                enrolledCourses={enrolledCourses} 
                availableCourses={availableCourses} 
              />
            </div>
            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering StudentCoursesPage:', error);
    return (
      <>
        <StudentDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load courses"
              message={error instanceof Error ? error.message : 'There was an error loading your courses.'}
            />
            <Footer />
          </div>
        </main>
      </>
    );
  }
}