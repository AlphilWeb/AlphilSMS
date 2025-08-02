// src/actions/registrar/semester.actions.ts
'use server';

import { db, testConnection } from '@/lib/db';
import { semesters, userLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getAllSemesters() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized');
    }

    return await db.query.semesters.findMany({
      orderBy: (semesters, { desc }) => [desc(semesters.startDate)]
    });
  } catch (error) {
    console.error('Error in getAllSemesters:', error);
    throw new Error('Failed to fetch semesters');
  }
}

export async function getSemesterById(id: number) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized');
    }

    const semester = await db.query.semesters.findFirst({
      where: eq(semesters.id, id)
    });

    if (!semester) {
      throw new Error('Semester not found');
    }

    return semester;
  } catch (error) {
    console.error('Error in getSemesterById:', error);
    throw new Error('Failed to fetch semester');
  }
}

export async function createSemester(data: {
  name: string;
  startDate: string;
  endDate: string;
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

    const [newSemester] = await db.insert(semesters).values(data).returning();

    // Log the action
    await db.insert(userLogs).values({
      userId: authUser.userId,
      action: 'create',
      targetTable: 'semesters',
      targetId: newSemester.id,
      description: `Created semester ${newSemester.name}`
    });

    revalidatePath('/dashboard/registrar/semesters');
    return newSemester;
  } catch (error) {
    console.error('Error in createSemester:', error);
    throw new Error('Failed to create semester');
  }
}

export async function updateSemester(
  id: number,
  data: {
    name: string;
    startDate: string;
    endDate: string;
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

    const [updatedSemester] = await db
      .update(semesters)
      .set(data)
      .where(eq(semesters.id, id))
      .returning();

    // Log the action
    await db.insert(userLogs).values({
      userId: authUser.userId,
      action: 'update',
      targetTable: 'semesters',
      targetId: id,
      description: `Updated semester ${updatedSemester.name}`
    });

    revalidatePath('/dashboard/registrar/semesters');
    return updatedSemester;
  } catch (error) {
    console.error('Error in updateSemester:', error);
    throw new Error('Failed to update semester');
  }
}

export async function deleteSemester(id: number) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized');
    }

    const semester = await db.query.semesters.findFirst({
      where: eq(semesters.id, id),
      columns: {
        name: true
      }
    });

    if (!semester) {
      throw new Error('Semester not found');
    }

    await db.delete(semesters).where(eq(semesters.id, id));

    // Log the action
    await db.insert(userLogs).values({
      userId: authUser.userId,
      action: 'delete',
      targetTable: 'semesters',
      targetId: id,
      description: `Deleted semester ${semester.name}`
    });

    revalidatePath('/dashboard/registrar/semesters');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteSemester:', error);
    throw new Error('Failed to delete semester');
  }
}