// In: src/lib/actions/course.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import {
  courses,
  NewCourse,
  programs,
  semesters,
  departments,
  staff,
  users,
  timetables,
  enrollments,
  students,
} from '@/lib/db/schema';
// Import SQL, and, eq, inArray, sql for type safety in where clauses
import { eq, and, inArray, SQL, sql, or } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth'; // Ensure AuthPayload in here has departmentId and optionally programId
import { checkPermission } from '@/lib/rbac';
import type { AnyColumn, SQLWrapper, BuildQueryResult } from 'drizzle-orm'; // Import Drizzle types for clarity

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

function allowedRolesForManagingCourses() {
  return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.HOD]; // HOD can manage courses in their department
}

function allowedRolesForViewingCourses() {
  return [
    ROLES.ADMIN,
    ROLES.REGISTRAR,
    ROLES.HOD,
    ROLES.LECTURER,
    ROLES.STUDENT,
    ROLES.STAFF,
    ROLES.ACCOUNTANT,
  ]; // Broad viewing access
}

/**
 * Creates a new course.
 * Permissions: Admin, Registrar, Department Head (for their department)
 */
export async function createCourse(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const programId = formData.get('programId') ? Number(formData.get('programId')) : null;
    const semesterId = formData.get('semesterId') ? Number(formData.get('semesterId')) : null;
    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const creditsStr = formData.get('credits') as string | null;
    const description = formData.get('description') as string | null;

    if (!programId || !semesterId || !name || !code || !creditsStr) {
      return { error: 'Missing required fields for course creation.' };
    }

    const credits = parseInt(creditsStr, 10);
    if (isNaN(credits) || credits <= 0) {
      return { error: 'Credits must be a positive number.' };
    }

    // Get the department ID associated with the program
    const programRecord = await db.query.programs.findFirst({
      where: eq(programs.id, programId),
      columns: { departmentId: true },
    });

    if (!programRecord || !programRecord.departmentId) {
      return { error: 'Invalid Program ID or program not associated with a department.' };
    }

    // Authorization check for HOD: ensure they can only create courses in their department
    const isAuthorizedAsHOD =
      authUser.role === ROLES.HOD && authUser.departmentId === programRecord.departmentId;

    if (!checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR]) && !isAuthorizedAsHOD) {
      return { error: 'Unauthorized: You do not have permission to create courses in this department.' };
    }

    // Check for existing course with same code or name within the same program and semester
    const existingCourse = await db.query.courses.findFirst({
      where: and(
        eq(courses.programId, programId),
        eq(courses.semesterId, semesterId),
        // Assuming 'code' should be unique per program, and 'name' per program/semester
        // If name AND code together must be unique, `and` is correct.
        // If name OR code should be unique per program/semester: `or(eq(courses.name, name), eq(courses.code, code))`
        or(eq(courses.name, name), eq(courses.code, code)) // Changed to 'or' for broader uniqueness check
      ),
    });

    if (existingCourse) {
      return { error: 'A course with this name or code already exists for this program and semester.' };
    }

    const newCourse: NewCourse = {
      programId,
      semesterId,
      name,
      code,
      credits: String(credits),
      description: description || undefined,
    };

    const [createdCourse] = await db.insert(courses).values(newCourse).returning();

    revalidatePath('/dashboard/courses');
    revalidatePath(`/dashboard/programs/${programId}`);
    revalidatePath(`/dashboard/semesters/${semesterId}`);
    revalidatePath(`/dashboard/departments/${programRecord.departmentId}`); // Revalidate department page
    return { success: 'Course created successfully.', data: createdCourse };
  } catch (err: any) {
    console.error('[CREATE_COURSE_ACTION_ERROR]', err);
    throw new ActionError(err.message || 'Failed to create course due to a server error.');
  }
}

/**
 * Updates an existing course.
 * Permissions: Admin, Registrar, Department Head (for their department)
 */
