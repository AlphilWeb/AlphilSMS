// app/dashboard/lecturer/assignments/page.tsx
import LecturerAssignmentsManager from '@/components/lecturer/lecturer.manage.assignments';
import ErrorMessage from '@/components/ui/error-message';

export default async function LecturerAssignmentsPage() {
  try {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">Assignments Management</h1>
          <p className="text-gray-600">Create, manage, and grade student assignments</p>
        </div>

        {/* Main Assignments Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <LecturerAssignmentsManager />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering LecturerAssignmentsPage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load assignments"
          message="There was an error loading the assignments manager. Please try again later."
        />
      </div>
    );
  }
}