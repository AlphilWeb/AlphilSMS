'use server';

import { db } from '@/lib/db';
import { quizzes, quizSubmissions, courses, students, staff } from '@/lib/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { uploadFileToR2 } from '@/lib/file-upload';

// Types
export type QuizWithCourse = {
  id: number;
  title: string;
  instructions: string | null;
  totalMarks: number;
  quizDate: Date;
  createdAt: Date;
  fileUrl: string;
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
  score: string | null; // Stored as string in DB to handle decimal places
  student: {
    id: number;
    firstName: string;
    lastName: string;
    registrationNumber: string;
  };
};

// Get all quizzes created by the lecturer
export async function getLecturerQuizzes(): Promise<QuizWithCourse[]> {
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
      fileUrl: quizzes.fileUrl,
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

  const [quizWithCourse, submissions] = await Promise.all([
    db
      .select({
        id: quizzes.id,
        title: quizzes.title,
        instructions: quizzes.instructions,
        totalMarks: quizzes.totalMarks,
        quizDate: quizzes.quizDate,
        createdAt: quizzes.createdAt,
        fileUrl: quizzes.fileUrl,
        course: {
          id: courses.id,
          name: courses.name,
          code: courses.code,
        },
      })
      .from(quizzes)
      .innerJoin(courses, eq(courses.id, quizzes.courseId))
      .where(eq(quizzes.id, quizId))
      .then((res) => res[0]),
    
    db
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
      .orderBy(desc(quizSubmissions.submittedAt)),
  ]);

  return {
    quiz: quizWithCourse,
    submissions,
  };
}

// Create a new quiz with file upload
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
  const file = formData.get('file') as File;

  // Verify the course exists and is taught by the lecturer
  const course = await db
    .select()
    .from(courses)
    .innerJoin(staff, eq(staff.id, courses.lecturerId))
    .where(
      and(
        eq(courses.id, courseId),
        eq(staff.userId, authUser.userId),
      ),
    )
    .then((res) => res[0]?.courses);

  if (!course) throw new Error('Course not found or unauthorized');

  if (!file || file.size === 0) {
    throw new Error('Quiz file is required');
  }

  const fileUrl = await uploadFileToR2(file, 'quizzes');

  const newQuiz = await db
    .insert(quizzes)
    .values({
      courseId,
      createdById: staffRecord.id,
      title,
      instructions: instructions || null,
      totalMarks,
      quizDate,
      fileUrl,
    })
    .returning()
    .then(res => res[0]);

  revalidatePath('/dashboard/lecturer/quizzes');
  return {
    ...newQuiz,
    course: {
      id: course.id,
      name: course.name,
      code: course.code,
    },
  };
}

// Update a quiz with optional file upload
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
  const file = formData.get('file') as File;

  let fileUrl = quiz.fileUrl;
  if (file && file.size > 0) {
    fileUrl = await uploadFileToR2(file, 'quizzes');
  }

  const updatedQuiz = await db
    .update(quizzes)
    .set({
      title,
      instructions: instructions || null,
      totalMarks,
      quizDate,
      fileUrl,
    })
    .where(eq(quizzes.id, quizId))
    .returning()
    .then(res => res[0]);

  // Get course details for the response
  const course = await db
    .select({
      id: courses.id,
      name: courses.name,
      code: courses.code,
    })
    .from(courses)
    .where(eq(courses.id, updatedQuiz.courseId))
    .then(res => res[0]);

  revalidatePath('/dashboard/lecturer/quizzes');
  return {
    ...updatedQuiz,
    course,
  };
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
      score: score.toString(), // Store as string to preserve decimal precision
      feedback: feedback || null,
    })
    .where(eq(quizSubmissions.id, submissionId))
    .returning()
    .then(res => res[0]);

  revalidatePath(`/dashboard/lecturer/quizzes/${submission.quizId}`);
  return updatedSubmission;
}