export async function updateCourse(courseId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    // Fetch the course to check department and HOD permissions
    const courseRecord = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      with: {
        program: {
          columns: { departmentId: true },
        },
      },
    });

    if (!courseRecord) {
      return { error: 'Course not found.' };
    }

    const courseDepartmentId = courseRecord.program?.departmentId;

    // Authorization check for HOD: ensure they can only update courses in their department
    const isAuthorizedAsHOD =
      authUser.role === ROLES.HOD && authUser.departmentId === courseDepartmentId;

    if (!checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR]) && !isAuthorizedAsHOD) {
      return { error: 'Unauthorized: You do not have permission to update this course.' };
    }

    const programId = formData.get('programId') ? Number(formData.get('programId')) : null;
    const semesterId = formData.get('semesterId') ? Number(formData.get('semesterId')) : null;
    const name = formData.get('name') as string | null;
    const code = formData.get('code') as string | null;
    const creditsStr = formData.get('credits') as string | null;
    const description = formData.get('description') as string | null;

    const updates: Partial<NewCourse> = {};
    if (programId !== null) updates.programId = programId;
    if (semesterId !== null) updates.semesterId = semesterId;
    if (name) updates.name = name;
    if (code) updates.code = code;
    if (creditsStr !== null) {
      const credits = parseInt(creditsStr, 10);
      if (isNaN(credits) || credits <= 0) {
        return { error: 'Credits must be a positive number.' };
      }
      updates.credits = String(credits);
    }
    if (description !== null) updates.description = description;

    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    const [updatedCourse] = await db
      .update(courses)
      .set(updates)
      .where(eq(courses.id, courseId))
      .returning();

    revalidatePath('/dashboard/courses');
    revalidatePath(`/dashboard/courses/${courseId}`);
    if (programId) revalidatePath(`/dashboard/programs/${programId}`);
    if (semesterId) revalidatePath(`/dashboard/semesters/${semesterId}`);
    if (courseDepartmentId) revalidatePath(`/dashboard/departments/${courseDepartmentId}`);
    // If programId changed, revalidate old program's page
    if (programId && courseRecord.programId !== programId) {
      revalidatePath(`/dashboard/programs/${courseRecord.programId}`);
    }

    return { success: 'Course updated successfully.', data: updatedCourse };
  } catch (err: any) {
    console.error('[UPDATE_COURSE_ACTION_ERROR]', err);
    throw new ActionError(err.message || 'Failed to update course due to a server error.');
  }
}

/**
 * Deletes a course.
 * Permissions: Admin, Registrar, Department Head (for their department)
 */
export async function deleteCourse(courseId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    // Fetch the course to check department and HOD permissions
    const courseRecord = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      with: {
        program: {
          columns: { departmentId: true },
        },
      },
      columns: { programId: true, semesterId: true }, // Also get for revalidation
    });

    if (!courseRecord) {
      return { error: 'Course not found.' };
    }

    const courseDepartmentId = courseRecord.program?.departmentId;

    // Authorization check for HOD: ensure they can only delete courses in their department
    const isAuthorizedAsHOD =
      authUser.role === ROLES.HOD && authUser.departmentId === courseDepartmentId;

    if (!checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR]) && !isAuthorizedAsHOD) {
      return { error: 'Unauthorized: You do not have permission to delete this course.' };
    }

    const [deletedCourse] = await db
      .delete(courses)
      .where(eq(courses.id, courseId))
      .returning();

    revalidatePath('/dashboard/courses');
    if (courseRecord.programId) revalidatePath(`/dashboard/programs/${courseRecord.programId}`);
    if (courseRecord.semesterId) revalidatePath(`/dashboard/semesters/${courseRecord.semesterId}`);
    if (courseDepartmentId) revalidatePath(`/dashboard/departments/${courseDepartmentId}`);

    return { success: 'Course deleted successfully.', data: deletedCourse };
  } catch (err: any) {
    console.error('[DELETE_COURSE_ACTION_ERROR]', err);
    throw new ActionError(err.message || 'Failed to delete course due to a server error.');
  }
}

/**
 * Fetches all courses with associated program, semester, and department details.
 * Permissions: Admin, Registrar, HOD, Lecturer, Student, Staff, Accountant
 */
