// app/dashboard/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import DashboardClientComponent from "@/components/dashboard/dashboard-client-component";
import { db } from '@/lib/db/index';
import {
  users, students, staff, departments, programs, semesters,
  courses, enrollments, grades, transcripts, timetables,
  feeStructures, invoices, payments, staffSalaries, userLogs
} from '@/lib/db/schema';
import { count } from 'drizzle-orm';
import { checkAuthAndPermissions } from '@/lib/auth';


export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await checkAuthAndPermissions(['admin', 'registrar', 'department_head']);

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

  // Extract counts from the results
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

      <main className="md:pl-64 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800">
        {/* Sticky header section */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap justify-between items-center shadow-sm">

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
        </div>


          {/* Dashboard Client Component */}
          <DashboardClientComponent counts={counts} />

        <Footer />
      </main>
    </>
  );
}