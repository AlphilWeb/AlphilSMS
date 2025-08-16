import RegistrarDashboardHeader from '@/components/registrar-dashboard-header';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';

export default async function Page() {
  try {
    // const students: SelectStudent[] = [];
    const currentPage = 1;
    const totalPages = 1;

    return (
      <>
        <RegistrarDashboardHeader />
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Student Management</h1>
              {/* <StudentSearchForm />
              <StudentsTable */}
                {/* students={students} */}
                currentPage={currentPage}
                totalPages={totalPages}
              {/* /> */}
            </div>
            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Failed to load students:', error);
    return (
      <>
        <RegistrarDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load students"
              message="There was an error loading student records. Please try again later."
            />
            <Footer />
          </div>
        </main>
      </>
    );
  }
}
