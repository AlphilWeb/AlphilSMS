// app/dashboard/admin/departments/page.tsx
import AdminDashboardHeader from '@/components/adminDashboardHeader';
import AdminDepartmentsClient from '@/components/admin/admin.department.client';
import ErrorMessage from '@/components/ui/error-message';

export default async function AdminDepartmentsPage() {
  try {
    return (
      <>
        <AdminDashboardHeader />

        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800">Department Management</h1>
              <p className="text-gray-600">Manage university departments and assign heads</p>
            </div>

            {/* Main Departments Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <AdminDepartmentsClient />
            </div>
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering AdminDepartmentsPage:', error);
    return (
      <>
        <AdminDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load departments"
              message="There was an error loading department data. Please try again later."
            />
          </div>
        </main>
      </>
    );
  }
}