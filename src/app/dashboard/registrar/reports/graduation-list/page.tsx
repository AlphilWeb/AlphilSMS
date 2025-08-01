// src/app/(dashboard)/registrar/graduation-list/page.tsx
import { getGraduationList } from '@/lib/actions/registrar.graduation.action';
import RegistrarDashboardHeader from '@/components/registrar-dashboard-header';
import GraduationList from '@/components/registrar/graduation-list';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Graduation List | Registrar',
};

export default async function GraduationListPage() {
  try {
    const data = await getGraduationList();

    return (
      <>
        <RegistrarDashboardHeader />
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800">Graduation List</h1>
              <p className="text-gray-600">View and manage graduation candidates</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-800">Total Candidates</h3>
                <p className="text-3xl font-bold text-emerald-600">{data.stats.total}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-800">Pending Approval</h3>
                <p className="text-3xl font-bold text-yellow-500">{data.stats.pending}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-800">Graduated</h3>
                <p className="text-3xl font-bold text-green-500">{data.stats.completed}</p>
              </div>
            </div>

            {/* Graduation List */}
            <div className="bg-white rounded-lg shadow p-6">
              <GraduationList data={data} />
            </div>

            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error loading graduation list:', error);
    return (
      <>
        <RegistrarDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load graduation list"
              message="There was an error loading graduation data. Please try again later."
            />
            <Footer />
          </div>
        </main>
      </>
    );
  }
}