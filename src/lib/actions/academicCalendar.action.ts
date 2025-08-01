'use server';

import { db } from '@/lib/db/index';
import { semesters } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function getAcademicCalendar() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized: You must be logged in.');
    }

    // Get all semesters ordered by start date (newest first)
    const calendarData = await db.query.semesters.findMany({
      orderBy: [desc(semesters.startDate)],
      columns: {
        id: true,
        name: true,
        startDate: true,
        endDate: true
      }
    });

    // Convert dates to ISO strings for serialization
    return calendarData.map(semester => ({
      ...semester,
      startDate: semester.startDate.toString(),
      endDate: semester.endDate.toString()
    }));
  } catch (error) {
    console.error('[GET_ACADEMIC_CALENDAR_ERROR]', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch academic calendar data'
    );
  }
}