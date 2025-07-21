// lib/actions/lecturer.manage.assignments.action.ts
'use server';

import { db } from '@/lib/db';
import {
  assignments,
  assignmentSubmissions,
  courses,
  students,
  staff,
} from '@/lib/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { uploadFileToR2 } from '@/lib/file-upload';

// Types
export type AssignmentWithCourse = {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string | null;
  dueDate: Date;
  assignedDate: Date;
  course: {
    id: number;
    name: string;
    code: string;
  };
};

export type AssignmentSubmissionWithStudent = {
  id: number;
  fileUrl: string;
  submittedAt: Date;
  remarks: string | null;
  grade: number | null;
  student: {
    id: number;
    firstName: string;
    lastName: string;
    registrationNumber: string;
  };
};

// Get all assignments created by the lecturer
export async function getLecturerAssignments() {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: assignments.id,
      title: assignments.title,
      description: assignments.description,
      fileUrl: assignments.fileUrl,
      dueDate: assignments.dueDate,
      assignedDate: assignments.assignedDate,
      course: {
        id: courses.id,
        name: courses.name,
        code: courses.code,
      },
    })
    .from(assignments)
    .innerJoin(courses, eq(courses.id, assignments.courseId))
    .innerJoin(staff, eq(staff.id, assignments.assignedById))
    .where(eq(staff.userId, authUser.userId))
    .orderBy(desc(assignments.dueDate));
}

// Get a single assignment with submissions
export async function getAssignmentWithSubmissions(assignmentId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  const assignment = await db
    .select()
    .from(assignments)
    .innerJoin(staff, eq(staff.id, assignments.assignedById))
    .where(
      and(eq(assignments.id, assignmentId), eq(staff.userId, authUser.userId)),
    )
    .then((res) => res[0]?.assignments);

  if (!assignment) throw new Error('Assignment not found or unauthorized');

  const assignmentWithCourse = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      description: assignments.description,
      fileUrl: assignments.fileUrl,
      dueDate: assignments.dueDate,
      assignedDate: assignments.assignedDate,
      course: {
        id: courses.id,
        name: courses.name,
        code: courses.code,
      },
    })
    .from(assignments)
    .innerJoin(courses, eq(courses.id, assignments.courseId))
    .where(eq(assignments.id, assignmentId))
    .then((res) => res[0]);

  const submissions = await db
    .select({
      id: assignmentSubmissions.id,
      fileUrl: assignmentSubmissions.fileUrl,
      submittedAt: assignmentSubmissions.submittedAt,
      remarks: assignmentSubmissions.remarks,
      grade: assignmentSubmissions.grade,
      student: {
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        registrationNumber: students.registrationNumber,
      },
    })
    .from(assignmentSubmissions)
    .innerJoin(students, eq(students.id, assignmentSubmissions.studentId))
    .where(eq(assignmentSubmissions.assignmentId, assignmentId))
    .orderBy(desc(assignmentSubmissions.submittedAt));

  return {
    assignment: assignmentWithCourse,
    submissions,
  };
}

// Create a new assignment with Cloudflare R2 file upload
export async function createAssignment(formData: FormData) {
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
  const description = formData.get('description') as string;
  const file = formData.get('file') as File | null;
  const dueDate = new Date(formData.get('dueDate') as string);

  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .then((res) => res[0]);

  if (!course) throw new Error('Course not found');

  let fileUrl: string | null = null;
  if (file) {
    const uploadResult = await uploadFileToR2(file, "assignments");
    fileUrl = uploadResult;
  }

  const newAssignment = await db
    .insert(assignments)
    .values({
      courseId,
      assignedById: staffRecord.id,
      title,
      description: description || null,
      fileUrl,
      dueDate,
    })
    .returning();

  revalidatePath('/dashboard/lecturer/assignments');
  return newAssignment[0];
}

// Update an assignment
export async function updateAssignment(assignmentId: number, formData: FormData) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the assignment belongs to the lecturer
  const assignment = await db
    .select()
    .from(assignments)
    .innerJoin(staff, eq(staff.id, assignments.assignedById))
    .where(
      and(
        eq(assignments.id, assignmentId),
        eq(staff.userId, authUser.userId),
      ),
    )
    .then((res) => res[0]?.assignments);

  if (!assignment) throw new Error('Assignment not found or unauthorized');

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const fileUrl = formData.get('fileUrl') as string;
  const dueDate = new Date(formData.get('dueDate') as string);

  const updatedAssignment = await db
    .update(assignments)
    .set({
      title,
      description: description || null,
      fileUrl: fileUrl || null,
      dueDate,
    //   updatedAt: new Date(),
    })
    .where(eq(assignments.id, assignmentId))
    .returning();

  revalidatePath('/dashboard/lecturer/assignments');
  return updatedAssignment[0];
}

// Delete an assignment
export async function deleteAssignment(assignmentId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the assignment belongs to the lecturer
  const assignment = await db
    .select()
    .from(assignments)
    .innerJoin(staff, eq(staff.id, assignments.assignedById))
    .where(
      and(
        eq(assignments.id, assignmentId),
        eq(staff.userId, authUser.userId),
      ),
    )
    .then((res) => res[0]?.assignments);

  if (!assignment) throw new Error('Assignment not found or unauthorized');

  await db.delete(assignments).where(eq(assignments.id, assignmentId));

  revalidatePath('/dashboard/lecturer/assignments');
  return { success: true };
}

// Grade a submission
export async function gradeSubmission(
  submissionId: number,
  grade: number,
  remarks: string,
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the submission belongs to an assignment created by the lecturer
  const submission = await db
    .select()
    .from(assignmentSubmissions)
    .innerJoin(assignments, eq(assignments.id, assignmentSubmissions.assignmentId))
    .innerJoin(staff, eq(staff.id, assignments.assignedById))
    .where(
      and(
        eq(assignmentSubmissions.id, submissionId),
        eq(staff.userId, authUser.userId),
      ),
    )
    .then((res) => res[0]?.assignment_submissions);

  if (!submission) throw new Error('Submission not found or unauthorized');

  const updatedSubmission = await db
    .update(assignmentSubmissions)
    .set({
      grade: grade.toString(),
      remarks: remarks || null,
    })
    .where(eq(assignmentSubmissions.id, submissionId))
    .returning();

  revalidatePath(`/dashboard/lecturer/assignments/${submission.assignmentId}`);
  return updatedSubmission[0];
}