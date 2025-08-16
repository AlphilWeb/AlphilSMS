// app/dashboard/admin/user-logs/page.tsx
import AdminDashboardHeader from '@/components/adminDashboardHeader';
import AdminUserLogsClient from '@/components/admin/admin.user-logs.client';
import ErrorMessage from '@/components/ui/error-message';

export default async function AdminUserLogsPage() {
  try {
    return (
      <>
        <AdminDashboardHeader />

        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800">User Activity Logs</h1>
              <p className="text-gray-600">View and manage all user activity logs</p>
            </div>

            {/* Main Logs Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <AdminUserLogsClient />
            </div>
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering AdminUserLogsPage:', error);
    return (
      <>
        <AdminDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load user logs"
              message="There was an error loading log data. Please try again later."
            />
          </div>
        </main>
      </>
    );
  }
}