'use server';

import { db } from '@/lib/db';
import { grades, enrollments, courses, students } from '@/lib/db/schema';
import {  eq, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Types
export type GradeWithStudentAndCourse = {
  id: number;
  catScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  letterGrade: string | null;
  gpa: number | null;
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

// Get all grades for courses taught by the lecturer
export async function getLecturerGrades() {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: grades.id,
      catScore: grades.catScore,
      examScore: grades.examScore,
      totalScore: grades.totalScore,
      letterGrade: grades.letterGrade,
      gpa: grades.gpa,
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
    .from(grades)
    .innerJoin(enrollments, eq(enrollments.id, grades.enrollmentId))
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .orderBy(desc(grades.totalScore));
}

// Update a grade
export async function updateGrade(
  gradeId: number,
  formData: {
    catScore: number | null;
    examScore: number | null;
    letterGrade: string | null;
    gpa: number | null;
  }
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Calculate total score if both CAT and Exam scores are provided
  const totalScore = 
    formData.catScore !== null && formData.examScore !== null
      ? formData.catScore + formData.examScore
      : null;

  const updatedGrade = await db
    .update(grades)
    .set({
      catScore: formData.catScore?.toString(),
      examScore: formData.examScore?.toString(),
      totalScore: totalScore?.toString(),
      letterGrade: formData.letterGrade,
      gpa: formData.gpa?.toString(),
    })
    .where(eq(grades.id, gradeId))
    .returning();

  revalidatePath('/dashboard/lecturer/grades');
  return updatedGrade[0];
}