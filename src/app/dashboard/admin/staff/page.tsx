// app/dashboard/admin/staff/page.tsx
import AdminStaffClient from '@/components/admin/admin.staff.client';
import ErrorMessage from '@/components/ui/error-message';

export default async function AdminStaffPage() {
  try {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-600">Manage all staff records and information</p>
        </div>

        {/* Main Staff Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <AdminStaffClient />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering AdminStaffPage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load staff"
          message="There was an error loading staff data. Please try again later."
        />
      </div>
    );
  }
}