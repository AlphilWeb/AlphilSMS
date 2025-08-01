// app/dashboard/registrar/semesters/page.tsx
import { getAllSemesters } from '@/lib/actions/registrar.action';
import RegistrarDashboardHeader from '@/components/registrar-dashboard-header';
import SemestersList from '@/components/registrar/semester-list';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';

export default async function RegistrarSemestersPage() {
  try {
    const semesters = await getAllSemesters();

    return (
      <>
        <RegistrarDashboardHeader />
        
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Semester Management</h1>
                <hr />
              </div>
              
              <SemestersList semesters={semesters} />
            </div>
            
            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error loading semesters:', error);
    return (
      <>
        <RegistrarDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load semesters"
              message="There was an error loading semester data. Please try again later."
            />
            <Footer />
          </div>
        </main>
      </>
    );
  }
}