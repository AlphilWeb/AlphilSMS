import { getAcademicCalendar } from '@/lib/actions/academicCalendar.action';
import StudentDashboardHeader from '@/components/studentDashboardHeader';
import AcademicCalendar from '@/components/academic-calendar';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';

export default async function AcademicCalendarPage() {
  try {
    const calendarData = await getAcademicCalendar();

    return (
      <>
        <StudentDashboardHeader />
        
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Academic Calendar</h1>
              <AcademicCalendar calendarData={calendarData} />
            </div>
            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering AcademicCalendarPage:', error);
    return (
      <>
        <StudentDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load academic calendar"
              message={error instanceof Error ? error.message : 'There was an error loading the academic calendar.'}
            />
            <Footer />
          </div>
        </main>
      </>
    );
  }
}