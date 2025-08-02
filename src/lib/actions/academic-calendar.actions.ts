// src/lib/actions/academic-calendar.actions.ts
'use server';

import { db } from '@/lib/db';
import { 
  academicCalendarEvents, 
  semesters, 
  courses, 
  timetables,
  enrollments,
  students,
  staff
} from '@/lib/db/schema';

import {  isWithinInterval } from 'date-fns';
import { RRule } from 'rrule';

// Types
export type CalendarEvent = {
  id: number;
  title: string;
  description: string | null | undefined;
  start: Date;
  end: Date;
  type: string;
  courseCode?: string;
  location: string | null;
  isRecurring: boolean | null;
  recurringPattern: string | null;
};
import { 
  and, 
  eq, 
  gte, 
  lte, 
  or, 
  between, 
  asc, 
  desc,
  inArray,
  sql
} from 'drizzle-orm';
export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

/**
 * Get all academic semesters ordered by start date
 */
export async function getAllSemesters() {
  return await db
    .select()
    .from(semesters)
    .orderBy(desc(semesters.startDate));
}

/**
 * Get current active semester based on today's date
 */
export async function getCurrentSemester() {
  const today = new Date();
  
  const res = await db
    .select()
    .from(semesters)
    .where(
      and(
        // Convert the today Date object to an ISO string
        lte(semesters.startDate, today.toISOString()),
        gte(semesters.endDate, today.toISOString())
      )
    );

  return res[0] ?? null;
}

/**
 * Get semester by ID
 */
export async function getSemesterById(id: number) {
  const res = await db
    .select()
    .from(semesters)
    .where(eq(semesters.id, id));

  return res[0] ?? null;
}

/**
 * Get all calendar events for a semester
 */
export async function getSemesterEvents(semesterId: number) {
  return await db
    .select()
    .from(academicCalendarEvents)
    .where(eq(academicCalendarEvents.semesterId, semesterId))
    .orderBy(asc(academicCalendarEvents.startDate));
}

/**
 * Get timetable events for a student or lecturer
 */
// lib/actions/academic-calendar.actions.ts
// (Assuming necessary imports are present)

async function getTimetableEvents(
  semesterId: number,
  userId?: number
): Promise<CalendarEvent[]> {
  // Start with a base query and an array of conditions
  let query = db
    .select({
      id: timetables.id,
      title: courses.name,
      description: courses.description,
      start: sql<Date>`(DATE_TRUNC('day', ${semesters.startDate}::timestamp) + ${timetables.startTime}::time)`.as('start'),
      end: sql<Date>`(DATE_TRUNC('day', ${semesters.startDate}::timestamp) + ${timetables.endTime}::time)`.as('end'),
      type: sql<string>`'course'`.as('type'),
      courseCode: courses.code,
      location: timetables.room,
      isRecurring: sql<boolean>`true`.as('isRecurring'),
      recurringPattern: sql<string>`CONCAT('RRULE:FREQ=WEEKLY;BYDAY=', ${timetables.dayOfWeek})`.as('recurringPattern')
    })
    .from(timetables)
    .innerJoin(courses, eq(timetables.courseId, courses.id))
    .innerJoin(semesters, eq(timetables.semesterId, semesters.id));
  
  // Create an array to hold all the where clauses
  const conditions = [
    eq(timetables.semesterId, semesterId)
  ];

  if (userId) {
    const student = await db
      .select()
      .from(students)
      .where(eq(students.userId, userId))
      .then(res => res[0]);

    if (student) {
      // For a student, join with enrollments and add the studentId condition
      query = query.innerJoin(enrollments, eq(timetables.courseId, enrollments.courseId));
      conditions.push(eq(enrollments.studentId, student.id));
    } else {
      const lecturer = await db
        .select()
        .from(staff)
        .where(eq(staff.userId, userId))
        .then(res => res[0]);

      if (lecturer) {
        // For a lecturer, just add the lecturerId condition
        conditions.push(eq(courses.lecturerId, lecturer.id));
      }
    }
  }

  // Apply all the conditions at once using 'and()'
  const res = await query.where(and(...conditions));

  // Now, you can process the result and return it
  return res as CalendarEvent[];
}