export async function getCourses() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      throw new ActionError('Unauthorized: You must be logged in.');
    }

    let whereClause: SQL<unknown> | undefined = undefined; // Explicitly type whereClause

    // Lecturer filter: only see courses they are assigned to teach
    if (authUser.role === ROLES.LECTURER) {
      const lecturerCourses = await db
        .select({ courseId: timetables.courseId })
        .from(timetables)
        .leftJoin(staff, eq(timetables.lecturerId, staff.id))
        .where(eq(staff.userId, authUser.userId));
      const courseIds = lecturerCourses.map((lc) => lc.courseId);
      if (courseIds.length === 0) {
        return []; // Lecturer teaches no courses
      }
      whereClause = inArray(courses.id, courseIds); // Type `inArray` implicitly from import
    }
    // HOD filter: only see courses in their department
    else if (authUser.role === ROLES.HOD) {
      if (authUser.departmentId === undefined || authUser.departmentId === null) {
        // HOD without a department assigned, should not see courses
        return [];
      }
      // Corrected: Join programs to filter by departmentId
      const departmentCourses = await db.select({ courseId: courses.id })
        .from(courses)
        .leftJoin(programs, eq(courses.programId, programs.id))
        .where(eq(programs.departmentId, authUser.departmentId));
      const courseIds = departmentCourses.map(dc => dc.courseId);
      if (courseIds.length === 0) {
        return [];
      }
      whereClause = inArray(courses.id, courseIds);
    }
    // Student filter: only see courses they are enrolled in
    else if (authUser.role === ROLES.STUDENT) {
      const studentRecord = await db.query.students.findFirst({
        where: eq(students.userId, authUser.userId),
        columns: { id: true },
      });
      if (!studentRecord) return []; // Student record not found
      const enrolledCourses = await db
        .select({ courseId: enrollments.courseId })
        .from(enrollments)
        .where(eq(enrollments.studentId, studentRecord.id));
      const courseIds = enrolledCourses.map((ec) => ec.courseId);
      if (courseIds.length === 0) {
        return [];
      }
      whereClause = inArray(courses.id, courseIds);
    }
    // General viewing permissions for Admin, Registrar, Staff, Accountant
    else if (!checkPermission(authUser, allowedRolesForViewingCourses())) {
      throw new ActionError('Unauthorized: You do not have permission to view all courses.');
    }

    const result = await db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
        credits: courses.credits,
        description: courses.description,
        programId: courses.programId,
        semesterId: courses.semesterId,
        programName: programs.name,
        programCode: programs.code,
        departmentId: departments.id,
        departmentName: departments.name,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
      })
      .from(courses)
      .leftJoin(programs, eq(courses.programId, programs.id))
      .leftJoin(semesters, eq(courses.semesterId, semesters.id))
      .leftJoin(departments, eq(programs.departmentId, departments.id)) // Join programs to departments
      .where(whereClause); // Apply the dynamic where clause

    const allCourses = result.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      credits: c.credits,
      description: c.description || null,
      programId: c.programId,
      semesterId: c.semesterId,
      programName: c.programName || null,
      programCode: c.programCode || null,
      departmentId: c.departmentId || null,
      departmentName: c.departmentName || null,
      semesterName: c.semesterName || null,
      semesterStartDate: c.semesterStartDate || null,
      semesterEndDate: c.semesterEndDate || null,
    }));

    return allCourses;
  } catch (err: any) {
    console.error('[GET_COURSES_ACTION_ERROR]', err);
    throw new ActionError('Failed to fetch courses due to a server error: ' + err.message);
  }
}

/**
 * Fetches a single course by ID with associated program, semester, and department details.
 * Permissions: Admin, Registrar, HOD, Lecturer, Student
 */
export async function getCourseById(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const result = await db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
        credits: courses.credits,
        description: courses.description,
        programId: courses.programId,
        semesterId: courses.semesterId,
        programName: programs.name,
        programCode: programs.code,
        departmentId: departments.id,
        departmentName: departments.name,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
        // Lecturer details for permission check (if this course is taught by the user)
        lecturerUserId: staff.userId,
      })
      .from(courses)
      .leftJoin(programs, eq(courses.programId, programs.id))
      .leftJoin(semesters, eq(courses.semesterId, semesters.id))
      .leftJoin(departments, eq(programs.departmentId, departments.id)) // Join programs to departments
      .leftJoin(timetables, eq(courses.id, timetables.courseId)) // Join to get lecturer for this course
      .leftJoin(staff, eq(timetables.lecturerId, staff.id))
      .where(eq(courses.id, id))
      .limit(1);

    const courseRecord = result[0];

    if (!courseRecord) {
      return { error: 'Course not found.' };
    }

    // Authorization Logic:
    // 1. Admin, Registrar can view any course.
    // 2. HOD can view courses in their department.
    // 3. Lecturer can view courses they are assigned to teach.
    // 4. Student can view courses they are enrolled in.
    const isAuthorizedAsHOD =
      authUser.role === ROLES.HOD && authUser.departmentId === courseRecord.departmentId;
    const isAuthorizedAsLecturer =
      authUser.role === ROLES.LECTURER && authUser.userId === courseRecord.lecturerUserId;

    // Refined Student Check: Check if the authenticated student is truly enrolled in this course
    let isStudentEnrolledInThisCourse = false;
    if (authUser.role === ROLES.STUDENT) {
      const studentIdResult = await db.query.students.findFirst({
        where: eq(students.userId, authUser.userId),
        columns: { id: true },
      });
      if (studentIdResult) {
        const studentEnrollment = await db.query.enrollments.findFirst({
          where: and(
            eq(enrollments.studentId, studentIdResult.id),
            eq(enrollments.courseId, id),
          ),
        });
        isStudentEnrolledInThisCourse = !!studentEnrollment;
      }
    }

    if (
      !checkPermission(authUser, allowedRolesForViewingCourses()) &&
      !isAuthorizedAsHOD &&
      !isAuthorizedAsLecturer &&
      !isStudentEnrolledInThisCourse
    ) {
      return { error: 'Unauthorized: You do not have permission to view this course.' };
    }

    return {
      id: courseRecord.id,
      name: courseRecord.name,
      code: courseRecord.code,
      credits: courseRecord.credits,
      description: courseRecord.description || null,
      programId: courseRecord.programId,
      semesterId: courseRecord.semesterId,
      programName: courseRecord.programName || null,
      programCode: courseRecord.programCode || null,
      departmentId: courseRecord.departmentId || null,
      departmentName: courseRecord.departmentName || null,
      semesterName: courseRecord.semesterName || null,
      semesterStartDate: courseRecord.semesterStartDate || null,
      semesterEndDate: courseRecord.semesterEndDate || null,
    };
  } catch (err: any) {
    console.error('[GET_COURSE_BY_ID_ACTION_ERROR]', err);
    throw new ActionError('Failed to fetch course due to a server error: ' + err.message);
  }
}

