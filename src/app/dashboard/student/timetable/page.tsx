// app/dashboard/student/timetable/page.tsx
import { getStudentTimetable } from '@/lib/actions/studentTimetable.actions';
import StudentDashboardHeader from '@/components/studentDashboardHeader';
import Timetable from '@/components/timetable/timetable';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';

export default async function TimetablePage() {
  try {
    const timetableData = await getStudentTimetable();

    return (
      <>
        <StudentDashboardHeader />
        
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">My Timetable</h1>
              <Timetable timetableData={timetableData} />
            </div>
            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering TimetablePage:', error);
    return (
      <>
        <StudentDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load timetable"
              message={error instanceof Error ? error.message : 'There was an error loading your timetable.'}
            />
            <Footer />
          </div>
        </main>
      </>
    );
  }
}