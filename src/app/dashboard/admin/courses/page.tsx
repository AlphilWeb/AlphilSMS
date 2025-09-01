// app/dashboard/admin/courses/page.tsx
import AdminCoursesClient from '@/components/admin/admin.courses.client';
import ErrorMessage from '@/components/ui/error-message';

export default async function AdminCoursesPage() {
  try {
    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-800">Course Management</h1>
            <p className="text-gray-600">Manage all university courses and their details</p>
          </div>

          {/* Main Courses Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <AdminCoursesClient />
          </div>
        </div>
    );
  } catch (error) {
    console.error('Error rendering AdminCoursesPage:', error);
    return (
        <div className="p-6 max-w-7xl mx-auto">
          <ErrorMessage
            title="Failed to load courses"
            message="There was an error loading course data. Please try again later."
          />
        </div>
    );
  }
}