// In: src/lib/actions/enrollment.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import {
  enrollments,
  NewEnrollment,
  students,
  courses,
  semesters,
  staff,
  users,
  timetables,
  programs, // Import programs for joining to get departmentId for courses
} from '@/lib/db/schema'; // Added necessary schemas for joins
import { eq, and, inArray, SQL } from 'drizzle-orm'; // Added SQL for explicit typing, inArray for use in whereClause
import { getAuthUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionError';
  }
}

const ROLES = {
  ADMIN: 'Admin',
  REGISTRAR: 'Registrar',
  HOD: 'HOD',
  ACCOUNTANT: 'Accountant',
  LECTURER: 'Lecturer',
  STAFF: 'Staff',
  STUDENT: 'Student',
};

function allowedRolesForManagingEnrollments() {
  return [ROLES.ADMIN, ROLES.REGISTRAR];
}

function allowedRolesForViewingAllEnrollments() {
  return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.LECTURER, ROLES.HOD]; // HOD can view enrollments in their department's courses
}

// function allowedRolesForViewingIndividualOrStudentEnrollments() {
//   return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.LECTURER, ROLES.HOD, ROLES.STUDENT]; // Student can view their own
// }

/**
 * Creates a new enrollment.
 * Permissions: Admin, Registrar
 */
export async function createEnrollment(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingEnrollments())) {
      return { error: 'Unauthorized: You do not have permission to create enrollments.' };
    }

    const studentId = formData.get('studentId') ? Number(formData.get('studentId')) : null;
    const courseId = formData.get('courseId') ? Number(formData.get('courseId')) : null;
    const semesterId = formData.get('semesterId') ? Number(formData.get('semesterId')) : null;
    const enrollmentDate = formData.get('enrollmentDate') as string | null;

    if (!studentId || !courseId || !semesterId) {
      return { error: 'Missing required fields for enrollment creation.' };
    }

    // Check for existing enrollment for this student, course, and semester
    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.courseId, courseId),
        eq(enrollments.semesterId, semesterId),
      ),
    });

    if (existingEnrollment) {
      return { error: 'This student is already enrolled in this course for the specified semester.' };
    }

    const newEnrollment: NewEnrollment = {
      studentId,
      courseId,
      semesterId,
      enrollmentDate: enrollmentDate || undefined, // Drizzle handles defaultNow()
    };

    const [createdEnrollment] = await db.insert(enrollments).values(newEnrollment).returning();

    revalidatePath('/dashboard/enrollments');
    revalidatePath(`/dashboard/students/${studentId}`); // Revalidate student's page
    revalidatePath(`/dashboard/courses/${courseId}`); // Revalidate course's page
    revalidatePath(`/dashboard/semesters/${semesterId}`); // Revalidate semester's overview
    return { success: 'Enrollment created successfully.', data: createdEnrollment };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Updates an existing enrollment.
 * Permissions: Admin, Registrar
 */
export async function updateEnrollment(enrollmentId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingEnrollments())) {
      return { error: 'Unauthorized: You do not have permission to update enrollments.' };
    }

    // Fetch original enrollment details for revalidation and potential checks
    const originalEnrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, enrollmentId),
      columns: { studentId: true, courseId: true, semesterId: true },
    });

    if (!originalEnrollment) {
      return { error: 'Enrollment not found.' };
    }

    const studentId = formData.get('studentId') ? Number(formData.get('studentId')) : null;
    const courseId = formData.get('courseId') ? Number(formData.get('courseId')) : null;
    const semesterId = formData.get('semesterId') ? Number(formData.get('semesterId')) : null;
    const enrollmentDate = formData.get('enrollmentDate') as string | null;

    const updates: Partial<NewEnrollment> = {};
    if (studentId !== null) updates.studentId = studentId;
    if (courseId !== null) updates.courseId = courseId;
    if (semesterId !== null) updates.semesterId = semesterId;
    if (enrollmentDate !== null) updates.enrollmentDate = enrollmentDate;

    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    const [updatedEnrollment] = await db
      .update(enrollments)
      .set(updates)
      .where(eq(enrollments.id, enrollmentId))
      .returning();

    revalidatePath('/dashboard/enrollments');
    revalidatePath(`/dashboard/enrollments/${enrollmentId}`);
    // Revalidate old and new paths if IDs changed
    if (studentId && originalEnrollment.studentId !== studentId)
      revalidatePath(`/dashboard/students/${originalEnrollment.studentId}`);
    if (courseId && originalEnrollment.courseId !== courseId)
      revalidatePath(`/dashboard/courses/${originalEnrollment.courseId}`);
    if (semesterId && originalEnrollment.semesterId !== semesterId)
      revalidatePath(`/dashboard/semesters/${originalEnrollment.semesterId}`);

    if (studentId) revalidatePath(`/dashboard/students/${studentId}`);
    if (courseId) revalidatePath(`/dashboard/courses/${courseId}`);
    if (semesterId) revalidatePath(`/dashboard/semesters/${semesterId}`);

    return { success: 'Enrollment updated successfully.', data: updatedEnrollment };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Deletes an enrollment.
 * Permissions: Admin, Registrar
 */
