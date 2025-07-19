'use server';

import { db } from '@/lib/db';
import { enrollments } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

// Normalize role capitalization
function normalizeRole(role: string | undefined): string {
  return role
    ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    : '';
}

// Check role for registrar access
function requireRegistrarRole(role: string | undefined) {
  if (normalizeRole(role) !== 'Registrar') {
    throw new Error('Unauthorized');
  }
}

export async function enrollStudent(studentId: number, courseId: number, semesterId: number) {
  const authUser = await getAuthUser();
  requireRegistrarRole(authUser?.role);

  return db.insert(enrollments)
    .values({
      studentId,
      courseId,
      semesterId
    })
    .onConflictDoNothing();
}

export async function bulkEnrollStudents(studentIds: number[], courseId: number, semesterId: number) {
  const authUser = await getAuthUser();
  requireRegistrarRole(authUser?.role);

  return db.transaction(async (tx) => {
    for (const studentId of studentIds) {
      await tx.insert(enrollments)
        .values({
          studentId,
          courseId,
          semesterId
        })
        .onConflictDoNothing();
    }
  });
}

export async function getCourseEnrollments(courseId: number, semesterId: number) {
  const authUser = await getAuthUser();
  requireRegistrarRole(authUser?.role);

  return db.query.enrollments.findMany({
    where: and(
      eq(enrollments.courseId, courseId),
      eq(enrollments.semesterId, semesterId)
    ),
    with: {
      student: true,
      grade: true
    }
  });
}
