// In: src/lib/actions/timetable.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import {
  timetables,
  NewTimetable,
  staff,
  students,
  courses,
  semesters,
  programs, // Make sure programs is imported for joining
  users,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm'; // Import 'and' for complex WHERE clauses
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

function allowedRolesForManagingTimetables() {
  return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.HOD];
}

function allowedRolesForViewingTimetables() {
  return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.HOD, ROLES.LECTURER, ROLES.STUDENT];
}

/**
 * Creates a new timetable entry.
 */
export async function createTimetable(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingTimetables())) {
      return { error: 'Unauthorized: You do not have permission to create timetables.' };
    }

    const semesterId = formData.get('semesterId') ? Number(formData.get('semesterId')) : null;
    const courseId = formData.get('courseId') ? Number(formData.get('courseId')) : null;
    const lecturerId = formData.get('lecturerId') ? Number(formData.get('lecturerId')) : null;
    const dayOfWeek = formData.get('dayOfWeek') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const room = formData.get('room') as string | null;

    if (!semesterId || !courseId || !lecturerId || !dayOfWeek || !startTime || !endTime) {
      return { error: 'Missing required fields for timetable entry creation.' };
    }

    // Optional: Add a check for overlapping schedules for the same lecturer or room
    // This would involve a more complex query checking for existing timetables
    // with the same day, room, and time overlap, or same day, lecturer, and time overlap.

    const newTimetable: NewTimetable = {
      semesterId,
      courseId,
      lecturerId,
      dayOfWeek,
      startTime,
      endTime,
      room: room || undefined,
    };

    await db.insert(timetables).values(newTimetable);

    revalidatePath('/dashboard/timetables');
    revalidatePath(`/dashboard/semesters/${semesterId}`); // Revalidate relevant pages
    revalidatePath(`/dashboard/courses/${courseId}`);
    revalidatePath(`/dashboard/staff/${lecturerId}`); // Revalidate lecturer's timetable view
    return { success: 'Timetable entry created successfully.' };
  } catch (err: any) {
    console.error('[CREATE_TIMETABLE_ACTION_ERROR]', err);
    throw new ActionError('Failed to create timetable entry due to a server error: ' + err.message);
  }
}

/**
 * Updates an existing timetable entry.
 */
export async function updateTimetable(timetableId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    // Fetch the timetable record to check ownership/department for HOD/Lecturer
    const timetableRecord = await db.query.timetables.findFirst({
      where: eq(timetables.id, timetableId),
      columns: { lecturerId: true, courseId: true }, // Fetch courseId to get department later
    });

    if (!timetableRecord) {
      return { error: 'Timetable entry not found.' };
    }

    const lecturerRecord = await db.query.staff.findFirst({
      where: eq(staff.id, timetableRecord.lecturerId),
      columns: { userId: true, departmentId: true },
    });

    // Determine the department of the course for HOD permission
    // FIX: Join courses to programs to get departmentId
    const courseProgramDepartment = await db.query.courses.findFirst({
      where: eq(courses.id, timetableRecord.courseId),
      with: {
        program: {
          columns: { departmentId: true },
        },
      },
      columns: { id: true }, // Select course ID to ensure a result
    });

    const courseDepartmentId = courseProgramDepartment?.program?.departmentId;

    // Authorization Logic:
    // 1. Admin/Registrar can update any timetable.
    // 2. The assigned Lecturer can update their own scheduled classes.
    // 3. A Department Head (HOD) can update timetables for courses in their department.
    const isAuthorized =
      checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR]) || // Admin, Registrar
      (checkPermission(authUser, [ROLES.LECTURER]) && authUser.userId === lecturerRecord?.userId) || // Lecturer assigned to this timetable
      (checkPermission(authUser, [ROLES.HOD]) && authUser.departmentId === courseDepartmentId); // HOD of the course's department

    if (!isAuthorized) {
      return { error: 'Unauthorized: You do not have permission to update this timetable entry.' };
    }

    const semesterId = formData.get('semesterId') ? Number(formData.get('semesterId')) : null;
    const courseId = formData.get('courseId') ? Number(formData.get('courseId')) : null;
    const lecturerId = formData.get('lecturerId') ? Number(formData.get('lecturerId')) : null;
    const dayOfWeek = formData.get('dayOfWeek') as string | null;
    const startTime = formData.get('startTime') as string | null;
    const endTime = formData.get('endTime') as string | null;
    const room = formData.get('room') as string | null;

    const updates: Partial<NewTimetable> = {};
    if (semesterId !== null) updates.semesterId = semesterId;
    if (courseId !== null) updates.courseId = courseId;
    if (lecturerId !== null) updates.lecturerId = lecturerId;
    if (dayOfWeek) updates.dayOfWeek = dayOfWeek;
    if (startTime) updates.startTime = startTime;
    if (endTime) updates.endTime = endTime;
    if (room !== null) updates.room = room;

    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    await db.update(timetables).set(updates).where(eq(timetables.id, timetableId));

    revalidatePath('/dashboard/timetables');
    revalidatePath(`/dashboard/timetables/${timetableId}`);
    if (semesterId) revalidatePath(`/dashboard/semesters/${semesterId}`);
    if (courseId) revalidatePath(`/dashboard/courses/${courseId}`);
    if (lecturerId) revalidatePath(`/dashboard/staff/${lecturerId}`);
    return { success: 'Timetable entry updated successfully.' };
  } catch (err: any) {
    console.error('[UPDATE_TIMETABLE_ACTION_ERROR]', err);
    throw new ActionError('Failed to update timetable entry due to a server error: ' + err.message);
  }
}

