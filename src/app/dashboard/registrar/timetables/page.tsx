// app/dashboard/registrar/timetables/page.tsx
import { getAllTimetables } from '@/lib/actions/registrar.timetable.action';
import RegistrarDashboardHeader from '@/components/registrar-dashboard-header';
import TimetablesList, { Timetable } from '@/components/registrar/timetable-list';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';

export default async function RegistrarTimetablesPage() {
  try {
    // Fetch raw DB results
    const rawTimetables = await getAllTimetables();

    // Map raw results into the Timetable[] shape expected by the component
    const timetables: Timetable[] = rawTimetables.map(t => ({
      id: t.id,
      course: {
        code: t.course.code,   // adjust to match DB field names
        name: t.course.name,
      },
      lecturer: {
        firstName: t.lecturer.firstName,
        lastName: t.lecturer.lastName,
      },
      dayOfWeek: t.dayOfWeek,
      startTime: t.startTime,
      endTime: t.endTime,
      room: t.room || undefined,
    }));

    return (
      <>
        <RegistrarDashboardHeader />
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Timetable Management</h1>
                <hr />
              </div>

              <TimetablesList timetables={timetables} />
            </div>

            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error loading timetables:', error);
    return (
      <>
        <RegistrarDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load timetables"
              message="There was an error loading timetable data. Please try again later."
            />
            <Footer />
          </div>
        </main>
      </>
    );
  }
}
