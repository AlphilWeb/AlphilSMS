// app/dashboard/admin/timetables/page.tsx
import AdminTimetablesClient from '@/components/admin/admin.timetables.client';
import ErrorMessage from '@/components/ui/error-message';

export default async function AdminTimetablesPage() {
  try {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">Timetable Management</h1>
          <p className="text-gray-600">Manage course schedules and room allocations</p>
        </div>

        {/* Main Timetables Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <AdminTimetablesClient />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering AdminTimetablesPage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load timetables"
          message="There was an error loading timetable data. Please try again later."
        />
      </div>
    );
  }
}