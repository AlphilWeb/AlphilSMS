// lib/actions/studentTimetable.actions.ts
'use server';

import { db } from '@/lib/db/index';
import { timetables, courses, staff, semesters, enrollments, students } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function getStudentTimetable() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.userId) {
      throw new Error('Unauthorized: You must be logged in.');
    }

    // First get the student's current semester ID
    const student = await db.query.students.findFirst({
      where: eq(students.userId, authUser.userId),
      columns: {
        id: true,
        currentSemesterId: true
      }
    });

    if (!student) {
      throw new Error('Student record not found');
    }

    // Then get the enrolled courses for this semester
    const enrolledCourses = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.studentId, student.id),
        eq(enrollments.semesterId, student.currentSemesterId)
      ),
      columns: {
        courseId: true
      }
    });

    if (enrolledCourses.length === 0) {
      return []; // No enrolled courses means no timetable
    }

    // Get timetable for enrolled courses in current semester
    const timetableData = await db
      .select({
        id: timetables.id,
        courseId: timetables.courseId,
        courseName: courses.name,
        courseCode: courses.code,
        dayOfWeek: timetables.dayOfWeek,
        startTime: timetables.startTime,
        endTime: timetables.endTime,
        room: timetables.room,
        lecturer: {
          firstName: staff.firstName,
          lastName: staff.lastName
        }
      })
      .from(timetables)
      .innerJoin(courses, eq(timetables.courseId, courses.id))
      .innerJoin(staff, eq(timetables.lecturerId, staff.id))
      .where(
        and(
          eq(timetables.semesterId, student.currentSemesterId),
          inArray(timetables.courseId, enrolledCourses.map(e => e.courseId))
        )
      )
      .orderBy(timetables.dayOfWeek, timetables.startTime);

    return timetableData;
  } catch (error) {
    console.error('[GET_STUDENT_TIMETABLE_ERROR]', error);
    
    if (error instanceof Error && error.message.includes('column')) {
      throw new Error('Database query error. Please check your schema.');
    }

    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch timetable data'
    );
  }
}