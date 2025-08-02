'use server';

import { db } from '@/lib/db';
import { grades, enrollments, courses, students, assignments, quizSubmissions, quizzes, staff } from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { assignmentSubmissions as assignmentSubmissionsSchema } from '@/lib/db/schema';

// Types
export type LecturerCourse = {
  id: number;
  name: string;
  code: string;
};

export type StudentResult = {
  studentId: number;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  assignments: {
    id: number;
    title: string;
    grade: number | null;
    total?: number | null;
  }[];
  quizzes: {
    id: number;
    title: string;
    score: number | null;
    total: number;
  }[];
  catScore: number | null;
  examScore: number | null;
  totalScore?: number | null;
  letterGrade: string | null;
  gpa: number | null;
};

// Get all courses taught by the lecturer
export async function getLecturerCourses(): Promise<LecturerCourse[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: courses.id,
      name: courses.name,
      code: courses.code,
    })
    .from(courses)
    .innerJoin(staff, eq(staff.id, courses.lecturerId))
    .where(eq(staff.userId, authUser.userId))
    .orderBy(courses.name);
}

// Get all results for a specific course
export async function getCourseResults(courseId: number): Promise<StudentResult[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the lecturer teaches this course
  const isLecturerCourse = await db
    .select()
    .from(courses)
    .innerJoin(staff, eq(staff.id, courses.lecturerId))
    .where(
      and(
        eq(courses.id, courseId),
        eq(staff.userId, authUser.userId),
      ))
    .then(res => res.length > 0);

  if (!isLecturerCourse) throw new Error('Course not found or unauthorized');

  // Get all enrolled students
  const enrollmentsData = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.courseId, courseId));

  // Get enrollment IDs
  const enrollmentIds = enrollmentsData.map(e => e.id);

  // Get grades for these enrollments
  const gradesData = await db
    .select()
    .from(grades)
    .where(inArray(grades.enrollmentId, enrollmentIds));

  // Get assignments
  const assignmentsData = await db
    .select()
    .from(assignments)
    .where(eq(assignments.courseId, courseId));

  // Get assignment submissions
  const assignmentSubmissionsData = await db
    .select()
    .from(assignmentSubmissionsSchema)
    .where(inArray(assignmentSubmissionsSchema.assignmentId, assignmentsData.map(a => a.id)));

  // Get quizzes
  const quizzesData = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.courseId, courseId));

  // Get quiz submissions
  const quizSubmissionsData = await db
    .select()
    .from(quizSubmissions)
    .where(inArray(quizSubmissions.quizId, quizzesData.map(q => q.id)));

  // Get students data
  const studentIds = enrollmentsData.map(e => e.studentId);
  const studentsData = await db
    .select()
    .from(students)
    .where(inArray(students.id, studentIds));

  // Get course info
  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .then(res => res[0]);

  if (!course) throw new Error('Course not found');

  // Transform data into student results
  return enrollmentsData.map(enrollment => {
    const grade = gradesData.find(g => g.enrollmentId === enrollment.id);
    const student = studentsData.find(s => s.id === enrollment.studentId);

    if (!student) throw new Error(`Student not found for enrollment ${enrollment.id}`);

    return {
      studentId: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      registrationNumber: student.registrationNumber,
      courseId,
      courseCode: course.code,
      courseName: course.name,
      assignments: assignmentsData.map(assignment => {
        const submission = assignmentSubmissionsData
          .find(s => s.assignmentId === assignment.id && s.studentId === student.id);
        
        return {
          id: assignment.id,
          title: assignment.title,
          grade: submission?.grade ? parseFloat(submission.grade) : null,
          total: 0, // Changed fixed 100 to use assignment's total marks
        };
      }),
      quizzes: quizzesData.map(quiz => {
        const submission = quizSubmissionsData
          .find(s => s.quizId === quiz.id && s.studentId === student.id);
        
        return {
          id: quiz.id,
          title: quiz.title,
          score: submission?.score ? parseFloat(submission.score) : null,
          total: quiz.totalMarks,
        };
      }),
      catScore: grade?.catScore ? parseFloat(grade.catScore) : null,
      examScore: grade?.examScore ? parseFloat(grade.examScore) : null,
      totalScore: grade?.totalScore ? parseFloat(grade.totalScore) : null,
      letterGrade: grade?.letterGrade || null,
      gpa: grade?.gpa ? parseFloat(grade.gpa) : null, // Fixed GPA conversion
    };
  });
}