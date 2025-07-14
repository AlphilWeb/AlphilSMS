// app/dashboard/courses/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import { getCourses } from "@/lib/actions/course.action";
import { getPrograms } from "@/lib/actions/program.action";
import { getSemesters } from "@/lib/actions/semester.action";
import { FiBookOpen } from "react-icons/fi"; // Icon for courses
import CoursesNav from "@/components/coursesNav"; // The new nav component
import CoursesClientComponent from "@/components/courses/course-client-component";

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export default async function CoursesPage() {
  // Fetch all required data in parallel
  const [coursesFromDb, programsFromDb, semestersFromDb] = await Promise.all([
    getCourses(),
    getPrograms(),
    getSemesters(),
  ]);

  // Prepare initial data for client component
  const initialCourses = coursesFromDb.map(course => ({
    ...course,
    // Drizzle's numeric type for 'credits' might come as a string, which is fine for the client component's interface.
    // If your DB returns it as a number and your interface expects string, you might need String(course.credits)
  }));

  // Prepare reference data for dropdowns
  const referenceData = {
    programs: programsFromDb.map(p => ({ id: p.id, name: p.name, code: p.code })),
    semesters: semestersFromDb.map(s => ({ id: s.id, name: s.name })),
  };

  return (
    <>
      <AdminDashboardHeader />

      <main className="pl-[220px] h-screen bg-gradient-to-b from-emerald-950 to-emerald-900 text-white">
        {/* Sticky header section with stats */}
        <div className="sticky top-[58px] z-30 bg-emerald-800 px-12 py-4 flex flex-wrap justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 px-4 py-3 rounded-lg shadow">
              <FiBookOpen className="w-6 h-6" />
              <span className="font-bold">Total Courses: {initialCourses.length}</span>
            </div>
            {/* Add more course-specific stats here if needed */}
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <CoursesNav />
          </div>
        </div>

        {/* Pass initial data and reference data to the Client Component */}
        <CoursesClientComponent 
          initialCourses={initialCourses}
          referenceData={referenceData}
        />

        <Footer />
      </main>
    </>
  );
}