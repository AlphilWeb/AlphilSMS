// app/dashboard/admin/users/page.tsx
import AdminDashboardHeader from '@/components/adminDashboardHeader';
import UserManagement from '@/components/admin/admin.manage.users.client';
import ErrorMessage from '@/components/ui/error-message';
import { fetchDepartments, fetchPrograms, fetchSemesters, fetchRoles } from '@/lib/actions/admin/users.actions';

export default async function AdminUsersPage() {
  try {
    // Fetch all required data in parallel
    const [departments, programs, semesters, roles] = await Promise.all([
      fetchDepartments(),
      fetchPrograms(),
      fetchSemesters(),
      fetchRoles(),
    ]);

    return (
      <>
        <AdminDashboardHeader />

        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
              <p className="text-gray-600">Manage all staff and student accounts</p>
            </div>

            {/* Main Users Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <UserManagement 
                departments={departments}
                programs={programs}
                semesters={semesters}
                roles={roles}
              />
            </div>
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering AdminUsersPage:', error);
    return (
      <>
        <AdminDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load user data"
              message="There was an error loading user management data. Please try again later."
            />
          </div>
        </main>
      </>
    );
  }
}