/**
 * Expand recurring events between two dates
 */
function expandRecurringEvents(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  const expandedEvents: CalendarEvent[] = [];

  for (const event of events) {
    if (!event.isRecurring) {
      if (isWithinInterval(event.start, { start: startDate, end: endDate })) {
        expandedEvents.push(event);
      }
      continue;
    }

    try {
      const rule = RRule.fromString(event.recurringPattern || '');
      const dates = rule.between(startDate, endDate, true);

      for (const date of dates) {
        const duration = event.end.getTime() - event.start.getTime();
        const eventStart = new Date(date);
        const eventEnd = new Date(date.getTime() + duration);

        expandedEvents.push({
          ...event,
          id: event.id * 1000 + date.getTime(),
          start: eventStart,
          end: eventEnd
        });
      }
    } catch (error) {
      console.error('Error parsing RRULE:', error);
      if (isWithinInterval(event.start, { start: startDate, end: endDate })) {
        expandedEvents.push(event);
      }
    }
  }

  return expandedEvents;
}

/**
 * Get all events for a date range
 */
export async function getEventsForRange(
  startDate: Date,
  endDate: Date,
  userId?: number
): Promise<CalendarEvent[]> {
  const relevantSemesters = await db
    .select()
    .from(semesters)
    .where(
      or(
        between(semesters.startDate, startDate.toISOString(), endDate.toISOString()),
        between(semesters.endDate, startDate.toISOString(), endDate.toISOString()),
        and(
          lte(semesters.startDate, startDate.toISOString()),
          gte(semesters.endDate, endDate.toISOString())
        )
      )
    );

  if (relevantSemesters.length === 0) {
    return [];
  }

  // --- Your new snippet starts here ---
  const semesterIds = relevantSemesters.map(s => s.id);

const calendarEvents = await db
  .select({
    id: academicCalendarEvents.id,
    title: academicCalendarEvents.title,
    description: academicCalendarEvents.description,
    start: sql<Date>`${academicCalendarEvents.startDate}`,
    end: sql<Date>`${academicCalendarEvents.endDate}`,
    type: academicCalendarEvents.eventType,
    location: academicCalendarEvents.location,
    isRecurring: academicCalendarEvents.isRecurring,
    recurringPattern: academicCalendarEvents.recurringPattern
  })
  .from(academicCalendarEvents)
  .where(inArray(academicCalendarEvents.semesterId, semesterIds))
  .orderBy(asc(academicCalendarEvents.startDate));

  const timetableEventsRaw = await Promise.all(
    relevantSemesters.map(semester => getTimetableEvents(semester.id, userId))
  );
  const timetableEvents = timetableEventsRaw.flat();

  const allEvents: CalendarEvent[] = [
    ...calendarEvents,
    ...timetableEvents,
    ...relevantSemesters.map(semester => ({
      id: -semester.id,
      title: `${semester.name} Semester`,
      description: semester.id === relevantSemesters[0].id ? 'Semester period' : undefined,
      start: new Date(semester.startDate),
      end: new Date(semester.endDate),
      type: 'semester',
      location: null, // Fixed: use null for optional string | null
      isRecurring: false,
      recurringPattern: null,
    }))
  ];

  const expandedEvents = expandRecurringEvents(allEvents, startDate, endDate);

  return expandedEvents.filter(event =>
    isWithinInterval(event.start, { start: startDate, end: endDate }) ||
    isWithinInterval(event.end, { start: startDate, end: endDate })
  );
}
/**
 * Get important academic dates for a semester
 */
export async function getKeyAcademicDates(semesterId: number) {
  return await db
    .select()
    .from(academicCalendarEvents)
    .where(
      and(
        eq(academicCalendarEvents.semesterId, semesterId),
        or(
          eq(academicCalendarEvents.eventType, 'exam'),
          eq(academicCalendarEvents.eventType, 'registration'),
          eq(academicCalendarEvents.eventType, 'holiday')
        )
      )
    )
    .orderBy(asc(academicCalendarEvents.startDate));
}
