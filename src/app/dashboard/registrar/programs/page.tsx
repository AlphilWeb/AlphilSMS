// app/dashboard/registrar/programs/page.tsx
import { getPrograms } from '@/lib/actions/registrar.program.action';
import RegistrarDashboardHeader from '@/components/registrar-dashboard-header';
import ProgramsList from '@/components/registrar/programs-list';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';

export default async function RegistrarProgramsPage() {
  try {
    const programs = await getPrograms();

    return (
      <>
        <RegistrarDashboardHeader />
        
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Program Management</h1>
                <hr />
              </div>
              
              <ProgramsList programs={programs} />
            </div>
            
            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error loading programs:', error);
    return (
      <>
        <RegistrarDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load programs"
              message="There was an error loading program data. Please try again later."
            />
            <Footer />
          </div>
        </main>
      </>
    );
  }
}