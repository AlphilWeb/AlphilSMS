// app/dashboard/lecturer/courses/page.tsx
import LecturerDashboardHeader from '@/components/lecturerDashboardHeader';
import LecturerCoursesWrapper from '@/components/lecturer/LecturerCoursesWrapper';
import ErrorMessage from '@/components/ui/error-message';

export default async function LecturerCoursesPage() {
  try {
    return (
      <>
        <LecturerDashboardHeader />

        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800">My Courses & Materials</h1>
              <p className="text-gray-600">Manage your teaching courses and materials</p>
            </div>

            {/* Main Courses Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <LecturerCoursesWrapper />
            </div>
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering LecturerCoursesPage:', error);
    return (
      <>
        <LecturerDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load courses"
              message="There was an error loading your courses. Please try again later."
            />
          </div>
        </main>
      </>
    );
  }
}
