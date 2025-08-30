// app/dashboard/registrar/enrollment-stats/page.tsx
import { getEnrollmentStatistics } from '@/lib/actions/registrar.enrollment-stats.action';
import EnrollmentStatsList from '@/components/registrar/enrollment-stats-list';
import ErrorMessage from '@/components/ui/error-message';

export default async function EnrollmentStatsPage() {
  try {
    const stats = await getEnrollmentStatistics();

    return (
      <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <EnrollmentStatsList stats={stats.statistics} />
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error loading enrollment statistics:', error);
    return (
      <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <ErrorMessage
            title="Failed to load enrollment stats"
            message="There was an error loading enrollment statistics. Please try again later."
          />
        </div>
      </main>
    );
  }
}