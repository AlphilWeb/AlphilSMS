'use server';

import { db } from '@/lib/db';
import { courses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

// Utility to normalize role casing
function normalizeRole(role: string | undefined): string {
  return role
    ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    : '';
}

function requireRegistrarRole(role: string | undefined) {
  if (normalizeRole(role) !== 'Registrar') {
    throw new Error('Unauthorized');
  }
}

export async function getProgramsList() {
  const authUser = await getAuthUser();
  requireRegistrarRole(authUser?.role);

  return db.query.programs.findMany({
    with: {
      department: true,
    },
  });
}

export async function getProgramCourses(programId: number) {
  const authUser = await getAuthUser();
  requireRegistrarRole(authUser?.role);

  return db.query.courses.findMany({
    where: eq(courses.programId, programId),
    with: {
      semester: true,
    },
  });
}

export async function getCurrentSemesterCourses() {
  const authUser = await getAuthUser();
  requireRegistrarRole(authUser?.role);

  const currentSemester = await db.query.semesters.findFirst({
    orderBy: (semesters, { desc }) => [desc(semesters.startDate)],
  });

  if (!currentSemester) return [];

  return db.query.courses.findMany({
    where: eq(courses.semesterId, currentSemester.id),
    with: {
      program: true,
    },
  });
}
