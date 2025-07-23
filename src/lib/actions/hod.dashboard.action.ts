// src/app/actions/hod-dashboard.ts
"use server";

import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth"; // Assuming you have this auth utility
import { and, count, eq } from "drizzle-orm";
import {
  departments,
  staff,
  students,
  programs,
  courses,
  semesters,
} from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export type DepartmentOverview = {
  departmentName: string;
  staffCount: number;
  studentCount: number;
  programCount: number;
  currentSemester: string;
  currentCoursesCount: number;
};

export async function getDepartmentOverview(): Promise<DepartmentOverview> {
  // Authentication check
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Get the HOD staff record
  const hod = await db.query.staff.findFirst({
    where: eq(staff.userId, authUser.userId),
  });
  if (!hod) throw new Error('Staff record not found');

  // Get department details
  const department = await db.query.departments.findFirst({
    where: eq(departments.id, hod.departmentId),
    with: {
      headOfDepartment: true // Include HOD details if needed
    }
  });

  if (!department) {
    throw new Error("Department not found");
  }

  // Verify the user is actually the HOD of this department
  if (department.headOfDepartmentId !== hod.id) {
    throw new Error("Unauthorized - Not the head of department");
  }

  // Get current semester (most recent by start date)
  const currentSemester = await db.query.semesters.findFirst({
    orderBy: (semesters, { desc }) => [desc(semesters.startDate)],

  });

  if (!currentSemester) {
    throw new Error("No active semester found");
  }

  // Get all counts in parallel
  const [
    staffCountResult,
    studentCountResult,
    programCountResult,
    currentCoursesCountResult,
  ] = await Promise.all([
    // Staff count
    db
      .select({ count: count() })
      .from(staff)
      .where(eq(staff.departmentId, hod.departmentId)),

    // Student count
    db
      .select({ count: count() })
      .from(students)
      .where(eq(students.departmentId, hod.departmentId)),

    // Program count
    db
      .select({ count: count() })
      .from(programs)
      .where(eq(programs.departmentId, hod.departmentId)),

    // Current courses count
    db
      .select({ count: count() })
      .from(courses)
      .where(
        and(
          eq(courses.semesterId, currentSemester.id),
          eq(programs.departmentId, hod.departmentId)
        )
      )
      .leftJoin(programs, eq(courses.programId, programs.id)),
  ]);

  return {
    departmentName: department.name,
    staffCount: staffCountResult[0].count,
    studentCount: studentCountResult[0].count,
    programCount: programCountResult[0].count,
    currentSemester: currentSemester.name,
    currentCoursesCount: currentCoursesCountResult[0].count,
  };
}

export async function refreshDashboard() {
  revalidatePath("/hod/dashboard");
}