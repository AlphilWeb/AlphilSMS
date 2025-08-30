// app/dashboard/admin/page.tsx
import DashboardClientComponent from "@/components/dashboard/dashboard-client-component";
import {
  users, students, staff, departments, programs, semesters,
  courses, enrollments, grades, transcripts, timetables,
  feeStructures, invoices, payments, staffSalaries, userLogs
} from '@/lib/db/schema';
import { db } from '@/lib/db/index';
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
    paymentCount: Number(invoiceCountResult[0].count),
    staffSalaryCount: Number(staffSalaryCountResult[0].count),
    userLogCount: Number(userLogCountResult[0].count),
  };

  return (

    <DashboardClientComponent counts={counts} />
  );
}