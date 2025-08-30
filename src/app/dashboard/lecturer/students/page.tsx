// app/dashboard/lecturer/students/page.tsx
import LecturerStudentsClient from '@/components/lecturer/lecturer.students';
import ErrorMessage from '@/components/ui/error-message';

export default async function LecturerStudentsPageWrapper() {
  try {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">My Students</h1>
          <p className="text-gray-600">View and manage students in your courses</p>
        </div>

        {/* Main Students Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <LecturerStudentsClient />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering LecturerStudentsPage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load students"
          message="There was an error loading the student data. Please try again later."
        />
      </div>
    );
  }
}