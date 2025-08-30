// app/dashboard/lecturer/timetable/page.tsx
import { getMyTimetable } from '@/lib/actions/lecturer.timetable.action';
import StaffTimetable from '@/components/lecturer/lecturer.timetable';
import ErrorMessage from '@/components/ui/error-message';

export default async function LecturerTimetablePage() {
  try {
    // Fetch timetable data from the server
    const dbTimetable = await getMyTimetable();

    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">My Teaching Timetable</h1>
          <p className="text-gray-600">View your weekly teaching schedule</p>
        </div>

        {/* Main Timetable Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Pass the raw data to the client component - it will handle transformation */}
          <StaffTimetable initialTimetable={dbTimetable} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering LecturerTimetablePage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load timetable"
          message="There was an error loading your timetable. Please try again later."
        />
      </div>
    );
  }
}