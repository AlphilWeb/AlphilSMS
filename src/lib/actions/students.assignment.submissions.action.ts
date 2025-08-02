// lib/actions/student.assignments.action.ts
'use server';

import { db } from '@/lib/db';
import { 
  assignments,
  assignmentSubmissions,
  courses,
  students,
  enrollments
} from '@/lib/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Types
export type StudentAssignment = {
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
  submission?: {
    id: number;
    fileUrl: string;
    submittedAt: Date;
    grade: string | null;
    remarks: string | null;
  };
};

export type SubmissionWithAssignment = {
  id: number;
  fileUrl: string;
  submittedAt: Date;
  grade: number | null;
  remarks: string | null;
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

// Get all assignments for a student with submission status
export async function getStudentAssignments() {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Get student record
  const student = await db.query.students.findFirst({
    where: eq(students.userId, authUser.userId),
  });
  if (!student) throw new Error('Student record not found');

  // Get all assignments for the student's courses
  const assignmentsData = await db
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
    .innerJoin(enrollments, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.studentId, student.id))
    .orderBy(desc(assignments.dueDate));

  // Get submissions for these assignments
  const submissions = await db
    .select()
    .from(assignmentSubmissions)
    .where(eq(assignmentSubmissions.studentId, student.id));

  // Combine assignments with submission data
  return assignmentsData.map(assignment => ({
    ...assignment,
    submission: submissions.find(s => s.assignmentId === assignment.id),
  }));
}

// Get a single submission with assignment details
export async function getSubmissionDetails(submissionId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the submission belongs to the student
  const student = await db.query.students.findFirst({
    where: eq(students.userId, authUser.userId),
  });
  if (!student) throw new Error('Student record not found');

  return db
    .select({
      id: assignmentSubmissions.id,
      fileUrl: assignmentSubmissions.fileUrl,
      submittedAt: assignmentSubmissions.submittedAt,
      grade: assignmentSubmissions.grade,
      remarks: assignmentSubmissions.remarks,
      assignmentId: assignments.id,
      assignmentTitle: assignments.title,
      assignmentDueDate: assignments.dueDate,
      courseId: courses.id,
      courseName: courses.name,
      courseCode: courses.code,
    })
    .from(assignmentSubmissions)
    .innerJoin(assignments, eq(assignments.id, assignmentSubmissions.assignmentId))
    .innerJoin(courses, eq(courses.id, assignments.courseId))
    .where(
      and(
        eq(assignmentSubmissions.id, submissionId),
        eq(assignmentSubmissions.studentId, student.id),
      ),
    )
    .then(res => res[0]);
}

// Submit or update an assignment
export async function submitAssignment(
  assignmentId: number,
  fileUrl: string,
  isUpdate: boolean = false
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Get student record
  const student = await db.query.students.findFirst({
    where: eq(students.userId, authUser.userId),
  });
  if (!student) throw new Error('Student record not found');

  // Verify the assignment exists and is for a course the student is enrolled in
  const assignment = await db
    .select()
    .from(assignments)
    .innerJoin(courses, eq(courses.id, assignments.courseId))
    .innerJoin(enrollments, and(
      eq(enrollments.courseId, courses.id),
      eq(enrollments.studentId, student.id),
    ))
    .where(eq(assignments.id, assignmentId))
    .then(res => res[0]?.assignments);

  if (!assignment) throw new Error('Assignment not found or unauthorized');

  if (isUpdate) {
    // Update existing submission
    const submission = await db
      .update(assignmentSubmissions)
      .set({
        fileUrl,
        submittedAt: new Date(),
      })
      .where(
        and(
          eq(assignmentSubmissions.assignmentId, assignmentId),
          eq(assignmentSubmissions.studentId, student.id),
        ),
      )
      .returning();
    
    revalidatePath('/dashboard/student/assignments');
    return submission[0];
  } else {
    // Create new submission
    const submission = await db
      .insert(assignmentSubmissions)
      .values({
        assignmentId,
        studentId: student.id,
        fileUrl,
      })
      .returning();
    
    revalidatePath('/dashboard/student/assignments');
    return submission[0];
  }
}

// Delete a submission
export async function deleteSubmission(submissionId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the submission belongs to the student
  const student = await db.query.students.findFirst({
    where: eq(students.userId, authUser.userId),
  });
  if (!student) throw new Error('Student record not found');

  const submission = await db
    .delete(assignmentSubmissions)
    .where(
      and(
        eq(assignmentSubmissions.id, submissionId),
        eq(assignmentSubmissions.studentId, student.id),
      ),
    )
    .returning();

  revalidatePath('/dashboard/student/assignments');
  return submission[0];
}