/**
 * Deletes a timetable entry.
 */
export async function deleteTimetable(timetableId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingTimetables())) {
      return { error: 'Unauthorized: You do not have permission to delete timetables.' };
    }

    await db.delete(timetables).where(eq(timetables.id, timetableId));

    revalidatePath('/dashboard/timetables');
    return { success: 'Timetable entry deleted successfully.' };
  } catch (err: any) {
    console.error('[DELETE_TIMETABLE_ACTION_ERROR]', err);
    throw new ActionError('Failed to delete timetable entry due to a server error: ' + err.message);
  }
}

/**
 * Fetches all timetable entries with associated course, lecturer, and semester details.
 */
export async function getTimetables() {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingTimetables())) {
      throw new ActionError('Unauthorized: You do not have permission to view timetables.');
    }

    const result = await db
      .select({
        id: timetables.id,
        semesterId: timetables.semesterId,
        courseId: timetables.courseId,
        lecturerId: timetables.lecturerId,
        dayOfWeek: timetables.dayOfWeek,
        startTime: timetables.startTime,
        endTime: timetables.endTime,
        room: timetables.room,
        courseName: courses.name,
        courseCode: courses.code,
        lecturerFirstName: staff.firstName,
        lecturerLastName: staff.lastName,
        lecturerEmail: staff.email,
        semesterName: semesters.name,
        // semesterYear: semesters.year, // REMOVED: Not in your schema
        // semesterType: semesters.type, // REMOVED: Not in your schema
      })
      .from(timetables)
      .leftJoin(semesters, eq(timetables.semesterId, semesters.id))
      .leftJoin(courses, eq(timetables.courseId, courses.id))
      .leftJoin(staff, eq(timetables.lecturerId, staff.id));

    const allTimetables = result.map((t) => ({
      id: t.id,
      semesterId: t.semesterId,
      courseId: t.courseId,
      lecturerId: t.lecturerId,
      dayOfWeek: t.dayOfWeek,
      startTime: t.startTime,
      endTime: t.endTime,
      room: t.room || null,
      courseName: t.courseName || null,
      courseCode: t.courseCode || null,
      lecturerFullName:
        t.lecturerFirstName && t.lecturerLastName ? `${t.lecturerFirstName} ${t.lecturerLastName}` : null,
      lecturerEmail: t.lecturerEmail || null,
      semesterName: t.semesterName || null,
      // semesterYear: t.semesterYear || null, // REMOVED: Not in your schema
      // semesterType: t.semesterType || null, // REMOVED: Not in your schema
    }));

    return allTimetables;
  } catch (err: any) {
    console.error('[GET_TIMETABLES_ACTION_ERROR]', err);
    throw new ActionError('Failed to fetch timetables due to a server error: ' + err.message);
  }
}

