// lib/actions/lecturer.manage.students.action.ts
'use server';

import { db } from '@/lib/db';
import {
  students,
  enrollments,
  courses,
  programs,
  departments,
  semesters,
  staff,
  assignmentSubmissions,
  quizSubmissions,
  grades,
  assignments,
  quizzes,
} from '@/lib/db/schema';
import { and, eq, desc, sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
// import { revalidatePath } from 'next/cache';

// Types
export type StudentProfile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  registrationNumber: string;
  studentNumber?: string;
  program: {
    id: number;
    name: string;
    code: string;
  };
  department?: {
    id: number;
    name: string;
  };
  currentSemester?: {
    id: number;
    name: string;
  };
};

export type StudentCourse = {
  id: number;
  name: string;
  code: string;
  credits: string;
  enrollmentDate: string | null;
  grade: {
    catScore: string | null;
    examScore: string | null;
    totalScore: string | null;
    letterGrade: string | null;
  } | null;
};

export type StudentPerformance = {
  assignmentSubmissions: number;
  assignmentsGraded: number;
  quizSubmissions: number;
  averageGrade: number | null;
};

export type StudentAssignmentSubmission = {
  id: number;
  assignmentId: number;
  title: string;
  submittedAt: Date;
  grade: string | null;
  remarks: string | null;
};

export type StudentQuizSubmission = {
  id: number;
  quizId: number;
  title: string;
  submittedAt: Date;
  score: string | null;
  feedback: string | null;
};
// type AssignmentSubmissionResult = {
//   id: number;
//   assignmentId: number;
//   title: string;
//   submittedAt: Date;
//   grade: string | null;
//   remarks: string | null;
// }[];

// type QuizSubmissionResult = {
//   id: number;
//   quizId: number;
//   title: string;
//   submittedAt: Date;
//   score: string | null;
//   feedback: string | null;
// }[];
// Get all students enrolled in lecturer's courses
export async function getStudentsEnrolledInLecturerCourses() {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      email: students.email,
      registrationNumber: students.registrationNumber,
      program: {
        id: programs.id,
        name: programs.name,
        code: programs.code,
      },
    })
    .from(students)
    .innerJoin(enrollments, eq(enrollments.studentId, students.id))
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(programs, eq(programs.id, students.programId))
    .innerJoin(staff, eq(staff.id, courses.lecturerId))
    .where(eq(staff.userId, authUser.userId))
    .groupBy(students.id, programs.id)
    .orderBy(students.lastName, students.firstName);
}

// Get student profile details
export async function getStudentProfile(studentId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the student is enrolled in at least one course taught by the lecturer
  const studentExists = await db
    .select({ id: students.id })
    .from(students)
    .innerJoin(enrollments, eq(enrollments.studentId, students.id))
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(staff, eq(staff.id, courses.lecturerId))
    .where(
      and(
        eq(students.id, studentId),
        eq(staff.userId, authUser.userId),
      ),
    )
    .then((res) => res[0]);

  if (!studentExists) throw new Error('Student not found or unauthorized');

  return db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      email: students.email,
      registrationNumber: students.registrationNumber,
      studentNumber: students.studentNumber,
      program: {
        id: programs.id,
        name: programs.name,
        code: programs.code,
      },
      department: {
        id: departments.id,
        name: departments.name,
      },
      currentSemester: {
        id: semesters.id,
        name: semesters.name,
      },
    })
    .from(students)
    .innerJoin(programs, eq(programs.id, students.programId))
    .innerJoin(departments, eq(departments.id, students.departmentId))
    .innerJoin(semesters, eq(semesters.id, students.currentSemesterId))
    .where(eq(students.id, studentId))
    .then((res) => res[0]);
}

// Get all courses for a student that are taught by the lecturer
export async function getStudentCourses(studentId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: courses.id,
      name: courses.name,
      code: courses.code,
      credits: courses.credits,
      enrollmentDate: enrollments.enrollmentDate,
      grade: {
        catScore: grades.catScore,
        examScore: grades.examScore,
        totalScore: grades.totalScore,
        letterGrade: grades.letterGrade,
      },
    })
    .from(courses)
    .innerJoin(enrollments, eq(enrollments.courseId, courses.id))
    .leftJoin(grades, eq(grades.enrollmentId, enrollments.id))
    .innerJoin(staff, eq(staff.id, courses.lecturerId))
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(staff.userId, authUser.userId),
      ),
    )
    .orderBy(desc(enrollments.enrollmentDate));
}

