// app/actions/timetables.ts
'use server';

import { db } from '@/lib/db';
import { 
  timetables,
  courses,
  staff,
  semesters,
  // NewTimetable,
  SelectTimetable,
  SelectSemester,
  SelectCourse,
  SelectStaff
} from '@/lib/db/schema';
import { and, eq, SQL, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Types from your schema
export type TimetableData = {
  semesterId: number;
  courseId: number;
  lecturerId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string | null;
};

export type TimetableWithDetails = {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  semester: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  course: {
    id: number;
    name: string;
    code: string;
  };
  lecturer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
};

/**
 * Fetches all timetables with course, lecturer, and semester details
 */
export async function getAllTimetables(): Promise<TimetableWithDetails[]> {
  try {
    const rawData = await db
      .select({
        id: timetables.id,
        dayOfWeek: timetables.dayOfWeek,
        startTime: timetables.startTime,
        endTime: timetables.endTime,
        room: timetables.room,
        semesterId: semesters.id,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
        courseId: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        lecturerId: staff.id,
        lecturerFirstName: staff.firstName,
        lecturerLastName: staff.lastName,
        lecturerEmail: staff.email,
      })
      .from(timetables)
      .leftJoin(semesters, eq(timetables.semesterId, semesters.id))
      .leftJoin(courses, eq(timetables.courseId, courses.id))
      .leftJoin(staff, eq(timetables.lecturerId, staff.id));

    const mappedData: TimetableWithDetails[] = rawData
      .filter(
        (row) => row.semesterId !== null && row.courseId !== null && row.lecturerId !== null
      )
      .map((row) => ({
        id: row.id,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        room: row.room,
        semester: {
          id: row.semesterId!,
          name: row.semesterName ?? '',
          startDate: row.semesterStartDate ?? '',
          endDate: row.semesterEndDate ?? '',
        },
        course: {
          id: row.courseId!,
          name: row.courseName ?? '',
          code: row.courseCode ?? '',
        },
        lecturer: {
          id: row.lecturerId!,
          firstName: row.lecturerFirstName ?? '',
          lastName: row.lecturerLastName ?? '',
          email: row.lecturerEmail ?? '',
        },
      }));

    return mappedData;
  } catch (error) {
    console.error('Failed to fetch timetables:', error);
    throw new Error('Failed to fetch timetables');
  }
}

/**
 * Fetches timetables by semester
 */
export async function getTimetablesBySemester(semesterId: number): Promise<TimetableWithDetails[]> {
  try {
    const rawData = await db
      .select({
        id: timetables.id,
        dayOfWeek: timetables.dayOfWeek,
        startTime: timetables.startTime,
        endTime: timetables.endTime,
        room: timetables.room,
        semesterId: semesters.id,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
        courseId: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        lecturerId: staff.id,
        lecturerFirstName: staff.firstName,
        lecturerLastName: staff.lastName,
        lecturerEmail: staff.email,
      })
      .from(timetables)
      .leftJoin(semesters, eq(timetables.semesterId, semesters.id))
      .leftJoin(courses, eq(timetables.courseId, courses.id))
      .leftJoin(staff, eq(timetables.lecturerId, staff.id))
      .where(eq(timetables.semesterId, semesterId));

    const mappedData: TimetableWithDetails[] = rawData
      .filter(
        (row) => row.semesterId !== null && row.courseId !== null && row.lecturerId !== null
      )
      .map((row) => ({
        id: row.id,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        room: row.room,
        semester: {
          id: row.semesterId!,
          name: row.semesterName ?? '',
          startDate: row.semesterStartDate ?? '',
          endDate: row.semesterEndDate ?? '',
        },
        course: {
          id: row.courseId!,
          name: row.courseName ?? '',
          code: row.courseCode ?? '',
        },
        lecturer: {
          id: row.lecturerId!,
          firstName: row.lecturerFirstName ?? '',
          lastName: row.lecturerLastName ?? '',
          email: row.lecturerEmail ?? '',
        },
      }));

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch timetables for semester ${semesterId}:`, error);
    throw new Error('Failed to fetch timetables by semester');
  }
}

/**
 * Fetches timetables by course
 */
export async function getTimetablesByCourse(courseId: number): Promise<TimetableWithDetails[]> {
  try {
    const rawData = await db
      .select({
        id: timetables.id,
        dayOfWeek: timetables.dayOfWeek,
        startTime: timetables.startTime,
        endTime: timetables.endTime,
        room: timetables.room,
        semesterId: semesters.id,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
        courseId: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        lecturerId: staff.id,
        lecturerFirstName: staff.firstName,
        lecturerLastName: staff.lastName,
        lecturerEmail: staff.email,
      })
      .from(timetables)
      .leftJoin(semesters, eq(timetables.semesterId, semesters.id))
      .leftJoin(courses, eq(timetables.courseId, courses.id))
      .leftJoin(staff, eq(timetables.lecturerId, staff.id))
      .where(eq(timetables.courseId, courseId));

    const mappedData: TimetableWithDetails[] = rawData
      .filter(
        (row) => row.semesterId !== null && row.courseId !== null && row.lecturerId !== null
      )
      .map((row) => ({
        id: row.id,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        room: row.room,
        semester: {
          id: row.semesterId!,
          name: row.semesterName ?? '',
          startDate: row.semesterStartDate ?? '',
          endDate: row.semesterEndDate ?? '',
        },
        course: {
          id: row.courseId!,
          name: row.courseName ?? '',
          code: row.courseCode ?? '',
        },
        lecturer: {
          id: row.lecturerId!,
          firstName: row.lecturerFirstName ?? '',
          lastName: row.lecturerLastName ?? '',
          email: row.lecturerEmail ?? '',
        },
      }));

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch timetables for course ${courseId}:`, error);
    throw new Error('Failed to fetch timetables by course');
  }
}

