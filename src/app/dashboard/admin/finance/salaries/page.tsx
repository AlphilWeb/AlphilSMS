// app/dashboard/admin/staff-salaries/page.tsx
import AdminStaffSalariesClient from '@/components/admin/admin.staff.salaries.client';
import ErrorMessage from '@/components/ui/error-message';

export default async function AdminStaffSalariesPage() {
  try {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">Staff Salary Management</h1>
          <p className="text-gray-600">Manage all staff salary records and payments</p>
        </div>

        {/* Main Salaries Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <AdminStaffSalariesClient />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering AdminStaffSalariesPage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load staff salaries"
          message="There was an error loading salary data. Please try again later."
        />
      </div>
    );
  }
}