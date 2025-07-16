// app/dashboard/grades/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import { getGrades } from "@/lib/actions/grade.action";
import { getEnrollments } from "@/lib/actions/enrollment.action";
import { getStudents } from "@/lib/actions/student.action"; // Needed for enrollment display names
import { getCourses } from "@/lib/actions/course.action";   // Needed for enrollment display names
import { getSemesters } from "@/lib/actions/semester.action"; // Needed for enrollment display names
import { FiAward } from "react-icons/fi"; // Icon for grades
import GradesNav from "@/components/gradesNav"; // The new nav component
import GradesClientComponent from "@/components/grades/grade-client-component";

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export default async function GradesPage() {
  // Fetch all required data in parallel
  const [gradesFromDb, enrollmentsFromDb, studentsFromDb, coursesFromDb, semestersFromDb] = await Promise.all([
    getGrades(),
    getEnrollments(),
    getStudents(),
    getCourses(),
    getSemesters(),
  ]);

  // Prepare initial data for client component
  const initialGrades = gradesFromDb.map(grade => ({
    ...grade,
    // Numeric fields (catScore, examScore, totalScore, gpa) are already string|null from Drizzle's numeric type
  }));

  // Prepare reference data for dropdowns and display names
  const referenceData = {
    enrollments: enrollmentsFromDb.map(e => ({
      id: e.id,
      studentId: e.studentId,
      courseId: e.courseId,
      semesterId: e.semesterId,
      enrollmentDate: e.enrollmentDate,
    })),
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
              <FiAward className="w-6 h-6" />
              <span className="font-bold">Total Grades: {initialGrades.length}</span>
            </div>
            {/* Add more grade-specific stats here if needed */}
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <GradesNav />
          </div>
        </div>

        {/* Pass initial data and reference data to the Client Component */}
        <GradesClientComponent 
          initialGrades={initialGrades}
          referenceData={referenceData}
        />

        <Footer />
      </main>
    </>
  );
}