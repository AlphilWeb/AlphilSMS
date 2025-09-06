// app/dashboard/student/timetable/page.tsx
import { getStudentTimetable } from '@/lib/actions/studentTimetable.actions';
import Timetable from '@/components/timetable/timetable';
import ErrorMessage from '@/components/ui/error-message';

export default async function TimetablePage() {
  try {
    const timetableData = await getStudentTimetable();

    return (
      // <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 max-w-7xl mx-auto bg-emerald-800">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">My Timetable</h1>
            <Timetable timetableData={timetableData} />
          </div>
        </div>
      // {/* </main> */}
    );
  } catch (error) {
    console.error('Error rendering TimetablePage:', error);
    return (
      // <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 max-w-7xl mx-auto bg-emerald-800">
          <ErrorMessage
            title="Failed to load timetable"
            message={error instanceof Error ? error.message : 'There was an error loading your timetable.'}
          />
        </div>
      // </main>
    );
  }
}