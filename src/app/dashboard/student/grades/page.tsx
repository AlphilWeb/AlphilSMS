// app/dashboard/student/grades/page.tsx
import { getStudentGrades } from '@/lib/actions/studentGrades.actions';
import StudentDashboardHeader from '@/components/studentDashboardHeader';
import GradesTable from '@/components/grades-student/grades-table';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';

export default async function GradesPage() {
  try {
    const grades = await getStudentGrades();

    return (
      <>
        <StudentDashboardHeader />
        
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">My Grades</h1>
              <GradesTable grades={grades} />
            </div>
            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering GradesPage:', error);
    return (
      <>
        <StudentDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load grades"
              message={error instanceof Error ? error.message : 'There was an error loading your grades.'}
            />
            <Footer />
          </div>
        </main>
      </>
    );
  }
}