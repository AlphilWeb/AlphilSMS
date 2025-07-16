// app/dashboard/enrollments/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import { getEnrollments } from "@/lib/actions/enrollment.action";
import { getStudents } from "@/lib/actions/student.action";
import { getCourses } from "@/lib/actions/course.action";
import { getSemesters } from "@/lib/actions/semester.action";
import { FiUserCheck } from "react-icons/fi"; // Icon for enrollments
import EnrollmentsNav from "@/components/enrollmentsNav"; // The new nav component
import EnrollmentsClientComponent from "@/components/enrollments/enrollment-client-component";

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export default async function EnrollmentsPage() {
  // Fetch all required data in parallel
  const [enrollmentsFromDb, studentsFromDb, coursesFromDb, semestersFromDb] = await Promise.all([
    getEnrollments(),
    getStudents(),
    getCourses(),
    getSemesters(),
  ]);

  // Prepare initial data for client component
  const initialEnrollments = enrollmentsFromDb.map(enrollment => ({
    ...enrollment,
    // enrollmentDate is already string due to Drizzle's mode: 'string'
  }));

  // Prepare reference data for dropdowns
  const referenceData = {
    students: studentsFromDb.map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, registrationNumber: s.registrationNumber })),
    courses: coursesFromDb.map(c => ({ id: c.id, name: c.name, code: c.code })),
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
              <FiUserCheck className="w-6 h-6" />
              <span className="font-bold">Total Enrollments: {initialEnrollments.length}</span>
            </div>
            {/* Add more enrollment-specific stats here if needed */}
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <EnrollmentsNav />
          </div>
        </div>

        {/* Pass initial data and reference data to the Client Component */}
        <EnrollmentsClientComponent 
          initialEnrollments={initialEnrollments}
          referenceData={referenceData}
        />

        <Footer />
      </main>
    </>
  );
}