/**
 * Fetches a single timetable entry by ID with associated course, lecturer, and semester details.
 */
export async function getTimetableById(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingTimetables())) {
      return { error: 'Unauthorized: You do not have permission to view this timetable entry.' };
    }

    const result = await db
      .select({
        id: timetables.id,
        semesterId: timetables.semesterId,
        courseId: timetables.courseId,
        lecturerId: timetables.lecturerId,
        dayOfWeek: timetables.dayOfWeek,
        startTime: timetables.startTime,
        endTime: timetables.endTime,
        room: timetables.room,
        courseName: courses.name,
        courseCode: courses.code,
        lecturerFirstName: staff.firstName,
        lecturerLastName: staff.lastName,
        lecturerEmail: staff.email,
        semesterName: semesters.name,
        // semesterYear: semesters.year, // REMOVED: Not in your schema
        // semesterType: semesters.type, // REMOVED: Not in your schema
      })
      .from(timetables)
      .leftJoin(semesters, eq(timetables.semesterId, semesters.id))
      .leftJoin(courses, eq(timetables.courseId, courses.id))
      .leftJoin(staff, eq(timetables.lecturerId, staff.id))
      .where(eq(timetables.id, id));

    const timetable = result[0];

    if (!timetable) {
      return { error: 'Timetable entry not found.' };
    }

    return {
      id: timetable.id,
      semesterId: timetable.semesterId,
      courseId: timetable.courseId,
      lecturerId: timetable.lecturerId,
      dayOfWeek: timetable.dayOfWeek,
      startTime: timetable.startTime,
      endTime: timetable.endTime,
      room: timetable.room || null,
      courseName: timetable.courseName || null,
      courseCode: timetable.courseCode || null,
      lecturerFullName:
        timetable.lecturerFirstName && timetable.lecturerLastName
          ? `${timetable.lecturerFirstName} ${timetable.lecturerLastName}`
          : null,
      lecturerEmail: timetable.lecturerEmail || null,
      semesterName: timetable.semesterName || null,
      // semesterYear: timetable.semesterYear || null, // REMOVED: Not in your schema
      // semesterType: timetable.semesterType || null, // REMOVED: Not in your schema
    };
  } catch (err: any) {
    console.error('[GET_TIMETABLE_BY_ID_ACTION_ERROR]', err);
    throw new ActionError('Failed to fetch timetable entry due to a server error: ' + err.message);
  }
}

/**
 * Fetches timetable entries for a specific lecturer with associated course and semester details.
 * Permissions: Admin, Registrar, Department Head, Lecturer (can view their own).
 */
export async function getTimetablesByLecturerId(lecturerId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const lecturerRecord = await db.query.staff.findFirst({
      where: eq(staff.id, lecturerId),
      columns: { userId: true, departmentId: true }, // Need departmentId for HOD check
    });

    if (!lecturerRecord) {
      return { error: 'Lecturer not found.' };
    }

    // Authorization: Admin, Registrar, HOD (for their department), or the lecturer themselves.
    const isAuthorized =
      checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR]) || // Admin, Registrar
      (checkPermission(authUser, [ROLES.LECTURER]) && authUser.userId === lecturerRecord.userId) || // Lecturer viewing their own
      (checkPermission(authUser, [ROLES.HOD]) && authUser.departmentId === lecturerRecord.departmentId); // HOD viewing their department's lecturer

    if (!isAuthorized) {
      return { error: 'Unauthorized: You do not have permission to view this lecturer\'s timetable.' };
    }

    const result = await db
      .select({
        id: timetables.id,
        semesterId: timetables.semesterId,
        courseId: timetables.courseId,
        lecturerId: timetables.lecturerId,
        dayOfWeek: timetables.dayOfWeek,
        startTime: timetables.startTime,
        endTime: timetables.endTime,
        room: timetables.room,
        courseName: courses.name,
        courseCode: courses.code,
        semesterName: semesters.name,
        // semesterYear: semesters.year, // REMOVED: Not in your schema
        // semesterType: semesters.type, // REMOVED: Not in your schema
      })
      .from(timetables)
      .leftJoin(semesters, eq(timetables.semesterId, semesters.id))
      .leftJoin(courses, eq(timetables.courseId, courses.id))
      .where(eq(timetables.lecturerId, lecturerId));

    const lecturerTimetables = result.map((t) => ({
      id: t.id,
      semesterId: t.semesterId,
      courseId: t.courseId,
      lecturerId: t.lecturerId,
      dayOfWeek: t.dayOfWeek,
      startTime: t.startTime,
      endTime: t.endTime,
      room: t.room || null,
      courseName: t.courseName || null,
      courseCode: t.courseCode || null,
      semesterName: t.semesterName || null,
      // semesterYear: t.semesterYear || null, // REMOVED: Not in your schema
      // semesterType: t.semesterType || null, // REMOVED: Not in your schema
    }));

    return lecturerTimetables;
  } catch (err: any) {
    console.error('[GET_TIMETABLES_BY_LECTURER_ID_ACTION_ERROR]', err);
    throw new ActionError('Failed to fetch lecturer timetable due to a server error: ' + err.message);
  }
}