// Get student performance statistics
export async function getStudentPerformance(studentId: number): Promise<StudentPerformance> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the student is enrolled in at least one course taught by the lecturer
  const studentExists = await db
    .select({ id: students.id })
    .from(students)
    .innerJoin(enrollments, eq(enrollments.studentId, students.id))
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(staff, eq(staff.id, courses.lecturerId))
    .where(
      and(
        eq(students.id, studentId),
        eq(staff.userId, authUser.userId),
      ),
    )
    .then((res) => res[0]);

  if (!studentExists) throw new Error('Student not found or unauthorized');

  const performance = await db
    .select({
      assignmentSubmissions: sql<number>`count(distinct ${assignmentSubmissions.id})`.as('assignmentSubmissions'),
      assignmentsGraded: sql<number>`count(distinct case when ${assignmentSubmissions.grade} is not null then ${assignmentSubmissions.id} end)`.as('assignmentsGraded'),
      quizSubmissions: sql<number>`count(distinct ${quizSubmissions.id})`.as('quizSubmissions'),
      averageGrade: sql<number | null>`avg(cast(${grades.totalScore} as float))`.as('averageGrade'),
    })
    .from(students)
    .leftJoin(assignmentSubmissions, eq(assignmentSubmissions.studentId, students.id))
    .leftJoin(quizSubmissions, eq(quizSubmissions.studentId, students.id))
    .leftJoin(enrollments, eq(enrollments.studentId, students.id))
    .leftJoin(grades, eq(grades.enrollmentId, enrollments.id))
    .where(eq(students.id, studentId))
    .then((res) => res[0]);

  return {
    assignmentSubmissions: performance.assignmentSubmissions ?? 0,
    assignmentsGraded: performance.assignmentsGraded ?? 0,
    quizSubmissions: performance.quizSubmissions ?? 0,
    averageGrade: performance.averageGrade ? parseFloat(performance.averageGrade.toString()) : null,
  };
}

// Get student submissions for a specific course
export async function getStudentCourseSubmissions(
  studentId: number,
  courseId: number,
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the student is enrolled in the course and it's taught by the lecturer
  const enrollmentExists = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(staff, eq(staff.id, courses.lecturerId))
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.courseId, courseId),
        eq(staff.userId, authUser.userId),
      ),
    )
    .then((res) => res[0]);

  if (!enrollmentExists) throw new Error('Enrollment not found or unauthorized');
    
  const assignmentsPromise = db
    .select({
      id: assignmentSubmissions.id,
      assignmentId: assignmentSubmissions.assignmentId,
      title: assignments.title,
      submittedAt: assignmentSubmissions.submittedAt,
      grade: assignmentSubmissions.grade,
      remarks: assignmentSubmissions.remarks,
    })
    .from(assignmentSubmissions)
    .innerJoin(assignments, eq(assignments.id, assignmentSubmissions.assignmentId))
    .where(
      and(
        eq(assignmentSubmissions.studentId, studentId),
        eq(assignments.courseId, courseId),
      ),
    )
    .orderBy(desc(assignmentSubmissions.submittedAt));

  const quizzesPromise = db
    .select({
      id: quizSubmissions.id,
      quizId: quizSubmissions.quizId,
      title: quizzes.title,
      submittedAt: quizSubmissions.submittedAt,
      score: quizSubmissions.score,
      feedback: quizSubmissions.feedback,
    })
    .from(quizSubmissions)
    .innerJoin(quizzes, eq(quizzes.id, quizSubmissions.quizId))
    .where(
      and(
        eq(quizSubmissions.studentId, studentId),
        eq(quizzes.courseId, courseId),
      ),
    )
    .orderBy(desc(quizSubmissions.submittedAt));

  const [assignmentResults, quizResults] = await Promise.all([
    assignmentsPromise,
    quizzesPromise,
  ]);

  return {
    assignments: assignmentResults,
    quizzes: quizResults,
  };
}
// Get student grades across all courses taught by the lecturer
export async function getStudentGrades(studentId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      course: {
        id: courses.id,
        name: courses.name,
        code: courses.code,
      },
      grade: {
        catScore: grades.catScore,
        examScore: grades.examScore,
        totalScore: grades.totalScore,
        letterGrade: grades.letterGrade,
      },
    })
    .from(grades)
    .innerJoin(enrollments, eq(enrollments.id, grades.enrollmentId))
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(staff, eq(staff.id, courses.lecturerId))
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(staff.userId, authUser.userId),
      ),
    )
    .orderBy(courses.name);
}