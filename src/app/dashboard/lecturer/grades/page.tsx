import { getLecturerGrades } from '@/lib/actions/lecturer.manage.grades.action';
import LecturerDashboardHeader from '@/components/lecturerDashboardHeader';
import LecturerGradesManager from '@/components/lecturer/lecturer.manage.grades';
import ErrorMessage from '@/components/ui/error-message';

export default async function LecturerGradesPage() {
  try {
    // Fetch initial grades data from the server
    const initialGrades = await getLecturerGrades();

    return (
      <>
        <LecturerDashboardHeader />
        
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800">Grades Management</h1>
              <p className="text-gray-600">View and update student grades for your courses</p>
            </div>

            {/* Main Grades Content */}
            <div className="bg-white rounded-lg shadow p-6">
              {/* Pass the initial data to the client component */}
              <LecturerGradesManager initialGrades={initialGrades} />
            </div>
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering LecturerGradesPage:', error);
    return (
      <>
        <LecturerDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load grades"
              message="There was an error loading grade information. Please try again later."
            />
          </div>
        </main>
      </>
    );
  }
}