/**
 * Fetches timetables by lecturer
 */
export async function getTimetablesByLecturer(lecturerId: number): Promise<TimetableWithDetails[]> {
  try {
    const rawData = await db
      .select({
        id: timetables.id,
        dayOfWeek: timetables.dayOfWeek,
        startTime: timetables.startTime,
        endTime: timetables.endTime,
        room: timetables.room,
        semesterId: semesters.id,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
        courseId: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        lecturerId: staff.id,
        lecturerFirstName: staff.firstName,
        lecturerLastName: staff.lastName,
        lecturerEmail: staff.email,
      })
      .from(timetables)
      .leftJoin(semesters, eq(timetables.semesterId, semesters.id))
      .leftJoin(courses, eq(timetables.courseId, courses.id))
      .leftJoin(staff, eq(timetables.lecturerId, staff.id))
      .where(eq(timetables.lecturerId, lecturerId));

    const mappedData: TimetableWithDetails[] = rawData
      .filter(
        (row) => row.semesterId !== null && row.courseId !== null && row.lecturerId !== null
      )
      .map((row) => ({
        id: row.id,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        room: row.room,
        semester: {
          id: row.semesterId!,
          name: row.semesterName ?? '',
          startDate: row.semesterStartDate ?? '',
          endDate: row.semesterEndDate ?? '',
        },
        course: {
          id: row.courseId!,
          name: row.courseName ?? '',
          code: row.courseCode ?? '',
        },
        lecturer: {
          id: row.lecturerId!,
          firstName: row.lecturerFirstName ?? '',
          lastName: row.lecturerLastName ?? '',
          email: row.lecturerEmail ?? '',
        },
      }));

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch timetables for lecturer ${lecturerId}:`, error);
    throw new Error('Failed to fetch timetables by lecturer');
  }
}

/**
 * Fetches a single timetable by ID with all details
 */
export async function getTimetableById(timetableId: number): Promise<TimetableWithDetails | null> {
  try {
    const rawData = await db
      .select({
        id: timetables.id,
        dayOfWeek: timetables.dayOfWeek,
        startTime: timetables.startTime,
        endTime: timetables.endTime,
        room: timetables.room,
        semesterId: semesters.id,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
        courseId: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        lecturerId: staff.id,
        lecturerFirstName: staff.firstName,
        lecturerLastName: staff.lastName,
        lecturerEmail: staff.email,
      })
      .from(timetables)
      .leftJoin(semesters, eq(timetables.semesterId, semesters.id))
      .leftJoin(courses, eq(timetables.courseId, courses.id))
      .leftJoin(staff, eq(timetables.lecturerId, staff.id))
      .where(eq(timetables.id, timetableId))
      .limit(1);

    const result = rawData[0];

    if (!result || result.semesterId === null || result.courseId === null || result.lecturerId === null) {
      return null;
    }

    const mappedData: TimetableWithDetails = {
      id: result.id,
      dayOfWeek: result.dayOfWeek,
      startTime: result.startTime,
      endTime: result.endTime,
      room: result.room,
      semester: {
        id: result.semesterId!,
        name: result.semesterName ?? '',
        startDate: result.semesterStartDate ?? '',
        endDate: result.semesterEndDate ?? '',
      },
      course: {
        id: result.courseId!,
        name: result.courseName ?? '',
        code: result.courseCode ?? '',
      },
      lecturer: {
        id: result.lecturerId!,
        firstName: result.lecturerFirstName ?? '',
        lastName: result.lecturerLastName ?? '',
        email: result.lecturerEmail ?? '',
      },
    };

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch timetable ${timetableId}:`, error);
    throw new Error('Failed to fetch timetable by ID');
  }
}

