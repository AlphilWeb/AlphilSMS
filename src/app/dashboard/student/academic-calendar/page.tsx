import { getAcademicCalendar } from '@/lib/actions/academicCalendar.action';
import AcademicCalendar from '@/components/academic-calendar';
import ErrorMessage from '@/components/ui/error-message';

export default async function AcademicCalendarPage() {
  try {
    const calendarData = await getAcademicCalendar();

    return (
      // <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto  text-white">
        <div className="p-6 max-w-7xl mx-auto bg-emerald-800">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Academic Calendar</h1>
            <AcademicCalendar calendarData={calendarData} />
          </div>
        </div>
      // </main>
    );
  } catch (error) {
    console.error('Error rendering AcademicCalendarPage:', error);
    return (
      // <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 max-w-7xl mx-auto bg-emerald-800">
          <ErrorMessage
            title="Failed to load academic calendar"
            message={error instanceof Error ? error.message : 'There was an error loading the academic calendar.'}
          />
        </div>
      // </main>
    );
  }
}