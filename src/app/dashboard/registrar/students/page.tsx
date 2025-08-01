// app/dashboard/registrar/students/page.tsx
import { searchStudents } from '@/lib/actions/registrar.students.action';
import RegistrarDashboardHeader from '@/components/registrar-dashboard-header';
import StudentSearchForm from '@/components/registrar/student-search-form';
import StudentsTable from '@/components/registrar/student-table';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';

export default async function RegistrarStudentsPage({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  try {
    const { students, totalPages } = await searchStudents(query, currentPage);

    return (
      <>
        <RegistrarDashboardHeader />
        
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Student Management</h1>
              
              <StudentSearchForm />
              
              <StudentsTable 
                students={students} 
                currentPage={currentPage}
                totalPages={totalPages}
              />
            </div>
            
            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error loading students:', error);
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