/**
 * Creates a new timetable record
 */
export async function createTimetable(timetableData: TimetableData): Promise<SelectTimetable> {
  try {
    const result = await db.insert(timetables).values(timetableData).returning();

    revalidatePath('/admin/timetables');
    return result[0];
  } catch (error) {
    console.error('Failed to create timetable:', error);
    throw new Error('Failed to create timetable');
  }
}

/**
 * Updates an existing timetable record
 */
export async function updateTimetable(
  timetableId: number,
  timetableData: Partial<TimetableData>
): Promise<SelectTimetable> {
  try {
    const result = await db
      .update(timetables)
      .set(timetableData)
      .where(eq(timetables.id, timetableId))
      .returning();

    revalidatePath('/admin/timetables');
    return result[0];
  } catch (error) {
    console.error(`Failed to update timetable ${timetableId}:`, error);
    throw new Error('Failed to update timetable');
  }
}

/**
 * Deletes a timetable record
 */
export async function deleteTimetable(timetableId: number): Promise<{ success: boolean }> {
  try {
    await db.delete(timetables).where(eq(timetables.id, timetableId));

    revalidatePath('/admin/timetables');
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete timetable ${timetableId}:`, error);
    throw new Error('Failed to delete timetable');
  }
}

/**
 * Checks for timetable conflicts (same room, same time, same day)
 */
export async function checkTimetableConflict(
  semesterId: number,
  dayOfWeek: string,
  startTime: string,
  endTime: string,
  room: string | null,
  excludeTimetableId?: number
): Promise<boolean> {
  try {
    // Create an array to hold the dynamic conditions
    const conditions: (SQL | undefined)[] = [
      eq(timetables.semesterId, semesterId),
      eq(timetables.dayOfWeek, dayOfWeek),
      // Check for time overlap
      sql`${timetables.startTime} < ${endTime} AND ${timetables.endTime} > ${startTime}`,
    ];

    // Conditionally add the room condition
    if (room) {
      conditions.push(eq(timetables.room, room));
    }

    // Conditionally add the exclusion condition
    if (excludeTimetableId) {
      conditions.push(sql`${timetables.id} != ${excludeTimetableId}`);
    }

    const conflictingTimetables = await db
      .select()
      .from(timetables)
      // Pass all conditions to a single .where() call
      .where(and(...conditions));

    return conflictingTimetables.length > 0;
  } catch (error) {
    console.error('Failed to check timetable conflict:', error);
    throw new Error('Failed to check timetable conflict');
  }
}

/**
 * Gets all unique rooms used in timetables
 */
export async function getAllTimetableRooms(): Promise<string[]> {
  try {
    const result = await db
      .selectDistinct({ room: timetables.room })
      .from(timetables)
      .where(sql`${timetables.room} IS NOT NULL`);

    return result.map((row) => row.room ?? '').filter(Boolean);
  } catch (error) {
    console.error('Failed to fetch timetable rooms:', error);
    throw new Error('Failed to fetch timetable rooms');
  }
}

export async function fetchSemesters(): Promise<SelectSemester[]> {
  try {
    const allSemesters = await db.select().from(semesters);
    return allSemesters;
  } catch (error) {
    console.error("Failed to fetch semesters:", error);
    throw new Error("Failed to retrieve semesters.");
  }
}

export async function fetchCourses(): Promise<SelectCourse[]> {
  try {
    const allCourses = await db.select().from(courses);
    return allCourses;
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    throw new Error("Failed to retrieve courses.");
  }
}

export async function fetchLecturers(): Promise<SelectStaff[]> {
  try {
    // This query will select all staff members
    const allStaff = await db.select().from(staff);
    return allStaff;
  } catch (error) {
    console.error("Failed to fetch lecturers:", error);
    throw new Error("Failed to retrieve lecturers.");
  }
}