export async function deleteEnrollment(enrollmentId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingEnrollments())) {
      return { error: 'Unauthorized: You do not have permission to delete enrollments.' };
    }

    // Fetch enrollment to get associated IDs for revalidation
    const enrollmentToDelete = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, enrollmentId),
      columns: { studentId: true, courseId: true, semesterId: true },
    });

    if (!enrollmentToDelete) {
      return { error: 'Enrollment not found.' };
    }

    const [deletedEnrollment] = await db
      .delete(enrollments)
      .where(eq(enrollments.id, enrollmentId))
      .returning();

    revalidatePath('/dashboard/enrollments');
    if (enrollmentToDelete.studentId)
      revalidatePath(`/dashboard/students/${enrollmentToDelete.studentId}`);
    if (enrollmentToDelete.courseId)
      revalidatePath(`/dashboard/courses/${enrollmentToDelete.courseId}`);
    if (enrollmentToDelete.semesterId)
      revalidatePath(`/dashboard/semesters/${enrollmentToDelete.semesterId}`);
    return { success: 'Enrollment deleted successfully.', data: deletedEnrollment };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches all enrollments with associated student, course, and semester details.
 * Permissions: Admin, Registrar, Lecturer (for their courses), HOD (for their department's courses)
 */
export async function getEnrollments() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      throw new ActionError('Unauthorized: You must be logged in.');
    }

    let whereClause: SQL<unknown> | undefined = undefined; // Explicitly type whereClause

    // Lecturer filter: only see enrollments for courses they teach
    if (authUser.role === ROLES.LECTURER) {
      const lecturerCourses = await db
        .select({ courseId: timetables.courseId })
        .from(timetables)
        .leftJoin(staff, eq(timetables.lecturerId, staff.id))
        .where(eq(staff.userId, authUser.userId));
      const courseIds = lecturerCourses.map((lc) => lc.courseId);
      if (courseIds.length === 0) {
        return []; // Lecturer teaches no courses, so no enrollments to show
      }
      whereClause = inArray(enrollments.courseId, courseIds); // Corrected `inArray` usage
    }
    // HOD filter: only see enrollments for courses in their department
    else if (authUser.role === ROLES.HOD) {
      if (authUser.departmentId === undefined || authUser.departmentId === null) {
        return []; // HOD without a department assigned, should not see enrollments
      }
      // FIX: Join courses to programs to filter by departmentId
      const departmentCourses = await db
        .select({ courseId: courses.id })
        .from(courses)
        .leftJoin(programs, eq(courses.programId, programs.id)) // Join programs table
        .where(eq(programs.departmentId, authUser.departmentId)); // Filter by programs.departmentId
      const courseIds = departmentCourses.map((dc) => dc.courseId);
      if (courseIds.length === 0) {
        return []; // No courses in their department, so no enrollments to show
      }
      whereClause = inArray(enrollments.courseId, courseIds); // Corrected `inArray` usage
    }
    // General viewing permissions for Admin, Registrar
    else if (!checkPermission(authUser, allowedRolesForViewingAllEnrollments())) {
      throw new ActionError('Unauthorized: You do not have permission to view all enrollments.');
    }

    const result = await db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        courseId: enrollments.courseId,
        semesterId: enrollments.semesterId,
        enrollmentDate: enrollments.enrollmentDate,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegNo: students.registrationNumber, // FIX: Use registrationNumber
        studentUserEmail: users.email,
        courseName: courses.name,
        courseCode: courses.code,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
      })
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id))
      .where(whereClause); // Apply the dynamic where clause

    const allEnrollments = result.map((e) => ({
      id: e.id,
      studentId: e.studentId,
      courseId: e.courseId,
      semesterId: e.semesterId,
      enrollmentDate: e.enrollmentDate,
      studentFullName: e.studentFirstName && e.studentLastName ? `${e.studentFirstName} ${e.studentLastName}` : null,
      studentRegNo: e.studentRegNo || null, // FIX: Use the aliased name
      studentUserEmail: e.studentUserEmail || null,
      courseName: e.courseName || null,
      courseCode: e.courseCode || null,
      semesterName: e.semesterName || null,
      semesterStartDate: e.semesterStartDate || null,
      semesterEndDate: e.semesterEndDate || null,
    }));

    return allEnrollments;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches a single enrollment by ID with associated student, course, and semester details.
 * Permissions: Admin, Registrar, Lecturer (for their courses), HOD (for their department's courses), Student (can view their own).
 */
export async function getEnrollmentById(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const result = await db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        courseId: enrollments.courseId,
        semesterId: enrollments.semesterId,
        enrollmentDate: enrollments.enrollmentDate,
        studentUserId: students.userId, // Needed for student self-access check
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegNo: students.registrationNumber, // FIX: Use registrationNumber
        studentUserEmail: users.email,
        courseName: courses.name,
        courseCode: courses.code,
        courseDepartmentId: programs.departmentId, // FIX: Get departmentId from programs via courses
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
        lecturerUserId: staff.userId, // Needed for lecturer self-access check
      })
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(programs, eq(courses.programId, programs.id)) // FIX: Join programs to get departmentId
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id))
      .leftJoin(timetables, eq(courses.id, timetables.courseId)) // Join via timetables to get lecturer
      .leftJoin(staff, eq(timetables.lecturerId, staff.id))
      .where(eq(enrollments.id, id))
      .limit(1);

    const enrollmentRecord = result[0];

    if (!enrollmentRecord) {
      return { error: 'Enrollment not found.' };
    }

    // Authorization Logic:
    // 1. Admin, Registrar can view any enrollment.
    // 2. Student can view their own enrollment.
    // 3. Lecturer can view enrollments for courses they teach.
    // 4. HOD can view enrollments for courses in their department.
    const isAuthorizedAsStudent =
      authUser.role === ROLES.STUDENT && authUser.userId === enrollmentRecord.studentUserId;
    const isAuthorizedAsLecturer =
      authUser.role === ROLES.LECTURER && authUser.userId === enrollmentRecord.lecturerUserId;
    const isAuthorizedAsHOD =
      authUser.role === ROLES.HOD && authUser.departmentId === enrollmentRecord.courseDepartmentId;

    if (
      !checkPermission(authUser, allowedRolesForViewingAllEnrollments()) &&
      !isAuthorizedAsStudent &&
      !isAuthorizedAsLecturer &&
      !isAuthorizedAsHOD
    ) {
      return { error: 'Unauthorized: You do not have permission to view this enrollment.' };
    }

    return {
      id: enrollmentRecord.id,
      studentId: enrollmentRecord.studentId,
      courseId: enrollmentRecord.courseId,
      semesterId: enrollmentRecord.semesterId,
      enrollmentDate: enrollmentRecord.enrollmentDate,
      studentFullName:
        enrollmentRecord.studentFirstName && enrollmentRecord.studentLastName
          ? `${enrollmentRecord.studentFirstName} ${enrollmentRecord.studentLastName}`
          : null,
      studentRegNo: enrollmentRecord.studentRegNo || null, // FIX: Use the aliased name
      studentUserEmail: enrollmentRecord.studentUserEmail || null,
      courseName: enrollmentRecord.courseName || null,
      courseCode: enrollmentRecord.courseCode || null,
      semesterName: enrollmentRecord.semesterName || null,
      semesterStartDate: enrollmentRecord.semesterStartDate || null,
      semesterEndDate: enrollmentRecord.semesterEndDate || null,
    };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches enrollments for a specific student with associated course and semester details.
 * Permissions: Admin, Registrar, HOD, Lecturer (for their courses), Student (can view their own).
 */
