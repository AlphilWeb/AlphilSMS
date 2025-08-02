// src/actions/registrar/timetable.actions.ts
'use server';

import { db, testConnection } from '@/lib/db';
import { timetables, userLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getAllTimetables() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized');
    }

    return await db.query.timetables.findMany({
      with: {
        semester: {
          columns: {
            name: true,
          }
        },
        course: {
          columns: {
            name: true,
            code: true,
          }
        },
        lecturer: {
          columns: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: (timetables, { asc }) => [asc(timetables.dayOfWeek), asc(timetables.startTime)]
    });
  } catch (error) {
    console.error('Error in getAllTimetables:', error);
    throw new Error('Failed to fetch timetables');
  }
}

export async function getTimetableById(id: number) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized');
    }

    const timetable = await db.query.timetables.findFirst({
      where: eq(timetables.id, id),
      with: {
        semester: true,
        course: true,
        lecturer: true
      }
    });

    if (!timetable) {
      throw new Error('Timetable not found');
    }

    return timetable;
  } catch (error) {
    console.error('Error in getTimetableById:', error);
    throw new Error('Failed to fetch timetable');
  }
}

export async function createTimetable(data: {
  semesterId: number;
  courseId: number;
  lecturerId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
}) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized');
    }

    const [newTimetable] = await db.insert(timetables).values(data).returning();

    // Log the action
    await db.insert(userLogs).values({
      userId: authUser.userId,
      action: 'create',
      targetTable: 'timetables',
      targetId: newTimetable.id,
      description: `Created timetable entry for ${data.dayOfWeek}`
    });

    revalidatePath('/dashboard/registrar/timetables');
    return newTimetable;
  } catch (error) {
    console.error('Error in createTimetable:', error);
    throw new Error('Failed to create timetable');
  }
}

export async function updateTimetable(
  id: number,
  data: {
    semesterId: number;
    courseId: number;
    lecturerId: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room?: string;
  }
) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized');
    }

    const [updatedTimetable] = await db
      .update(timetables)
      .set(data)
      .where(eq(timetables.id, id))
      .returning();

    // Log the action
    await db.insert(userLogs).values({
      userId: authUser.userId,
      action: 'update',
      targetTable: 'timetables',
      targetId: id,
      description: `Updated timetable entry for ${data.dayOfWeek}`
    });

    revalidatePath('/dashboard/registrar/timetables');
    return updatedTimetable;
  } catch (error) {
    console.error('Error in updateTimetable:', error);
    throw new Error('Failed to update timetable');
  }
}

export async function deleteTimetable(id: number) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized');
    }

    const timetable = await db.query.timetables.findFirst({
      where: eq(timetables.id, id),
      columns: {
        dayOfWeek: true,
        startTime: true
      }
    });

    if (!timetable) {
      throw new Error('Timetable not found');
    }

    await db.delete(timetables).where(eq(timetables.id, id));

    // Log the action
    await db.insert(userLogs).values({
      userId: authUser.userId,
      action: 'delete',
      targetTable: 'timetables',
      targetId: id,
      description: `Deleted timetable entry for ${timetable.dayOfWeek} ${timetable.startTime}`
    });

    revalidatePath('/dashboard/registrar/timetables');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteTimetable:', error);
    throw new Error('Failed to delete timetable');
  }
}

export async function getSemestersForSelect() {
  try {
    return await db.query.semesters.findMany({
      columns: {
        id: true,
        name: true
      },
      orderBy: (semesters, { desc }) => [desc(semesters.startDate)]
    });
  } catch (error) {
    console.error('Error in getSemestersForSelect:', error);
    throw new Error('Failed to fetch semesters');
  }
}

export async function getCoursesForSelect() {
  try {
    return await db.query.courses.findMany({
      columns: {
        id: true,
        name: true,
        code: true
      },
      orderBy: (courses, { asc }) => [asc(courses.name)]
    });
  } catch (error) {
    console.error('Error in getCoursesForSelect:', error);
    throw new Error('Failed to fetch courses');
  }
}

export async function getLecturersForSelect() {
  try {
    return await db.query.staff.findMany({
      columns: {
        id: true,
        firstName: true,
        lastName: true
      },
      orderBy: (staff, { asc }) => [asc(staff.lastName)]
    });
  } catch (error) {
    console.error('Error in getLecturersForSelect:', error);
    throw new Error('Failed to fetch lecturers');
  }
}