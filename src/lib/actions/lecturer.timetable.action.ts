'use server';

import { db } from '@/lib/db';
import { timetables, courses, semesters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
// import { checkPermission } from '@/lib/rbac';

export async function getMyTimetable() {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role.toLowerCase() !== 'lecturer') {
      throw new Error('Unauthorized access');
    }

  return db
    .select({
      day: timetables.dayOfWeek,
      start: timetables.startTime,
      end: timetables.endTime,
      room: timetables.room,
      course: courses.name,
      courseCode: courses.code,
      semester: semesters.name,
    })
    .from(timetables)
    .innerJoin(courses, eq(courses.id, timetables.courseId))
    .innerJoin(semesters, eq(semesters.id, timetables.semesterId))
    .where(eq(timetables.lecturerId, authUser?.userId));
}
