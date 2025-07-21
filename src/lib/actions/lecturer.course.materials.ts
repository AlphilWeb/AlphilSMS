'use server';

import { db } from '@/lib/db';
import { courseMaterials } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function getMyCourseMaterials() {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role.toLowerCase() !== 'lecturer') {
      throw new Error('Unauthorized access');
    }

  return db
    .select()
    .from(courseMaterials)
    .where(eq(courseMaterials.uploadedById, authUser.userId));
}

export async function uploadMaterial(data: {
  courseId: number;
  title: string;
  type: string;
  fileUrl: string;
}) {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role.toLowerCase() !== 'lecturer') {
      throw new Error('Unauthorized access');
    }

  return db.insert(courseMaterials).values({
    ...data,
    uploadedById: authUser?.userId,
  });
}

export async function deleteMaterial(materialId: number) {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role.toLowerCase() !== 'lecturer') {
      throw new Error('Unauthorized access');
    }

  return db
    .delete(courseMaterials)
    .where(
      and(
        eq(courseMaterials.id, materialId),
        eq(courseMaterials.uploadedById, authUser?.userId)
      )
    );
}
