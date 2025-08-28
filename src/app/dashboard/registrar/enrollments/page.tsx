import AdminEnrollmentsClient from '@/components/admin/admin.enrollments.client';
import ErrorMessage from '@/components/ui/error-message';
import RegistrarDashboardHeader from '@/components/registrar-dashboard-header';

export default async function RegistrarAdminEnrollmentsPage() {
  try {
    return (
      <>
        <RegistrarDashboardHeader />

        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800">Enrollment Management</h1>
              <p className="text-gray-600">Manage all course enrollments and student registrations</p>
            </div>

            {/* Main Enrollments Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <AdminEnrollmentsClient />
            </div>
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering AdminEnrollmentsPage:', error);
    return (
      <>
        <RegistrarDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load enrollments"
              message="There was an error loading enrollment data. Please try again later."
            />
          </div>
        </main>
      </>
    );
  }
}