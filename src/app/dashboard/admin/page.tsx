// app/dashboard/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import DashboardClientComponent from "@/components/dashboard/dashboard-client-component";
import { db } from '@/lib/db/index'; // Your Drizzle DB instance
import {
  users, students, staff, departments, programs, semesters,
  courses, enrollments, grades, transcripts, timetables,
  feeStructures, invoices, payments, staffSalaries, userLogs
} from '@/lib/db/schema'; // Your Drizzle schema tables
import { count } from 'drizzle-orm';
import { checkAuthAndPermissions } from '@/lib/auth'; // Your auth utility

export const dynamic = 'force-dynamic'; // Ensure data is always fresh

export default async function AdminDashboardPage() {
  // Ensure only authorized users can view the dashboard
  // Assuming 'admin' (role 1) is the primary role for the dashboard
  await checkAuthAndPermissions(['admin', 'registrar', 'department_head']); // Example: Allow admin, registrar, dept head

  // Fetch counts for all relevant tables in parallel
  const [
    userCountResult,
    studentCountResult,
    staffCountResult,
    departmentCountResult,
    programCountResult,
    semesterCountResult,
    courseCountResult,
    enrollmentCountResult,
    gradeCountResult,
    transcriptCountResult,
    timetableCountResult,
    feeStructureCountResult,
    invoiceCountResult,
    paymentCountResult,
    staffSalaryCountResult,
    userLogCountResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(students),
    db.select({ count: count() }).from(staff),
    db.select({ count: count() }).from(departments),
    db.select({ count: count() }).from(programs),
    db.select({ count: count() }).from(semesters),
    db.select({ count: count() }).from(courses),
    db.select({ count: count() }).from(enrollments),
    db.select({ count: count() }).from(grades),
    db.select({ count: count() }).from(transcripts),
    db.select({ count: count() }).from(timetables),
    db.select({ count: count() }).from(feeStructures),
    db.select({ count: count() }).from(invoices),
    db.select({ count: count() }).from(payments),
    db.select({ count: count() }).from(staffSalaries),
    db.select({ count: count() }).from(userLogs),
  ]);

  // Extract counts from the results (each result is an array with one object { count: string })
  const counts = {
    userCount: Number(userCountResult[0].count),
    studentCount: Number(studentCountResult[0].count),
    staffCount: Number(staffCountResult[0].count),
    departmentCount: Number(departmentCountResult[0].count),
    programCount: Number(programCountResult[0].count),
    semesterCount: Number(semesterCountResult[0].count),
    courseCount: Number(courseCountResult[0].count),
    enrollmentCount: Number(enrollmentCountResult[0].count),
    gradeCount: Number(gradeCountResult[0].count),
    transcriptCount: Number(transcriptCountResult[0].count),
    timetableCount: Number(timetableCountResult[0].count),
    feeStructureCount: Number(feeStructureCountResult[0].count),
    invoiceCount: Number(invoiceCountResult[0].count),
    paymentCount: Number(paymentCountResult[0].count),
    staffSalaryCount: Number(staffSalaryCountResult[0].count),
    userLogCount: Number(userLogCountResult[0].count),
  };

  return (
    <>
      <AdminDashboardHeader />

      <main className="pl-[220px] h-screen bg-gradient-to-b from-emerald-950 to-emerald-900 text-white">
        {/* Sticky header section for the main dashboard title */}
        <div className="sticky top-[58px] z-30 bg-emerald-800 px-12 py-4 flex flex-wrap justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard Overview</h1>
          </div>
          {/* No specific navigation needed for the main dashboard overview, as the header handles main navigation */}
        </div>

        {/* Pass fetched counts to the client component */}
        <DashboardClientComponent counts={counts} />

        <Footer />
      </main>
    </>
  );
}