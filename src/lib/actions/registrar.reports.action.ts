'use server';

import { db } from '@/lib/db';
import { 
  students, 
  enrollments, 
  programs, 
  semesters,
  transcripts
} from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

// Normalize role capitalization
function normalizeRole(role: string | undefined): string {
  return role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : '';
}

// Check role for registrar access
function requireRegistrarRole(role: string | undefined) {
  if (normalizeRole(role) !== 'Registrar') {
    throw new Error('Unauthorized');
  }
}

export async function getEnrollmentStatistics(semesterId?: number) {
  const authUser = await getAuthUser();
  requireRegistrarRole(authUser?.role);

  const targetSemester = semesterId 
    ? await db.query.semesters.findFirst({
        where: () => eq(semesters.id, semesterId)
      })
    : await db.query.semesters.findFirst({
        orderBy: (semesters, { desc }) => [desc(semesters.startDate)],
      });

  if (!targetSemester) return null;

  return db.select({
    program: programs.name,
    count: sql<number>`count(${enrollments.id})`
  })
  .from(enrollments)
  .leftJoin(students, eq(enrollments.studentId, students.id))
  .leftJoin(programs, eq(students.programId, programs.id))
  .where(eq(enrollments.semesterId, targetSemester.id))
  .groupBy(programs.name);
}

export async function getGraduationList(programId: number, semesterId: number) {
  const authUser = await getAuthUser();
  requireRegistrarRole(authUser?.role);

  return db.query.students.findMany({
    where: and(
      eq(students.programId, programId),
      eq(students.currentSemesterId, semesterId)
    ),
    with: {
      user: true,
      program: true,
      transcripts: {
        where: eq(transcripts.semesterId, semesterId)
      }
    }
  });
}
