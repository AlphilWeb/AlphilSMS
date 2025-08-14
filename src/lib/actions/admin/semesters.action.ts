// lib/actions/admin.manage.semesters.action.ts
'use server';

import { db } from '@/lib/db';
import { semesters, courses, enrollments, students, userLogs, timetables, academicCalendarEvents, programs, staff, departments } from '@/lib/db/schema';
import { and, eq, asc, sql, or, ne } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActionError } from '@/lib/utils';
// import { StudentWithDetails } from './students.action';
// import { create } from 'domain';

// Types (same as before)
export type SemesterWithStats = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  courseCount: number;
  studentCount: number;
  eventCount: number;
};

export type SemesterDetails = SemesterWithStats & {
  timetableCount: number;
};

export type SemesterCourse = {
  id: number;
  name: string;
  code: string;
  credits: number | string;
  program: {
    id: number;
    name: string;
  };
  lecturer: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
};

export type SemesterStudent = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  registrationNumber: string;
  program: {
    id: number;
    name: string;
  };
};

export type SemesterEvent = {
  id: number;
  title: string;
  eventType: string;
  startDate: Date;
  endDate: Date;
  location: string | null;
};

export type SemesterTimetable = {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  course: {
    id: number;
    name: string;
    code: string;
  };
  lecturer: {
    id: number;
    firstName: string;
    lastName: string;
  };
};

export type StudentWithDetails = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  registrationNumber: string;
  studentNumber: string;
  program: {
    id: number;
    name: string;
  };
  department: {
    id: number;
    name: string;
  };
  currentSemester: {
    id: number;
    name: string;
  };
  createdAt?: Date;  // Made optional
  updatedAt?: Date;  // Made optional
};

// Get all semesters with statistics (same as before)
export async function getAllSemesters(): Promise<SemesterWithStats[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Get base semester data
  const semestersData = await db
    .select()
    .from(semesters)
    .orderBy(asc(semesters.startDate));

  // Get counts for each semester
  const semestersWithStats = await Promise.all(
    semestersData.map(async (semester) => {
      const [courseCount, studentCount, eventCount] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(courses)
          .where(eq(courses.semesterId, semester.id)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(enrollments)
          .where(eq(enrollments.semesterId, semester.id)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(academicCalendarEvents)
          .where(eq(academicCalendarEvents.semesterId, semester.id)),
      ]);

      return {
        ...semester,
        courseCount: courseCount[0].count,
        studentCount: studentCount[0].count,
        eventCount: eventCount[0].count,
      };
    })
  );

  return semestersWithStats;
}

// Fixed getSemesterDetails with fully qualified column references
export async function getSemesterDetails(semesterId: number): Promise<SemesterDetails> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

    const studentCount = await db
    .select({ count: sql<number>`count(DISTINCT ${students.id})` })
    .from(students)
    .innerJoin(enrollments, eq(enrollments.studentId, students.id))
    .where(eq(enrollments.semesterId, semesterId))
    .then(res => res[0].count);

  const semester = await db
    .select({
      id: semesters.id,
      name: semesters.name,
      startDate: semesters.startDate,
      endDate: semesters.endDate,
      courseCount: sql<number>`(
        SELECT COUNT(*) FROM ${courses} 
        WHERE ${courses.semesterId} = ${semesters.id}
      )`.as('course_count'),
      // Fixed student count query - count DISTINCT students
      studentCount: sql<number>`(
        SELECT COUNT(DISTINCT ${enrollments.studentId}) 
        FROM ${enrollments}
        WHERE ${enrollments.semesterId} = ${semesters.id}
      )`.as('student_count'),
      eventCount: sql<number>`(
        SELECT COUNT(*) FROM ${academicCalendarEvents} 
        WHERE ${academicCalendarEvents.semesterId} = ${semesters.id}
      )`.as('event_count'),
      timetableCount: sql<number>`(
        SELECT COUNT(*) FROM ${timetables} 
        WHERE ${timetables.semesterId} = ${semesters.id}
      )`.as('timetable_count'),
    })
    .from(semesters)
    .where(eq(semesters.id, semesterId))
    .then((res) => res[0]);

  if (!semester) {
    throw new ActionError('Semester not found');
  }

  return {
   ...semester,
  studentCount
  };
}

// Add this new function to get unique students in a semester
export async function getSemesterStudents(semesterId: number): Promise<StudentWithDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      email: students.email,
      registrationNumber: students.registrationNumber,
      studentNumber: students.studentNumber,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
      // Include program and department details
      program: {
        id: programs.id,
        name: programs.name,
      },
      department: {
        id: departments.id,
        name: departments.name,
      },
      currentSemester: {
        id: semesters.id,
        name: semesters.name,
      },
    })
    .from(students)
    .innerJoin(enrollments, eq(enrollments.studentId, students.id))
    .innerJoin(programs, eq(programs.id, students.programId))
    .innerJoin(departments, eq(departments.id, students.departmentId))
    .innerJoin(semesters, eq(semesters.id, students.currentSemesterId))
    .where(eq(enrollments.semesterId, semesterId))
    .groupBy(
      students.id, 
      programs.id, 
      departments.id, 
      semesters.id,
      students.createdAt,
      students.updatedAt
    )
    .orderBy(asc(students.lastName), asc(students.firstName));
}

