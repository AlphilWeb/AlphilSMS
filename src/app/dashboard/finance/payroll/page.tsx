// app/dashboard/bursar/payroll/page.tsx
import BursarDashboardHeader from '@/components/bursar/bursarDashboardHeader';
import AdminPayrollClient from '@/components/bursar/payroll.management.client';
import ErrorMessage from '@/components/ui/error-message';

export default function BursarPayrollPage() {
  try {
    return (
      <>
        <BursarDashboardHeader />

        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
              <p className="text-gray-600">Manage staff salaries and payment records</p>
            </div>

            {/* Main Payroll Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <AdminPayrollClient />
            </div>
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering BursarPayrollPage:', error);
    return (
      <>
        <BursarDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-blue-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load payroll"
              message="There was an error loading payroll data. Please try again later."
            />
          </div>
        </main>
      </>
    );
  }
}