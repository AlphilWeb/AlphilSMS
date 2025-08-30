// app/dashboard/lecturer/academic-calendar/page.tsx
import { 
  getEventsForRange,
  getCurrentSemester,
  getKeyAcademicDates
} from '@/lib/actions/academic-calendar.actions';
import AcademicCalendarManager from '@/components/academic.calendar';
import ErrorMessage from '@/components/ui/error-message';

export default async function AcademicCalendarPage() {
  try {
    // Get current date range (current month)
    const currentDate = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // First get the current semester
    const currentSemester = await getCurrentSemester();
    
    // Then fetch the other data in parallel
    const [initialEvents, initialKeyDates] = await Promise.all([
      getEventsForRange(monthStart, monthEnd),
      getKeyAcademicDates(currentSemester?.id || 0)
    ]);

    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">Academic Calendar</h1>
          <p className="text-gray-600">View important dates and events for the academic year</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <AcademicCalendarManager 
            initialEvents={initialEvents}
            initialSemester={currentSemester}
            initialKeyDates={initialKeyDates}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering AcademicCalendarPage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load academic calendar"
          message="There was an error loading calendar data. Please try again later."
        />
      </div>
    );
  }
}