// Create a new semester (fixed date comparisons)
export async function createSemester(
  name: string,
  startDate: string,
  endDate: string
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    throw new ActionError('End date must be after start date');
  }

  // Check for overlapping semesters using direct SQL comparison
  const overlappingSemester = await db
    .select()
    .from(semesters)
    .where(
      or(
        sql`${semesters.startDate}::date < ${endDate}::date AND ${semesters.endDate}::date > ${startDate}::date`,
        sql`${semesters.startDate}::date = ${startDate}::date`,
        sql`${semesters.endDate}::date = ${endDate}::date`
      )
    )
    .then((res) => res[0]);

  if (overlappingSemester) {
    throw new ActionError(`Semester dates overlap with "${overlappingSemester.name}"`);
  }

  const newSemester = await db
    .insert(semesters)
    .values({
      name,
      startDate,
      endDate,
    })
    .returning();

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'create',
    targetTable: 'semesters',
    targetId: newSemester[0].id,
    description: `Created semester "${name}" (${startDate} to ${endDate})`,
  });

  revalidatePath('/dashboard/admin/semesters');
  return newSemester[0];
}

// Update semester details (fixed date comparisons)
export async function updateSemester(
  semesterId: number,
  data: {
    name?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Get current semester dates if not provided
  const currentSemester = await db
    .select()
    .from(semesters)
    .where(eq(semesters.id, semesterId))
    .then((res) => res[0]);

  if (!currentSemester) {
    throw new ActionError('Semester not found');
  }

  const start = data.startDate ?? currentSemester.startDate;
  const end = data.endDate ?? currentSemester.endDate;

  // Validate dates if both are provided
  if (new Date(start) >= new Date(end)) {
    throw new ActionError('End date must be after start date');
  }

  // Check for overlapping semesters (excluding current semester)
  const overlappingSemester = await db
    .select()
    .from(semesters)
    .where(
      and(
        ne(semesters.id, semesterId),
        or(
          sql`${semesters.startDate}::date < ${end}::date AND ${semesters.endDate}::date > ${start}::date`,
          sql`${semesters.startDate}::date = ${start}::date`,
          sql`${semesters.endDate}::date = ${end}::date`
        )
      )
    )
    .then((res) => res[0]);

  if (overlappingSemester) {
    throw new ActionError(`Semester dates overlap with "${overlappingSemester.name}"`);
  }

  const updatedSemester = await db
    .update(semesters)
    .set({
      ...data,
    })
    .where(eq(semesters.id, semesterId))
    .returning();

  if (updatedSemester.length === 0) {
    throw new ActionError('Semester not found');
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'update',
    targetTable: 'semesters',
    targetId: semesterId,
    description: `Updated semester details`,
  });

  revalidatePath('/dashboard/admin/semesters');
  revalidatePath(`/dashboard/admin/semesters/${semesterId}`);
  return updatedSemester[0];
}

// Get all courses in a semester (same as before)
export async function getSemesterCourses(
  semesterId: number,
): Promise<SemesterCourse[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: courses.id,
      name: courses.name,
      code: courses.code,
      credits: courses.credits,
      program: {
        id: programs.id,
        name: programs.name,
      },
      lecturer: {
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
      },
    })
    .from(courses)
    .innerJoin(programs, eq(programs.id, courses.programId))
    .leftJoin(staff, eq(staff.id, courses.lecturerId))
    .where(eq(courses.semesterId, semesterId))
    .orderBy(asc(courses.name));
}


// Get all events in a semester (same as before)
export async function getSemesterEvents(
  semesterId: number,
): Promise<SemesterEvent[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: academicCalendarEvents.id,
      title: academicCalendarEvents.title,
      eventType: academicCalendarEvents.eventType,
      startDate: academicCalendarEvents.startDate,
      endDate: academicCalendarEvents.endDate,
      location: academicCalendarEvents.location,
    })
    .from(academicCalendarEvents)
    .where(eq(academicCalendarEvents.semesterId, semesterId))
    .orderBy(asc(academicCalendarEvents.startDate));
}

// Get all timetables in a semester (same as before)
export async function getSemesterTimetables(
  semesterId: number,
): Promise<SemesterTimetable[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: timetables.id,
      dayOfWeek: timetables.dayOfWeek,
      startTime: timetables.startTime,
      endTime: timetables.endTime,
      room: timetables.room,
      course: {
        id: courses.id,
        name: courses.name,
        code: courses.code,
      },
      lecturer: {
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
      },
    })
    .from(timetables)
    .innerJoin(courses, eq(courses.id, timetables.courseId))
    .innerJoin(staff, eq(staff.id, timetables.lecturerId))
    .where(eq(timetables.semesterId, semesterId))
    .orderBy(
      asc(timetables.dayOfWeek),
      asc(timetables.startTime)
    );
}

// Delete a semester (same as before)
export async function deleteSemester(semesterId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Check if semester has any courses, enrollments, or events
  const [courseCount, enrollmentCount, eventCount, timetableCount] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(courses)
      .where(eq(courses.semesterId, semesterId))
      .then((res) => res[0].count),
    db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(eq(enrollments.semesterId, semesterId))
      .then((res) => res[0].count),
    db
      .select({ count: sql<number>`count(*)` })
      .from(academicCalendarEvents)
      .where(eq(academicCalendarEvents.semesterId, semesterId))
      .then((res) => res[0].count),
    db
      .select({ count: sql<number>`count(*)` })
      .from(timetables)
      .where(eq(timetables.semesterId, semesterId))
      .then((res) => res[0].count),
  ]);

  if (courseCount > 0 || enrollmentCount > 0 || eventCount > 0 || timetableCount > 0) {
    throw new ActionError(
      'Cannot delete semester with courses, enrollments, events, or timetables'
    );
  }

  const semester = await db
    .delete(semesters)
    .where(eq(semesters.id, semesterId))
    .returning();

  if (semester.length === 0) {
    throw new ActionError('Semester not found');
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'delete',
    targetTable: 'semesters',
    targetId: semesterId,
    description: `Deleted semester "${semester[0].name}"`,
  });

  revalidatePath('/dashboard/admin/semesters');
  return { success: true };
}