/**
 * Fetches all courses for a specific program.
 * Permissions: Admin, Registrar, HOD (for their department's programs), Lecturer, Student (enrolled in the program).
 */
export async function getCoursesByProgramId(programId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const programRecord = await db.query.programs.findFirst({
      where: eq(programs.id, programId),
      columns: { departmentId: true },
    });

    if (!programRecord) {
      return { error: 'Program not found.' };
    }

    // Authorization: Admin, Registrar, HOD (for programs in their department),
    // Lecturer (teaches courses in this program), Student (enrolled in this program).
    const isAuthorizedAsHOD =
      authUser.role === ROLES.HOD && authUser.departmentId === programRecord.departmentId;

    let isAuthorizedAsStudentForProgram = false;
    if (authUser.role === ROLES.STUDENT && authUser.userId) {
        const student = await db.query.students.findFirst({ where: eq(students.userId, authUser.userId) });
        if (student && student.programId === programId) {
            isAuthorizedAsStudentForProgram = true;
        }
    }

    // For lecturers, check if they teach ANY course within this program
    let isAuthorizedAsLecturerForProgram = false;
    if (authUser.role === ROLES.LECTURER && authUser.userId) {
        const lecturerStaff = await db.query.staff.findFirst({ where: eq(staff.userId, authUser.userId) });
        if (lecturerStaff) {
            // FIX: Join timetables to courses and then to programs to check programId
            const teachesCoursesInProgram = await db.query.timetables.findFirst({
                // Select a column to ensure something is returned, e.g., timetables.id
                columns: { id: true },
                where: and(
                    eq(timetables.lecturerId, lecturerStaff.id),
                    // Join to courses to access programId
                    eq(courses.programId, programId)
                ),
                with: {
                    course: {
                        columns: { programId: true }
                    }
                }
            });
            isAuthorizedAsLecturerForProgram = !!teachesCoursesInProgram;
        }
    }

    if (
      !checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR]) &&
      !isAuthorizedAsHOD &&
      !isAuthorizedAsStudentForProgram &&
      !isAuthorizedAsLecturerForProgram
    ) {
      // General viewing permissions if not specifically authorized above
      if (!checkPermission(authUser, [ROLES.LECTURER, ROLES.STUDENT, ROLES.STAFF, ROLES.ACCOUNTANT])) {
        return { error: 'Unauthorized: You do not have permission to view courses for this program.' };
      }
    }

    const result = await db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
        credits: courses.credits,
        description: courses.description,
        semesterId: courses.semesterId,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
      })
      .from(courses)
      .leftJoin(semesters, eq(courses.semesterId, semesters.id))
      .where(eq(courses.programId, programId));

    const programCourses = result.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      credits: c.credits,
      description: c.description || null,
      semesterId: c.semesterId,
      semesterName: c.semesterName || null,
      semesterStartDate: c.semesterStartDate || null,
      semesterEndDate: c.semesterEndDate || null,
    }));

    return programCourses;
  } catch (err: any) {
    console.error('[GET_COURSES_BY_PROGRAM_ID_ACTION_ERROR]', err);
    throw new ActionError('Failed to fetch courses by program due to a server error: ' + err.message);
  }
}

