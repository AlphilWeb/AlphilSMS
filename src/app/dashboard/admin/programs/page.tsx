// app/dashboard/admin/programs/page.tsx
import AdminProgramsClient from '@/components/admin/admin.programs.client';
import ErrorMessage from '@/components/ui/error-message';

export default async function AdminProgramsPage() {
  try {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">Program Management</h1>
          <p className="text-gray-600">Manage academic programs and their curriculum</p>
        </div>

        {/* Main Programs Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <AdminProgramsClient />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering AdminProgramsPage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load programs"
          message="There was an error loading program data. Please try again later."
        />
      </div>
    );
  }
}