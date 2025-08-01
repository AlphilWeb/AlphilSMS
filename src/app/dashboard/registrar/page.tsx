// app/dashboard/registrar/page.tsx
import { getRegistrarDashboardData } from '@/lib/actions/registrar.dashboard.action';
import RegistrarDashboardHeader from '@/components/registrar-dashboard-header';
import StatsCard from '@/components/registrar/stats-card';
import RecentActivityCard from '@/components/registrar/recent-activity-card';
import PendingTranscriptsCard from '@/components/registrar/pending-transcripts-card';
import SemesterInfoCard from '@/components/registrar/semester-info-card';
import RecentEnrollmentsCard from '@/components/registrar/recent-enrollments-card';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';

export default async function RegistrarDashboard() {
  try {
    const data = await getRegistrarDashboardData();

    return (
      <>
        <RegistrarDashboardHeader />
        
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800">Registrar Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard 
                title="Total Students" 
                value={data.stats.totalStudents.toString()} 
                icon="users"
                trend="up"
              />
              <StatsCard 
                title="Current Enrollments" 
                value={data.stats.currentSemesterEnrollments.toString()} 
                icon="book"
                trend="neutral"
              />
              <StatsCard 
                title="Transcripts Generated" 
                value={data.stats.transcriptsGenerated.toString()} 
                icon="file-text"
                trend="up"
              />
            </div>

            {/* Semester Info */}
            <SemesterInfoCard 
              name={data.currentSemester.name}
              startDate={data.currentSemester.startDate}
              endDate={data.currentSemester.endDate}
            />

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <RecentEnrollmentsCard 
                enrollments={data.recentEnrollments.map((item) => ({
                    ...item,
                    date: item.date ?? '', // Fix 1
                }))}
                />
                <RecentActivityCard 
                activities={data.recentActivity.map((item) => ({
                    ...item,
                    description: item.description ?? '', // Fix 2
                }))}
                />
              </div>
              
              <div className="space-y-6">
                <PendingTranscriptsCard 
                transcripts={data.pendingTranscripts.map((item) => ({
                    ...item,
                    status: 'pending', // Fix 3
                }))}
                />
              </div>
            </div>

            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering RegistrarDashboard:', error);
    return (
      <>
        <RegistrarDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load dashboard"
              message="There was an error loading registrar dashboard data. Please try again later."
            />
            <Footer />
          </div>
        </main>
      </>
    );
  }
}