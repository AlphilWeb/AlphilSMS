'use server';

import { db } from '@/lib/db/index';
import { transcripts, semesters, students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function getStudentTranscripts() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.userId) {
      throw new Error('Unauthorized: You must be logged in.');
    }

    const student = await db.query.students.findFirst({
      where: eq(students.userId, authUser.userId),
      columns: { id: true }
    });

    if (!student) {
      throw new Error('Student record not found');
    }

    const transcriptsData = await db
      .select({
        id: transcripts.id,
        semesterId: transcripts.semesterId,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
        gpa: transcripts.gpa,
        cgpa: transcripts.cgpa,
        generatedDate: transcripts.generatedDate,
        fileUrl: transcripts.fileUrl
      })
      .from(transcripts)
      .innerJoin(semesters, eq(transcripts.semesterId, semesters.id))
      .where(eq(transcripts.studentId, student.id))
      .orderBy(semesters.startDate);

    // Convert Date objects to ISO strings
    return transcriptsData.map(t => ({
      ...t,
      semesterStartDate: t.semesterStartDate.toString(),
      semesterEndDate: t.semesterEndDate.toString(),
      generatedDate: t.generatedDate.toISOString()
    }));
  } catch (error) {
    console.error('[GET_STUDENT_TRANSCRIPTS_ERROR]', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch transcripts data'
    );
  }
}