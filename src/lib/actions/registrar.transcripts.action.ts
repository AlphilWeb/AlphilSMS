'use server';

import { db } from '@/lib/db';
import { transcripts, enrollments } from '@/lib/db/schema';
import { and, eq, desc, isNull } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function generateTranscript(studentId: number, semesterId: number) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role?.toLowerCase() !== 'registrar'.toLowerCase()) {
    throw new Error('Unauthorized');
  }

  const enrollmentsWithGrades = await db.query.enrollments.findMany({
    where: and(
      eq(enrollments.studentId, studentId),
      eq(enrollments.semesterId, semesterId)
    ),
    with: {
      course: true,
      grade: true
    }
  });

  const gpa = enrollmentsWithGrades.reduce((sum, enrollment) => {
    return sum + (enrollment.grade?.gpa ? Number(enrollment.grade.gpa) : 0);
  }, 0) / (enrollmentsWithGrades.length || 1);

  return db.insert(transcripts)
    .values({
      studentId,
      semesterId,
      gpa: gpa.toFixed(2),
      generatedDate: new Date()
    })
    .returning();
}

export async function getStudentTranscripts(studentId: number) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role?.toLowerCase() !== 'registrar'.toLowerCase()) {
    throw new Error('Unauthorized');
  }

  return db.query.transcripts.findMany({
    where: eq(transcripts.studentId, studentId),
    with: {
      semester: true
    },
    orderBy: [desc(transcripts.generatedDate)]
  });
}

export async function finalizeTranscript(transcriptId: number, fileUrl: string) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role?.toLowerCase() !== 'registrar'.toLowerCase()) {
    throw new Error('Unauthorized');
  }

  return db.update(transcripts)
    .set({ fileUrl })
    .where(eq(transcripts.id, transcriptId))
    .returning();
}

export async function getPendingTranscripts() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role?.toLowerCase() !== 'registrar'.toLowerCase()) {
    throw new Error('Unauthorized');
  }

  const pending = await db.query.transcripts.findMany({
    where: isNull(transcripts.fileUrl),
    with: {
      student: {
        columns: {
          firstName: true,
          registrationNumber: true,
        }
      },
      semester: {
        columns: {
          name: true
        }
      }
    },
    orderBy: [desc(transcripts.generatedDate)]
  });

  return pending.map((t) => ({
    id: t.id,
    studentName: t.student.firstName,
    regNumber: t.student.registrationNumber,
    semesterName: t.semester.name,
    generatedDate: t.generatedDate
  }));
}
