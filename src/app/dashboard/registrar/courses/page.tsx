// app/dashboard/registrar/courses/page.tsx
import { getAllCourses } from '@/lib/actions/registrar.courses.action';
import RegistrarDashboardHeader from '@/components/registrar-dashboard-header';
import CoursesList from '@/components/registrar/courses-list';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';

export default async function RegistrarCoursesPage() {
  try {
    const courses = await getAllCourses();

    return (
      <>
        <RegistrarDashboardHeader />
        
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Course Management</h1>
                <hr />
              </div>
              
              <CoursesList courses={courses} />
            </div>
            
            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error loading courses:', error);
    return (
      <>
        <RegistrarDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load courses"
              message="There was an error loading course data. Please try again later."
            />
            <Footer />
          </div>
        </main>
      </>
    );
  }
}