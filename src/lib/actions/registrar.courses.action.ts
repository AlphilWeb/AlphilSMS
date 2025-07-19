// src/actions/registrar/course.actions.ts
'use server';

import { db, testConnection } from '@/lib/db';
import { courses, programs, semesters, userLogs } from '@/lib/db/schema';
import { and, eq, sql, desc, count, isNull } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getAllCourses() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized');
    }

    return await db.query.courses.findMany({
      with: {
        program: {
          columns: {
            name: true,
            code: true,
          }
        },
        semester: {
          columns: {
            name: true,
          }
        }
      },
      orderBy: (courses, { asc }) => [asc(courses.name)]
    });
  } catch (error) {
    console.error('Error in getAllCourses:', error);
    throw new Error('Failed to fetch courses');
  }
}

export async function getCourseById(id: number) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized');
    }

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        program: {
          columns: {
            name: true,
          }
        },
        semester: {
          columns: {
            name: true,
          }
        }
      }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  } catch (error) {
    console.error('Error in getCourseById:', error);
    throw new Error('Failed to fetch course');
  }
}

export async function createCourse(data: {
  programId: number;
  semesterId: number;
  name: string;
  code: string;
  credits: number;
  description?: string;
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

    const [newCourse] = await db.insert(courses).values({
    ...data,
    credits: data.credits.toString(), // Fix here
    }).returning();
    // Log the action
    await db.insert(userLogs).values({
      userId: authUser.userId,
      action: 'create',
      targetTable: 'courses',
      targetId: newCourse.id,
      description: `Created course ${newCourse.name} (${newCourse.code})`
    });

    revalidatePath('/registrar/courses');
    return newCourse;
  } catch (error) {
    console.error('Error in createCourse:', error);
    throw new Error('Failed to create course');
  }
}

export async function updateCourse(
  id: number,
  data: {
    programId: number;
    semesterId: number;
    name: string;
    code: string;
    credits: number;
    description?: string;
  }
) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
          throw new Error('Unauthorized');
    }

    const [updatedCourse] = await db
    .update(courses)
    .set({
        ...data,
        credits: data.credits.toString(), // Fix here
    })
    .where(eq(courses.id, id))
    .returning();

    // Log the action
    await db.insert(userLogs).values({
      userId: authUser.userId,
      action: 'update',
      targetTable: 'courses',
      targetId: id,
      description: `Updated course ${updatedCourse.name} (${updatedCourse.code})`
    });

    revalidatePath('/registrar/courses');
    return updatedCourse;
  } catch (error) {
    console.error('Error in updateCourse:', error);
    throw new Error('Failed to update course');
  }
}

export async function deleteCourse(id: number) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
      throw new Error('Unauthorized');
    }

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, id),
      columns: {
        name: true,
        code: true
      }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
      throw new Error('Course not found');
    }

    await db.delete(courses).where(eq(courses.id, id));

    // Log the action
    await db.insert(userLogs).values({
      userId: authUser.userId,
      action: 'delete',
      targetTable: 'courses',
      targetId: id,
      description: `Deleted course ${course.name} (${course.code})`
    });

    revalidatePath('/registrar/courses');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteCourse:', error);
    throw new Error('Failed to delete course');
  }
}

export async function getProgramsForSelect() {
  try {
    return await db.query.programs.findMany({
      columns: {
        id: true,
        name: true,
        code: true
      },
      orderBy: (programs, { asc }) => [asc(programs.name)]
    });
  } catch (error) {
    console.error('Error in getProgramsForSelect:', error);
    throw new Error('Failed to fetch programs');
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