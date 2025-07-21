// lib/actions/lecturer.submissions.action.ts
'use server';

import { db } from '@/lib/db';
import {
  assignmentSubmissions,
  assignments,
  courses,
  students,
  staff,
} from '@/lib/db/schema';
import { and, eq, desc, gt, isNull, sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Types
export type SubmissionWithDetails = {
  id: number;
  fileUrl: string;
  submittedAt: Date;
  grade: number | null;
  remarks: string | null;
  student: {
    id: number;
    firstName: string;
    lastName: string;
    registrationNumber: string;
  };
  assignment: {
    id: number;
    title: string;
    dueDate: Date;
    course: {
      id: number;
      name: string;
      code: string;
    };
  };
};

export type CourseSubmissionsOverview = {
  courseId: number;
  courseName: string;
  courseCode: string;
  totalAssignments: number;
  submissionsGraded: number;
  submissionsPending: number;
  submissionsLate: number;
};

// Get all submissions for assignments created by the lecturer
export async function getLecturerSubmissions(courseId?: number): Promise<SubmissionWithDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const lecturer = await db.query.staff.findFirst({
    where: eq(staff.userId, authUser.userId),
  });
  if (!lecturer) throw new Error('Lecturer record not found');

  const rawSubmissions = await db
    .select({
      submissionId: assignmentSubmissions.id,
      fileUrl: assignmentSubmissions.fileUrl,
      submittedAt: assignmentSubmissions.submittedAt,
      grade: assignmentSubmissions.grade,
      remarks: assignmentSubmissions.remarks,
      studentId: students.id,
      studentFirstName: students.firstName,
      studentLastName: students.lastName,
      studentRegNo: students.registrationNumber,
      assignmentId: assignments.id,
      assignmentTitle: assignments.title,
      dueDate: assignments.dueDate,
      courseId: courses.id,
      courseName: courses.name,
      courseCode: courses.code,
    })
    .from(assignmentSubmissions)
    .innerJoin(assignments, eq(assignments.id, assignmentSubmissions.assignmentId))
    .innerJoin(courses, eq(courses.id, assignments.courseId))
    .innerJoin(students, eq(students.id, assignmentSubmissions.studentId))
    .innerJoin(staff, eq(staff.id, assignments.assignedById))
    .where(
      and(
        eq(staff.id, lecturer.id),
        courseId ? eq(courses.id, courseId) : undefined
      )
    )
    .orderBy(desc(assignmentSubmissions.submittedAt));

  // ✅ Map into SubmissionWithDetails structure
  const structured: SubmissionWithDetails[] = rawSubmissions.map((row) => ({
    id: row.submissionId,
    fileUrl: row.fileUrl,
    submittedAt: row.submittedAt,
    grade: row.grade !== null ? Number(row.grade) : null,
    remarks: row.remarks,
    student: {
      id: row.studentId,
      firstName: row.studentFirstName,
      lastName: row.studentLastName,
      registrationNumber: row.studentRegNo,
    },
    assignment: {
      id: row.assignmentId,
      title: row.assignmentTitle,
      dueDate: row.dueDate,
      course: {
        id: row.courseId,
        name: row.courseName,
        code: row.courseCode,
      },
    },
  }));

  return structured;
}


export async function getSubmissionStatistics() {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const lecturer = await db.query.staff.findFirst({
    where: eq(staff.userId, authUser.userId),
  });
  if (!lecturer) throw new Error('Lecturer record not found');

  return db
    .select({
      courseId: courses.id,
      courseName: courses.name,
      courseCode: courses.code,
      totalAssignments: sql<number>`(
        SELECT COUNT(*) FROM ${assignments}
        WHERE ${assignments.courseId} = ${courses.id}
      )`,
      submissionsGraded: sql<number>`(
        SELECT COUNT(*) FROM ${assignmentSubmissions}
        JOIN ${assignments} ON ${assignments.id} = ${assignmentSubmissions.assignmentId}
        WHERE ${assignments.courseId} = ${courses.id}
        AND ${assignments.assignedById} = ${lecturer.id}
        AND ${assignmentSubmissions.grade} IS NOT NULL
      )`,
      submissionsPending: sql<number>`(
        SELECT COUNT(*) FROM ${assignmentSubmissions}
        JOIN ${assignments} ON ${assignments.id} = ${assignmentSubmissions.assignmentId}
        WHERE ${assignments.courseId} = ${courses.id}
        AND ${assignments.assignedById} = ${lecturer.id}
        AND ${assignmentSubmissions.grade} IS NULL
      )`,
      submissionsLate: sql<number>`(
        SELECT COUNT(*) FROM ${assignmentSubmissions}
        JOIN ${assignments} ON ${assignments.id} = ${assignmentSubmissions.assignmentId}
        WHERE ${assignments.courseId} = ${courses.id}
        AND ${assignments.assignedById} = ${lecturer.id}
        AND ${assignmentSubmissions.submittedAt} > ${assignments.dueDate}
      )`,
    })
    .from(courses)
    .innerJoin(assignments, eq(assignments.courseId, courses.id))
    .where(eq(assignments.assignedById, lecturer.id))
    .groupBy(courses.id)
    .orderBy(courses.name);
}

// Grade a submission
export async function gradeSubmission(
  submissionId: number,
  grade: number,
  remarks: string
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const lecturer = await db.query.staff.findFirst({
    where: eq(staff.userId, authUser.userId),
  });
  if (!lecturer) throw new Error('Lecturer record not found');

  const submission = await db
    .select()
    .from(assignmentSubmissions)
    .innerJoin(assignments, eq(assignments.id, assignmentSubmissions.assignmentId))
    .where(
      and(
        eq(assignmentSubmissions.id, submissionId),
        eq(assignments.assignedById, lecturer.id),
      ),
    )
    .then(res => res[0]?.assignment_submissions);

  if (!submission) throw new Error('Submission not found or unauthorized');

  const updatedSubmission = await db
    .update(assignmentSubmissions)
    .set({
      grade: sql`${grade}`,
      remarks: remarks || null,
    })
    .where(eq(assignmentSubmissions.id, submissionId))
    .returning();

  revalidatePath('/dashboard/lecturer/submissions');
  return updatedSubmission[0];
}

// Download all submissions for an assignment (conceptual)
export async function downloadSubmissionsArchive(assignmentId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const lecturer = await db.query.staff.findFirst({
    where: eq(staff.userId, authUser.userId),
  });
  if (!lecturer) throw new Error('Lecturer record not found');

  const assignment = await db
    .select()
    .from(assignments)
    .where(
      and(
        eq(assignments.id, assignmentId),
        eq(assignments.assignedById, lecturer.id),
      ),
    )
    .then(res => res[0]);

  if (!assignment) throw new Error('Assignment not found or unauthorized');

  const submissions = await db
    .select({
      fileUrl: assignmentSubmissions.fileUrl,
      student: {
        firstName: students.firstName,
        lastName: students.lastName,
      },
    })
    .from(assignmentSubmissions)
    .innerJoin(students, eq(students.id, assignmentSubmissions.studentId))
    .where(eq(assignmentSubmissions.assignmentId, assignmentId));

  return {
    assignmentTitle: assignment.title,
    courseCode: (
      await db.query.courses.findFirst({
        where: eq(courses.id, assignment.courseId),
      })
    )?.code,
    submissions,
  };
}
