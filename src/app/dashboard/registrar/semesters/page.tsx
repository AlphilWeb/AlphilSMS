// app/dashboard/admin/semesters/page.tsx
import AdminSemestersClient from '@/components/admin/admin.semester.client';
import ErrorMessage from '@/components/ui/error-message';

export default async function AdminSemestersPage() {
  try {
    return (
      <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-800">Semester Management</h1>
            <p className="text-gray-600">Manage all academic semesters and their schedules</p>
          </div>

          {/* Main Semesters Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <AdminSemestersClient />
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error rendering AdminSemestersPage:', error);
    return (
      <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <ErrorMessage
            title="Failed to load semesters"
            message="There was an error loading semester data. Please try again later."
          />
        </div>
      </main>
    );
  }
}