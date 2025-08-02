// In: src/lib/actions/grade.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import {
  grades,
  NewGrade,
  enrollments,
  students,
  courses,
  semesters,
  staff,
  users,
  timetables, // <--- ADDED timetables import
} from '@/lib/db/schema'; // Added necessary schemas for joins
import { eq } from 'drizzle-orm'; // Added 'and' for combined queries
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

// function allowedRolesForManagingGrades() {
//   return [ROLES.ADMIN, ROLES.LECTURER]; // Lecturer can manage grades for their courses
// }

function allowedRolesForViewingAllGrades() {
  return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.LECTURER, ROLES.HOD]; // HOD can view grades in their department
}

// function allowedRolesForViewingIndividualOrStudentGrades() {
//   return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.LECTURER, ROLES.HOD, ROLES.STUDENT]; // Student can view their own
// }

// Helper function to calculate letter grade and GPA
function calculateGradeDetails(catScore: number | null, examScore: number | null) {
  const totalScore = (catScore || 0) + (examScore || 0);
  let letterGrade: string | null = null;
  let gpa: string | null = null;

  // Example grading scale (adjust as needed)
  if (totalScore >= 80) {
    letterGrade = 'A';
    gpa = '5.00';
  } else if (totalScore >= 70) {
    letterGrade = 'B';
    gpa = '4.00';
  } else if (totalScore >= 60) {
    letterGrade = 'C';
    gpa = '3.00';
  } else if (totalScore >= 50) {
    letterGrade = 'D';
    gpa = '2.00';
  } else if (totalScore >= 40) {
    letterGrade = 'E';
    gpa = '1.00';
  } else {
    letterGrade = 'F';
    gpa = '0.00';
  }

  return { totalScore: String(totalScore.toFixed(2)), letterGrade, gpa };
}

/**
 * Creates a new grade for an enrollment.
 * Permissions: Admin, Lecturer
 */
export async function createGrade(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const enrollmentId = formData.get('enrollmentId') ? Number(formData.get('enrollmentId')) : null;
    const catScoreStr = formData.get('catScore') as string | null;
    const examScoreStr = formData.get('examScore') as string | null;

    if (!enrollmentId) {
      return { error: 'Enrollment ID is required for grade creation.' };
    }

    // Fetch enrollment details to check lecturer's permission
    const enrollmentRecord = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, enrollmentId),
      columns: { courseId: true },
    });

    if (!enrollmentRecord) {
      return { error: 'Enrollment not found.' };
    }

    // Check if the authenticated user is the lecturer for this course
    const courseLecturer = await db.query.timetables.findFirst({
      where: eq(timetables.courseId, enrollmentRecord.courseId),
      with: {
        lecturer: {
          columns: { userId: true },
        },
      },
    });

    const isAuthorizedAsLecturer =
      authUser.role === ROLES.LECTURER && authUser.userId === courseLecturer?.lecturer?.userId;

    if (!checkPermission(authUser, [ROLES.ADMIN]) && !isAuthorizedAsLecturer) {
      return { error: 'Unauthorized: You do not have permission to create grades for this enrollment.' };
    }

    // Check if a grade already exists for this enrollment
    const existingGrade = await db.query.grades.findFirst({
      where: eq(grades.enrollmentId, enrollmentId),
    });

    if (existingGrade) {
      return { error: 'A grade already exists for this enrollment. Please update it instead.' };
    }

    const catScore = catScoreStr !== null ? parseFloat(catScoreStr) : null;
    const examScore = examScoreStr !== null ? parseFloat(examScoreStr) : null;

    if (
      (catScore !== null && (isNaN(catScore) || catScore < 0 || catScore > 100)) ||
      (examScore !== null && (isNaN(examScore) || examScore < 0 || examScore > 100))
    ) {
      return { error: 'CAT Score and Exam Score must be numbers between 0 and 100.' };
    }

    const { totalScore, letterGrade, gpa } = calculateGradeDetails(catScore, examScore);

    const newGrade: NewGrade = {
      enrollmentId,
      catScore: catScore !== null ? String(catScore.toFixed(2)) : undefined,
      examScore: examScore !== null ? String(examScore.toFixed(2)) : undefined,
      totalScore,
      letterGrade: letterGrade || undefined,
      gpa: gpa || undefined,
    };

    const [createdGrade] = await db.insert(grades).values(newGrade).returning();

    revalidatePath('/dashboard/grades');
    revalidatePath(`/dashboard/enrollments/${enrollmentId}`);
    // Revalidate student's transcript or grades page (requires fetching studentId via enrollment)
    const studentForRevalidation = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, enrollmentId),
      with: { student: { columns: { id: true } } },
    });
    if (studentForRevalidation?.student?.id) {
      revalidatePath(`/dashboard/students/${studentForRevalidation.student.id}/grades`);
      revalidatePath(`/dashboard/students/${studentForRevalidation.student.id}/transcripts`);
    }

    return { success: 'Grade created successfully.', data: createdGrade };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  throw error;
}
}

