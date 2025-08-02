'use server';

import { db } from '@/lib/db';
import { quizzes, quizSubmissions, courses, students, staff } from '@/lib/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
// import { uploadFileToR2 } from '@/lib/file-upload';

// Types
export type QuizWithCourse = {
  id: number;
  title: string;
  instructions: string | null;
  totalMarks: number;
  quizDate: Date;
  createdAt: Date;
  course: {
    id: number;
    name: string;
    code: string;
  };
};

export type QuizSubmissionWithStudent = {
  id: number;
  fileUrl: string;
  submittedAt: Date;
  feedback: string | null;
  score: number | null;
  student: {
    id: number;
    firstName: string;
    lastName: string;
    registrationNumber: string;
  };
};

// Get all quizzes created by the lecturer
export async function getLecturerQuizzes() {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: quizzes.id,
      title: quizzes.title,
      instructions: quizzes.instructions,
      totalMarks: quizzes.totalMarks,
      quizDate: quizzes.quizDate,
      createdAt: quizzes.createdAt,
      course: {
        id: courses.id,
        name: courses.name,
        code: courses.code,
      },
    })
    .from(quizzes)
    .innerJoin(courses, eq(courses.id, quizzes.courseId))
    .innerJoin(staff, eq(staff.id, quizzes.createdById))
    .where(eq(staff.userId, authUser.userId))
    .orderBy(desc(quizzes.quizDate));
}

// Get a single quiz with submissions
export async function getQuizWithSubmissions(quizId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const quiz = await db
    .select()
    .from(quizzes)
    .innerJoin(staff, eq(staff.id, quizzes.createdById))
    .where(
      and(eq(quizzes.id, quizId), eq(staff.userId, authUser.userId)),
    )
    .then((res) => res[0]?.quizzes);

  if (!quiz) throw new Error('Quiz not found or unauthorized');

  const quizWithCourse = await db
    .select({
      id: quizzes.id,
      title: quizzes.title,
      instructions: quizzes.instructions,
      totalMarks: quizzes.totalMarks,
      quizDate: quizzes.quizDate,
      createdAt: quizzes.createdAt,
      course: {
        id: courses.id,
        name: courses.name,
        code: courses.code,
      },
    })
    .from(quizzes)
    .innerJoin(courses, eq(courses.id, quizzes.courseId))
    .where(eq(quizzes.id, quizId))
    .then((res) => res[0]);

  const submissions = await db
    .select({
      id: quizSubmissions.id,
      fileUrl: quizSubmissions.fileUrl,
      submittedAt: quizSubmissions.submittedAt,
      feedback: quizSubmissions.feedback,
      score: quizSubmissions.score,
      student: {
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        registrationNumber: students.registrationNumber,
      },
    })
    .from(quizSubmissions)
    .innerJoin(students, eq(students.id, quizSubmissions.studentId))
    .where(eq(quizSubmissions.quizId, quizId))
    .orderBy(desc(quizSubmissions.submittedAt));

  return {
    quiz: quizWithCourse,
    submissions,
  };
}

// Create a new quiz
export async function createQuiz(formData: FormData) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const staffRecord = await db
    .select()
    .from(staff)
    .where(eq(staff.userId, authUser.userId))
    .then((res) => res[0]);

  if (!staffRecord) throw new Error('Staff record not found');

  const courseId = Number(formData.get('courseId'));
  const title = formData.get('title') as string;
  const instructions = formData.get('instructions') as string;
  const totalMarks = Number(formData.get('totalMarks'));
  const quizDate = new Date(formData.get('quizDate') as string);

  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .then((res) => res[0]);

  if (!course) throw new Error('Course not found');

  const newQuiz = await db
    .insert(quizzes)
    .values({
      courseId,
      createdById: staffRecord.id,
      title,
      instructions: instructions || null,
      totalMarks,
      quizDate,
      fileUrl: '', // Add this required field
    })
    .returning();

  revalidatePath('/dashboard/lecturer/quizzes');
  return newQuiz[0];
}

// Update a quiz
export async function updateQuiz(quizId: number, formData: FormData) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the quiz belongs to the lecturer
  const quiz = await db
    .select()
    .from(quizzes)
    .innerJoin(staff, eq(staff.id, quizzes.createdById))
    .where(
      and(
        eq(quizzes.id, quizId),
        eq(staff.userId, authUser.userId),
      ),
    )
    .then((res) => res[0]?.quizzes);

  if (!quiz) throw new Error('Quiz not found or unauthorized');

  const title = formData.get('title') as string;
  const instructions = formData.get('instructions') as string;
  const totalMarks = Number(formData.get('totalMarks'));
  const quizDate = new Date(formData.get('quizDate') as string);

  const updatedQuiz = await db
    .update(quizzes)
    .set({
      title,
      instructions: instructions || null,
      totalMarks,
      quizDate,
    })
    .where(eq(quizzes.id, quizId))
    .returning();

  revalidatePath('/dashboard/lecturer/quizzes');
  return updatedQuiz[0];
}

// Delete a quiz
export async function deleteQuiz(quizId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the quiz belongs to the lecturer
  const quiz = await db
    .select()
    .from(quizzes)
    .innerJoin(staff, eq(staff.id, quizzes.createdById))
    .where(
      and(
        eq(quizzes.id, quizId),
        eq(staff.userId, authUser.userId),
      ),
    )
    .then((res) => res[0]?.quizzes);

  if (!quiz) throw new Error('Quiz not found or unauthorized');

  await db.delete(quizzes).where(eq(quizzes.id, quizId));

  revalidatePath('/dashboard/lecturer/quizzes');
  return { success: true };
}

// Grade a quiz submission
export async function gradeQuizSubmission(
  submissionId: number,
  score: number,
  feedback: string,
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the submission belongs to a quiz created by the lecturer
  const submission = await db
    .select()
    .from(quizSubmissions)
    .innerJoin(quizzes, eq(quizzes.id, quizSubmissions.quizId))
    .innerJoin(staff, eq(staff.id, quizzes.createdById))
    .where(
      and(
        eq(quizSubmissions.id, submissionId),
        eq(staff.userId, authUser.userId),
      ),
    )
    .then((res) => res[0]?.quiz_submissions);

  if (!submission) throw new Error('Submission not found or unauthorized');

  const updatedSubmission = await db
    .update(quizSubmissions)
    .set({
      score: score.toString(),
      feedback: feedback || null,
    })
    .where(eq(quizSubmissions.id, submissionId))
    .returning();

  revalidatePath(`/dashboard/lecturer/quizzes/${submission.quizId}`);
  return updatedSubmission[0];
}