/**
 * Fetches all courses taught by a specific lecturer.
 * Permissions: Admin, Registrar, HOD (for lecturers in their department), Lecturer (can view their own).
 */
export async function getCoursesByLecturerId(lecturerId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const lecturerRecord = await db.query.staff.findFirst({
      where: eq(staff.id, lecturerId),
      columns: { userId: true, departmentId: true },
    });

    if (!lecturerRecord) {
      return { error: 'Lecturer not found.' };
    }

    // Authorization: Admin, Registrar, HOD (for lecturers in their department), or the lecturer themselves.
    const isAuthorizedAsHOD =
      authUser.role === ROLES.HOD && authUser.departmentId === lecturerRecord.departmentId;
    const isAuthorizedAsLecturer =
      authUser.role === ROLES.LECTURER && authUser.userId === lecturerRecord.userId;

    if (
      !checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR]) &&
      !isAuthorizedAsHOD &&
      !isAuthorizedAsLecturer
    ) {
      return { error: 'Unauthorized: You do not have permission to view courses for this lecturer.' };
    }

    const result = await db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
        credits: courses.credits,
        description: courses.description,
        programId: courses.programId,
        semesterId: courses.semesterId,
        programName: programs.name,
        programCode: programs.code,
        semesterName: semesters.name,
      })
      .from(courses)
      .innerJoin(timetables, eq(courses.id, timetables.courseId)) // Courses linked to timetables
      .leftJoin(programs, eq(courses.programId, programs.id))
      .leftJoin(semesters, eq(courses.semesterId, semesters.id))
      .where(eq(timetables.lecturerId, lecturerId)); // Filter by lecturerId in timetables

    const lecturerCourses = result.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      credits: c.credits,
      description: c.description || null,
      programId: c.programId,
      semesterId: c.semesterId,
      programName: c.programName || null,
      programCode: c.programCode || null,
      semesterName: c.semesterName || null,
    }));

    return lecturerCourses;
  } catch (err: any) {
    console.error('[GET_COURSES_BY_LECTURER_ID_ACTION_ERROR]', err);
    throw new ActionError('Failed to fetch lecturer courses due to a server error: ' + err.message);
  }
}

/**
 * Fetches all courses a specific student is enrolled in.
 * Permissions: Admin, Registrar, HOD, Student (can view their own).
 */
export async function getCoursesByStudentId(studentId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const studentRecord = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      columns: { userId: true, programId: true }, // Added programId to student record
    });

    if (!studentRecord) {
      return { error: 'Student not found.' };
    }

    // Authorization: Admin, Registrar, HOD (for students in their department), or the student themselves.
    // HOD logic needs to check the student's department, not authUser's directly.
    let isAuthorizedAsHOD = false;
    if (authUser.role === ROLES.HOD && authUser.departmentId && studentRecord.programId) {
        const studentProgram = await db.query.programs.findFirst({
            where: eq(programs.id, studentRecord.programId),
            columns: { departmentId: true }
        });
        if (studentProgram && studentProgram.departmentId === authUser.departmentId) {
            isAuthorizedAsHOD = true;
        }
    }

    const isAuthorizedAsStudent =
      authUser.role === ROLES.STUDENT && authUser.userId === studentRecord.userId;

    if (
      !checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR]) &&
      !isAuthorizedAsHOD &&
      !isAuthorizedAsStudent
    ) {
      return { error: 'Unauthorized: You do not have permission to view courses for this student.' };
    }

    const result = await db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
        credits: courses.credits,
        description: courses.description,
        programId: courses.programId,
        semesterId: courses.semesterId,
        programName: programs.name,
        programCode: programs.code,
        semesterName: semesters.name,
      })
      .from(courses)
      .innerJoin(enrollments, eq(courses.id, enrollments.courseId)) // Courses linked to enrollments
      .leftJoin(programs, eq(courses.programId, programs.id))
      .leftJoin(semesters, eq(courses.semesterId, semesters.id))
      .where(eq(enrollments.studentId, studentId)); // Filter by studentId in enrollments

    const studentCourses = result.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      credits: c.credits,
      description: c.description || null,
      programId: c.programId,
      semesterId: c.semesterId,
      programName: c.programName || null,
      programCode: c.programCode || null,
      semesterName: c.semesterName || null,
    }));

    return studentCourses;
  } catch (err: any) {
    console.error('[GET_COURSES_BY_STUDENT_ID_ACTION_ERROR]', err);
    throw new ActionError('Failed to fetch student courses due to a server error: ' + err.message);
  }
}