/**
 * Updates an existing grade.
 * Permissions: Admin, Lecturer
 */
export async function updateGrade(gradeId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    // Fetch grade and associated enrollment/course/lecturer data for permission check
    const gradeRecord = await db.query.grades.findFirst({
      where: eq(grades.id, gradeId),
      with: {
        enrollment: {
          with: {
            course: {
              with: {
                timetables: {
                  with: {
                    lecturer: {
                      columns: { userId: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!gradeRecord) {
      return { error: 'Grade not found.' };
    }
    
    // Ensure enrollment exists if you're going to access its properties
    if (!gradeRecord.enrollment) {
        return { error: 'Enrollment record not found for this grade.' };
    }

    const assignedLecturerUserId = gradeRecord.enrollment.course?.timetables?.[0]?.lecturer?.userId;
    const isAuthorizedAsLecturer =
      authUser.role === ROLES.LECTURER && authUser.userId === assignedLecturerUserId;

    if (!checkPermission(authUser, [ROLES.ADMIN]) && !isAuthorizedAsLecturer) {
      return { error: 'Unauthorized: You do not have permission to update this grade.' };
    }

    const catScoreStr = formData.get('catScore') as string | null;
    const examScoreStr = formData.get('examScore') as string | null;

    const updates: Partial<NewGrade> = {};

    const newCatScore: number | null =
      catScoreStr !== null
        ? parseFloat(catScoreStr)
        : gradeRecord.catScore !== null
          ? parseFloat(gradeRecord.catScore)
          : null;
    const newExamScore: number | null =
      examScoreStr !== null
        ? parseFloat(examScoreStr)
        : gradeRecord.examScore !== null
          ? parseFloat(gradeRecord.examScore)
          : null;

    if (
      (newCatScore !== null && (isNaN(newCatScore) || newCatScore < 0 || newCatScore > 100)) ||
      (newExamScore !== null && (isNaN(newExamScore) || newExamScore < 0 || newExamScore > 100))
    ) {
      return { error: 'CAT Score and Exam Score must be numbers between 0 and 100.' };
    }

    // Only update if value is explicitly provided or changed
    if (catScoreStr !== null) updates.catScore = String(newCatScore!.toFixed(2));
    if (examScoreStr !== null) updates.examScore = String(newExamScore!.toFixed(2));

    // Recalculate totalScore, letterGrade, and gpa based on potentially updated scores
    const { totalScore, letterGrade, gpa } = calculateGradeDetails(newCatScore, newExamScore);
    updates.totalScore = totalScore;
    updates.letterGrade = letterGrade;
    updates.gpa = gpa;

    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    const [updatedGrade] = await db.update(grades).set(updates).where(eq(grades.id, gradeId)).returning();

    revalidatePath('/dashboard/grades');
    revalidatePath(`/dashboard/grades/${gradeId}`);
    // Use non-null assertion here
    if (gradeRecord.enrollmentId) revalidatePath(`/dashboard/enrollments/${gradeRecord.enrollmentId!}`);
    // Revalidate student's transcript or grades page
    const studentForRevalidation = await db.query.enrollments.findFirst({
      // Use non-null assertion here
      where: eq(enrollments.id, gradeRecord.enrollmentId!),
      with: { student: { columns: { id: true } } },
    });
    if (studentForRevalidation?.student?.id) {
      revalidatePath(`/dashboard/students/${studentForRevalidation.student.id}/grades`);
      revalidatePath(`/dashboard/students/${studentForRevalidation.student.id}/transcripts`);
    }

    return { success: 'Grade updated successfully.', data: updatedGrade };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  throw error;
}
}

/**
 * Deletes a grade.
 * Permissions: Admin, Lecturer (for their courses)
 * Note: Deleting grades should be handled with care, as they impact academic records.
 */
export async function deleteGrade(gradeId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    // Fetch grade and associated enrollment/course/lecturer data for permission check
    const gradeRecord = await db.query.grades.findFirst({
      where: eq(grades.id, gradeId),
      with: {
        enrollment: {
          columns: { id: true, studentId: true }, // Get studentId for revalidation
          with: {
            course: {
              with: {
                timetables: {
                  with: {
                    lecturer: {
                      columns: { userId: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!gradeRecord) {
      return { error: 'Grade not found.' };
    }

    const assignedLecturerUserId = gradeRecord.enrollment?.course?.timetables?.[0]?.lecturer?.userId;
    const isAuthorizedAsLecturer =
      authUser.role === ROLES.LECTURER && authUser.userId === assignedLecturerUserId;

    if (!checkPermission(authUser, [ROLES.ADMIN]) && !isAuthorizedAsLecturer) {
      return { error: 'Unauthorized: You do not have permission to delete this grade.' };
    }

    const [deletedGrade] = await db.delete(grades).where(eq(grades.id, gradeId)).returning();

    revalidatePath('/dashboard/grades');
    if (gradeRecord.enrollmentId) revalidatePath(`/dashboard/enrollments/${gradeRecord.enrollmentId}`);
    if (gradeRecord.enrollment?.studentId) {
      revalidatePath(`/dashboard/students/${gradeRecord.enrollment.studentId}/grades`);
      revalidatePath(`/dashboard/students/${gradeRecord.enrollment.studentId}/transcripts`);
    }

    return { success: 'Grade deleted successfully.', data: deletedGrade };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches all grades with associated enrollment, student, course, and semester details.
 * Permissions: Admin, Registrar, Lecturer, HOD
 */
export async function getGrades() {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingAllGrades())) {
      throw new ActionError('Unauthorized: You do not have permission to view grades.');
    }

    const result = await db
      .select({
        id: grades.id,
        enrollmentId: grades.enrollmentId,
        catScore: grades.catScore,
        examScore: grades.examScore,
        totalScore: grades.totalScore,
        letterGrade: grades.letterGrade,
        gpa: grades.gpa,
        studentId: enrollments.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegNo: students.registrationNumber,
        studentUserEmail: users.email,
        courseId: enrollments.courseId,
        courseName: courses.name,
        courseCode: courses.code,
        semesterId: enrollments.semesterId,
        semesterName: semesters.name,
      })
      .from(grades)
      .innerJoin(enrollments, eq(grades.enrollmentId, enrollments.id))
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id));

    const allGrades = result.map((g) => ({
      id: g.id,
      enrollmentId: g.enrollmentId!,
      catScore: g.catScore || null,
      examScore: g.examScore || null,
      totalScore: g.totalScore || null,
      letterGrade: g.letterGrade || null,
      gpa: g.gpa || null,
      studentId: g.studentId || null,
      studentFullName:
        g.studentFirstName && g.studentLastName ? `${g.studentFirstName} ${g.studentLastName}` : null,
      studentRegNo: g.studentRegNo || null,
      studentUserEmail: g.studentUserEmail || null,
      courseId: g.courseId || null,
      courseName: g.courseName || null,
      courseCode: g.courseCode || null,
      semesterId: g.semesterId || null,
      semesterName: g.semesterName || null,
    }));

    return allGrades;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches a single grade by ID with associated enrollment, student, course, and semester details.
 * Permissions: Admin, Registrar, Lecturer, HOD, Student (can view their own).
 */
export async function getGradeById(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const result = await db
      .select({
        id: grades.id,
        enrollmentId: grades.enrollmentId,
        catScore: grades.catScore,
        examScore: grades.examScore,
        totalScore: grades.totalScore,
        letterGrade: grades.letterGrade,
        gpa: grades.gpa,
        studentId: enrollments.studentId,
        studentUserId: students.userId, // Needed for student self-access check
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegNo: students.registrationNumber, // <--- FIX: Used registrationNumber
        studentUserEmail: users.email,
        courseId: enrollments.courseId,
        courseName: courses.name,
        courseCode: courses.code,
        semesterId: enrollments.semesterId,
        semesterName: semesters.name,
        // Lecturer details for permission check if needed (e.g., if this grade belongs to their course)
        lecturerId: staff.id, // Assuming staff.id is lecturerId
        lecturerUserId: staff.userId,
        lecturerFirstName: staff.firstName,
        lecturerLastName: staff.lastName,
      })
      .from(grades)
      .leftJoin(enrollments, eq(grades.enrollmentId, enrollments.id))
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id))
      .leftJoin(timetables, eq(courses.id, timetables.courseId)) // Join via timetables to get lecturer
      .leftJoin(staff, eq(timetables.lecturerId, staff.id))
      .where(eq(grades.id, id))
      .limit(1);

    const gradeRecord = result[0];

    if (!gradeRecord) {
      return { error: 'Grade not found.' };
    }

    // Authorization Logic:
    // 1. Admin, Registrar, HOD can view any grade.
    // 2. Lecturer can view grades for courses they teach.
    // 3. Student can view their own grades.
    const isAuthorizedAsLecturer =
      authUser.role === ROLES.LECTURER && authUser.userId === gradeRecord.lecturerUserId;
    const isAuthorizedAsStudent =
      authUser.role === ROLES.STUDENT && authUser.userId === gradeRecord.studentUserId;

    if (
      !checkPermission(authUser, allowedRolesForViewingAllGrades()) &&
      !isAuthorizedAsLecturer &&
      !isAuthorizedAsStudent
    ) {
      return { error: 'Unauthorized: You do not have permission to view this grade.' };
    }

    return {
      id: gradeRecord.id,
      enrollmentId: gradeRecord.enrollmentId,
      catScore: gradeRecord.catScore || null,
      examScore: gradeRecord.examScore || null,
      totalScore: gradeRecord.totalScore || null,
      letterGrade: gradeRecord.letterGrade || null,
      gpa: gradeRecord.gpa || null,
      studentId: gradeRecord.studentId || null,
      studentFullName:
        gradeRecord.studentFirstName && gradeRecord.studentLastName
          ? `${gradeRecord.studentFirstName} ${gradeRecord.studentLastName}`
          : null,
      studentRegNo: gradeRecord.studentRegNo || null, // <--- FIX: Used aliased name
      studentUserEmail: gradeRecord.studentUserEmail || null,
      courseId: gradeRecord.courseId || null,
      courseName: gradeRecord.courseName || null,
      courseCode: gradeRecord.courseCode || null,
      semesterId: gradeRecord.semesterId || null,
      semesterName: gradeRecord.semesterName || null,
      lecturerFullName:
        gradeRecord.lecturerFirstName && gradeRecord.lecturerLastName
          ? `${gradeRecord.lecturerFirstName} ${gradeRecord.lecturerLastName}`
          : null,
    };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  throw error;
}
}

/**
 * Fetches all grades for a specific student.
 * Permissions: Admin, Registrar, HOD, Lecturer (for their courses), Student (can view their own).
 */
export async function getGradesByStudentId(studentId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const studentRecord = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      columns: { userId: true, firstName: true, lastName: true, registrationNumber: true, departmentId: true }, // <--- FIX: Used registrationNumber
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
      // For simplicity, this is omitted here, assuming lecturers primarily use getGradesByLecturerId.
      return { error: 'Unauthorized: You do not have permission to view these grades.' };
    }

    const result = await db
      .select({
        id: grades.id,
        enrollmentId: grades.enrollmentId,
        catScore: grades.catScore,
        examScore: grades.examScore,
        totalScore: grades.totalScore,
        letterGrade: grades.letterGrade,
        gpa: grades.gpa,
        courseId: enrollments.courseId,
        courseName: courses.name,
        courseCode: courses.code,
        semesterId: enrollments.semesterId,
        semesterName: semesters.name,
        lecturerFirstName: staff.firstName,
        lecturerLastName: staff.lastName,
      })
      .from(grades)
      .innerJoin(enrollments, eq(grades.enrollmentId, enrollments.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id))
      .leftJoin(timetables, eq(courses.id, timetables.courseId)) // Join via timetables to get lecturer
      .leftJoin(staff, eq(timetables.lecturerId, staff.id))
      .where(eq(enrollments.studentId, studentId));

    const studentGrades = result.map((g) => ({
      id: g.id,
      enrollmentId: g.enrollmentId,
      catScore: g.catScore || null,
      examScore: g.examScore || null,
      totalScore: g.totalScore || null,
      letterGrade: g.letterGrade || null,
      gpa: g.gpa || null,
      courseId: g.courseId || null,
      courseName: g.courseName || null,
      courseCode: g.courseCode || null,
      semesterId: g.semesterId || null,
      semesterName: g.semesterName || null,
      lecturerFullName:
        g.lecturerFirstName && g.lecturerLastName ? `${g.lecturerFirstName} ${g.lecturerLastName}` : null,
    }));

    return studentGrades;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  throw error;
}
}

/**
 * Fetches all grades for courses taught by a specific lecturer.
 * Permissions: Admin, Registrar, HOD, Lecturer (can view their own).
 */
export async function getGradesByLecturerId(lecturerId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const lecturerRecord = await db.query.staff.findFirst({
      where: eq(staff.id, lecturerId),
      columns: { userId: true, firstName: true, lastName: true, departmentId: true },
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
      return { error: 'Unauthorized: You do not have permission to view these grades.' };
    }

    const result = await db
      .select({
        id: grades.id,
        enrollmentId: grades.enrollmentId,
        catScore: grades.catScore,
        examScore: grades.examScore,
        totalScore: grades.totalScore,
        letterGrade: grades.letterGrade,
        gpa: grades.gpa,
        studentId: enrollments.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegNo: students.registrationNumber, // <--- FIX: Used registrationNumber
        courseId: enrollments.courseId,
        courseName: courses.name,
        courseCode: courses.code,
        semesterId: enrollments.semesterId,
        semesterName: semesters.name,
      })
      .from(grades)
      .innerJoin(enrollments, eq(grades.enrollmentId, enrollments.id))
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(timetables, eq(courses.id, timetables.courseId)) // Join to link courses to lecturers
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id))
      .where(eq(timetables.lecturerId, lecturerId));

    const lecturerGrades = result.map((g) => ({
      id: g.id,
      enrollmentId: g.enrollmentId,
      catScore: g.catScore || null,
      examScore: g.examScore || null,
      totalScore: g.totalScore || null,
      letterGrade: g.letterGrade || null,
      gpa: g.gpa || null,
      studentId: g.studentId || null,
      studentFullName:
        g.studentFirstName && g.studentLastName ? `${g.studentFirstName} ${g.studentLastName}` : null,
      studentRegNo: g.studentRegNo || null, // <--- FIX: Used aliased name
      courseId: g.courseId || null,
      courseName: g.courseName || null,
      courseCode: g.courseCode || null,
      semesterId: g.semesterId || null,
      semesterName: g.semesterName || null,
    }));

    return lecturerGrades;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  throw error;
}
}