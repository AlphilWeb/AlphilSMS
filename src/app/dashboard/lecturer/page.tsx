import LecturerDashboardHeader from '@/components/lecturerDashboardHeader';
import ErrorMessage from '@/components/ui/error-message';
import { Suspense } from 'react';
import LecturerDashboardClient from '@/components/lecturer/lecturer.dashboard';
// import DashboardSkeleton from '@/components/skeletons/dashboard-skeleton';

export default function LecturerDashboardPage() {
  return (
    <>
      <LecturerDashboardHeader />
      
      <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-800">Lecturer Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's your teaching overview.</p>
          </div>

          {/* Main Dashboard Content */}
          <div className="bg-white rounded-lg shadow p-6">
            {/* <Suspense fallback={<DashboardSkeleton />}> */}
              <LecturerDashboardClient />
            {/* </Suspense> */}
          </div>
        </div>
      </main>
    </>
  );
}