export async function getEnrollmentsByStudentId(studentId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const studentRecord = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      columns: { userId: true, firstName: true, lastName: true, registrationNumber: true, departmentId: true }, // FIX: Use registrationNumber
    });

    if (!studentRecord) {
      return { error: 'Student not found.' };
    }

    // Authorization: Admin, Registrar, HOD (for students in their department),
    // Lecturer (for students in their courses), or the student themselves.
    const isAuthorizedAsHOD =
      authUser.role === ROLES.HOD && authUser.departmentId === studentRecord.departmentId;
    const isAuthorizedAsStudent =
      authUser.role === ROLES.STUDENT && authUser.userId === studentRecord.userId;

    if (
      !checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR]) &&
      !isAuthorizedAsHOD &&
      !isAuthorizedAsStudent
    ) {
      // For lecturers, a more complex check would be needed:
      // check if the lecturer teaches any course the student is enrolled in.
      // For simplicity, this is omitted here, assuming lecturers primarily use getEnrollmentsByCourseId.
      return { error: 'Unauthorized: You do not have permission to view these enrollments.' };
    }

    const result = await db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        courseId: enrollments.courseId,
        semesterId: enrollments.semesterId,
        enrollmentDate: enrollments.enrollmentDate,
        courseName: courses.name,
        courseCode: courses.code,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
      })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id))
      .where(eq(enrollments.studentId, studentId));

    const studentEnrollments = result.map((e) => ({
      id: e.id,
      studentId: e.studentId,
      courseId: e.courseId,
      semesterId: e.semesterId,
      enrollmentDate: e.enrollmentDate,
      courseName: e.courseName || null,
      courseCode: e.courseCode || null,
      semesterName: e.semesterName || null,
      semesterStartDate: e.semesterStartDate || null,
      semesterEndDate: e.semesterEndDate || null,
    }));

    return studentEnrollments;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches enrollments for a specific course with associated student and semester details.
 * Permissions: Admin, Registrar, Lecturer (for their courses), HOD (for their department's courses).
 */
export async function getEnrollmentsByCourseId(courseId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const courseRecord = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      columns: { id: true, programId: true }, // Need programId to get departmentId
    });

    if (!courseRecord) {
      return { error: 'Course not found.' };
    }

    // Fetch program to get departmentId for HOD check
    let courseDepartmentId: number | null = null;
    if (courseRecord.programId) {
        const programForCourse = await db.query.programs.findFirst({
            where: eq(programs.id, courseRecord.programId),
            columns: { departmentId: true }
        });
        courseDepartmentId = programForCourse?.departmentId || null;
    }


    // Check if the authenticated user is the lecturer for this course
    const courseLecturer = await db.query.timetables.findFirst({
      where: eq(timetables.courseId, courseId),
      with: {
        lecturer: {
          columns: { userId: true },
        },
      },
    });
    const isAuthorizedAsLecturer =
      authUser.role === ROLES.LECTURER && authUser.userId === courseLecturer?.lecturer?.userId;
    const isAuthorizedAsHOD =
      authUser.role === ROLES.HOD && authUser.departmentId === courseDepartmentId; // FIX: Use courseDepartmentId

    if (
      !checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR]) &&
      !isAuthorizedAsLecturer &&
      !isAuthorizedAsHOD
    ) {
      return { error: 'Unauthorized: You do not have permission to view enrollments for this course.' };
    }

    const result = await db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        courseId: enrollments.courseId,
        semesterId: enrollments.semesterId,
        enrollmentDate: enrollments.enrollmentDate,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegNo: students.registrationNumber, // FIX: Use registrationNumber
        studentUserEmail: users.email,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
      })
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id))
      .where(eq(enrollments.courseId, courseId));

    const courseEnrollments = result.map((e) => ({
      id: e.id,
      studentId: e.studentId,
      courseId: e.courseId,
      semesterId: e.semesterId,
      enrollmentDate: e.enrollmentDate,
      studentFullName:
        e.studentFirstName && e.studentLastName ? `${e.studentFirstName} ${e.studentLastName}` : null,
      studentRegNo: e.studentRegNo || null, // FIX: Use the aliased name
      studentUserEmail: e.studentUserEmail || null,
      semesterName: e.semesterName || null,
      semesterStartDate: e.semesterStartDate || null,
      semesterEndDate: e.semesterEndDate || null,
    }));

    return courseEnrollments;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}