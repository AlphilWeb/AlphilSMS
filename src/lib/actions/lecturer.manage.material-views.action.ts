'use server';

import { db } from '@/lib/db';
import { materialViews, courseMaterials, students, courses } from '@/lib/db/schema';
import {  eq, desc, count, sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
// import { revalidatePath } from 'next/cache';

// Types
export type MaterialViewWithDetails = {
  id: number;
  viewedAt: Date;
  interactionType: string;
  material: {
    id: number;
    title: string;
    type: string;
  };
  student: {
    id: number;
    firstName: string;
    lastName: string;
    registrationNumber: string;
  };
  course: {
    id: number;
    name: string;
    code: string;
  };
};

export type MaterialViewStats = {
  materialId: number;
  title: string;
  type: string;
  totalViews: number;
  uniqueStudents: number;
  lastViewed: Date | null;
};

// Get all material views for courses taught by the lecturer
export async function getMaterialViews() {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: materialViews.id,
      viewedAt: materialViews.viewedAt,
      interactionType: materialViews.interactionType,
      material: {
        id: courseMaterials.id,
        title: courseMaterials.title,
        type: courseMaterials.type,
      },
      student: {
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        registrationNumber: students.registrationNumber,
      },
      course: {
        id: courses.id,
        name: courses.name,
        code: courses.code,
      },
    })
    .from(materialViews)
    .innerJoin(courseMaterials, eq(courseMaterials.id, materialViews.materialId))
    .innerJoin(courses, eq(courses.id, courseMaterials.courseId))
    .innerJoin(students, eq(students.id, materialViews.studentId))
    .orderBy(desc(materialViews.viewedAt));
}

// Get material view statistics
export async function getMaterialViewStats() {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      materialId: courseMaterials.id,
      title: courseMaterials.title,
      type: courseMaterials.type,
      totalViews: count(materialViews.id),
      uniqueStudents: count(sql`DISTINCT ${materialViews.studentId}`),
      lastViewed: sql<Date>`MAX(${materialViews.viewedAt})`,
    })
    .from(courseMaterials)
    .leftJoin(materialViews, eq(materialViews.materialId, courseMaterials.id))
    .innerJoin(courses, eq(courses.id, courseMaterials.courseId))
    .groupBy(courseMaterials.id)
    .orderBy(desc(sql`MAX(${materialViews.viewedAt})`));
}