/**
 * Fetches timetable entries for a specific student's program and current semester.
 * Permissions: Admin, Registrar, Student (can view their own).
 */
export async function getTimetablesForStudent(studentId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const studentRecord = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      columns: { userId: true, programId: true, currentSemesterId: true },
    });

    if (!studentRecord) {
      return { error: 'Student not found.' };
    }

    // Authorization: Admin, Registrar, or the student themselves.
    const isAuthorized =
      checkPermission(authUser, [ROLES.ADMIN, ROLES.REGISTRAR]) ||
      (checkPermission(authUser, [ROLES.STUDENT]) && authUser.userId === studentRecord.userId);

    if (!isAuthorized) {
      return { error: 'Unauthorized: You do not have permission to view this student\'s timetable.' };
    }

    // Fetch timetables relevant to the student's program and current semester
    const result = await db
      .select({
        id: timetables.id,
        semesterId: timetables.semesterId,
        courseId: timetables.courseId,
        lecturerId: timetables.lecturerId,
        dayOfWeek: timetables.dayOfWeek,
        startTime: timetables.startTime,
        endTime: timetables.endTime,
        room: timetables.room,
        courseName: courses.name,
        courseCode: courses.code,
        lecturerFirstName: staff.firstName,
        lecturerLastName: staff.lastName,
        semesterName: semesters.name,
        programName: programs.name,
        programCode: programs.code,
      })
      .from(timetables)
      .innerJoin(courses, eq(timetables.courseId, courses.id))
      .innerJoin(semesters, eq(timetables.semesterId, semesters.id))
      .leftJoin(staff, eq(timetables.lecturerId, staff.id))
      .leftJoin(programs, eq(courses.programId, programs.id)) // Assuming courses has programId
      .where(
        and(
          eq(timetables.semesterId, studentRecord.currentSemesterId!),
          eq(courses.programId, studentRecord.programId!),
        ),
      );

    const studentTimetables = result.map((t) => ({
      id: t.id,
      semesterId: t.semesterId,
      courseId: t.courseId,
      lecturerId: t.lecturerId,
      dayOfWeek: t.dayOfWeek,
      startTime: t.startTime,
      endTime: t.endTime,
      room: t.room || null,
      courseName: t.courseName || null,
      courseCode: t.courseCode || null,
      lecturerFullName:
        t.lecturerFirstName && t.lecturerLastName ? `${t.lecturerFirstName} ${t.lecturerLastName}` : null,
      semesterName: t.semesterName || null,
      programName: t.programName || null,
      programCode: t.programCode || null,
    }));

    return studentTimetables;
  } catch (err: any) {
    console.error('[GET_TIMETABLES_FOR_STUDENT_ACTION_ERROR]', err);
    throw new ActionError('Failed to fetch student timetable due to a server error: ' + err.message);
  }
}