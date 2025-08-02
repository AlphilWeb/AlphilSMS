// lib/actions/studentGrades.actions.ts
'use server';

import { db } from '@/lib/db/index';
import { grades, enrollments, courses, students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function getStudentGrades() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.userId) {
      throw new Error('Unauthorized: You must be logged in.');
    }

    // Get student record
    const student = await db.query.students.findFirst({
      where: eq(students.userId, authUser.userId),
      columns: { id: true }
    });

    if (!student) {
      throw new Error('Student record not found');
    }

    // Get grades with course details
    const gradesData = await db
      .select({
        courseId: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        credits: courses.credits,
        catScore: grades.catScore,
        examScore: grades.examScore,
        totalScore: grades.totalScore,
        letterGrade: grades.letterGrade,
        gpa: grades.gpa
      })
      .from(grades)
      .innerJoin(enrollments, eq(grades.enrollmentId, enrollments.id))
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.studentId, student.id))
      .orderBy(courses.name);

    return gradesData;
  } catch (error) {
    console.error('[GET_STUDENT_GRADES_ERROR]', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch grades data'
    );
  }
}