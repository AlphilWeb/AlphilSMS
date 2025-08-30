// app/dashboard/admin/grades/page.tsx
import AdminGradesClient from '@/components/admin/admin.grades.client';
import ErrorMessage from '@/components/ui/error-message';

export default async function AdminGradesPage() {
  try {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">Grade Management</h1>
          <p className="text-gray-600">Manage student grades and academic records</p>
        </div>

        {/* Main Grades Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <AdminGradesClient />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering AdminGradesPage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load grades"
          message="There was an error loading grade data. Please try again later."
        />
      </div>
    );
  }
}