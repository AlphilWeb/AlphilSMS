// lib/actions/studentCourse.actions.ts
'use server';

import { db } from '@/lib/db/index';
import { 
  courses, 
  enrollments, 
  students, 
  programs, 
  semesters,
  courseMaterials,
  assignments as assignmentsTable,
  quizzes as quizzesTable,
  assignmentSubmissions,
  quizSubmissions,
  materialViews,
  staff,
  assignments,
  quizzes
} from '@/lib/db/schema';
import { eq, and, notInArray, desc, sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { uploadFileToR2 } from '../file-upload';

// Types
export type EnrolledCourse = {
  id: number;
  name: string;
  code: string;
  credits: number;
  description: string | null;
  programName: string;
  programCode: string;
  semesterName: string;
  materialsCount: number;
  assignmentsCount: number;
  quizzesCount: number;
};

export type AvailableCourse = {
  id: number;
  name: string;
  code: string;
  credits: number;
  description: string | null;
  lecturer: {
    firstName: string | null;
    lastName: string | null;
  } | null;
};

export type CourseMaterial = {
  id: number;
  title: string;
  type: string;
  fileUrl: string;
  uploadedAt: Date;
  viewed: boolean;
};

export type CourseAssignment = {
  id: number;
  title: string;
  description: string | null;
  fileUrl?: string | null;
  dueDate: Date;
  assignedDate: Date;
  submitted: boolean;
  submission?: {
    fileUrl: string;
    submittedAt: Date;
    grade: number | null;
  };
};

export type CourseQuiz = {
  id: number;
  title: string;
  instructions: string | null;
  totalMarks: number;
  quizDate: Date;
  submitted: boolean;
  submission?: {
    fileUrl: string;
    submittedAt: Date;
    score: number | null;
  };
};

export async function getStudentEnrolledCourses(): Promise<EnrolledCourse[]> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.userId) {
      throw new Error('Unauthorized: You must be logged in.');
    }

    const student = await db.query.students.findFirst({
      where: eq(students.userId, authUser.userId),
      columns: { id: true, programId: true, currentSemesterId: true }
    });

    if (!student) {
      throw new Error('Student record not found');
    }

    const enrolledCourses = await db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
        credits: courses.credits,
        description: courses.description,
        programName: programs.name,
        programCode: programs.code,
        semesterName: semesters.name,
        materialsCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${courseMaterials} 
          WHERE ${courseMaterials.courseId} = ${courses.id}
        )`.as('materials_count'),
        assignmentsCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${assignmentsTable} 
          WHERE ${assignmentsTable.courseId} = ${courses.id}
        )`.as('assignments_count'),
        quizzesCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${quizzesTable} 
          WHERE ${quizzesTable.courseId} = ${courses.id}
        )`.as('quizzes_count')
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(programs, eq(courses.programId, programs.id))
      .innerJoin(semesters, eq(courses.semesterId, semesters.id))
      .where(
        and(
          eq(enrollments.studentId, student.id),
          eq(enrollments.semesterId, student.currentSemesterId)
        )
      );

    return enrolledCourses.map(course => ({
      ...course,
      credits: Number(course.credits),
      materialsCount: Number(course.materialsCount),
      assignmentsCount: Number(course.assignmentsCount),
      quizzesCount: Number(course.quizzesCount),
      programName: course.programName ?? '',
      programCode: course.programCode ?? '',
      semesterName: course.semesterName ?? ''
    }));
  } catch (error) {
    console.error('[GET_STUDENT_ENROLLED_COURSES_ERROR]', error);
    throw new Error('Failed to fetch enrolled courses');
  }
}

export async function getAvailableCoursesForEnrollment(): Promise<{
  id: number;
  name: string;
  code: string;
  credits: number;
  description: string | null;
  lecturer: {
    firstName: string | null;
    lastName: string | null;
  } | null;
}[]> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.userId) {
      throw new Error('Unauthorized: You must be logged in.');
    }

    const student = await db.query.students.findFirst({
      where: eq(students.userId, authUser.userId),
      columns: { id: true, programId: true, currentSemesterId: true }
    });

    if (!student) {
      throw new Error('Student record not found');
    }

    const enrolledCourseIds = await db
      .select({ courseId: enrollments.courseId })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, student.id),
          eq(enrollments.semesterId, student.currentSemesterId)
        )
      );

    const availableCourses = await db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
        credits: courses.credits,
        description: courses.description,
        lecturer: {
          firstName: staff.firstName,
          lastName: staff.lastName
        }
      })
      .from(courses)
      .leftJoin(staff, eq(courses.lecturerId, staff.id))
      .where(
        and(
          eq(courses.programId, student.programId),
          eq(courses.semesterId, student.currentSemesterId),
          enrolledCourseIds.length > 0 
            ? notInArray(courses.id, enrolledCourseIds.map(e => e.courseId))
            : undefined
        )
      );

    return availableCourses.map(course => ({
      ...course,
      credits: Number(course.credits),
      lecturer: course.lecturer ? {
        firstName: course.lecturer.firstName,
        lastName: course.lecturer.lastName
      } : null
    }));
  } catch (error) {
    console.error('[GET_AVAILABLE_COURSES_ERROR]', error);
    throw new Error('Failed to fetch available courses');
  }
}

export async function getCourseMaterials(courseId: number): Promise<CourseMaterial[]> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.userId) throw new Error('Unauthorized');

    const student = await db.query.students.findFirst({
      where: eq(students.userId, authUser.userId),
      columns: { id: true }
    });

    if (!student) throw new Error('Student record not found');

    const enrollment = await db.query.enrollments.findFirst({
      where: and(eq(enrollments.studentId, student.id), eq(enrollments.courseId, courseId))
    });

    if (!enrollment) throw new Error('Not enrolled in this course');

    const materials = await db
      .select({
        id: courseMaterials.id,
        title: courseMaterials.title,
        type: courseMaterials.type,
        fileUrl: courseMaterials.fileUrl,
        uploadedAt: courseMaterials.uploadedAt,
        viewed: sql<number>`(
          SELECT COUNT(*) 
          FROM ${materialViews} 
          WHERE ${materialViews.materialId} = ${courseMaterials.id}
          AND ${materialViews.studentId} = ${student.id}
        )`.as('viewed')
      })
      .from(courseMaterials)
      .where(eq(courseMaterials.courseId, courseId))
      .orderBy(desc(courseMaterials.uploadedAt));

    return materials.map(m => ({
      id: m.id,
      title: m.title,
      type: m.type,
      fileUrl: m.fileUrl,
      uploadedAt: m.uploadedAt,
      viewed: Number(m.viewed) > 0
    }));
  } catch (error) {
    console.error('[GET_COURSE_MATERIALS_ERROR]', error);
    throw new Error('Failed to fetch course materials');
  }
}

export async function getCourseAssignments(courseId: number): Promise<CourseAssignment[]> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.userId) throw new Error('Unauthorized');

    const student = await db.query.students.findFirst({
      where: eq(students.userId, authUser.userId),
      columns: { id: true }
    });

    if (!student) throw new Error('Student record not found');

    const enrollment = await db.query.enrollments.findFirst({
      where: and(eq(enrollments.studentId, student.id), eq(enrollments.courseId, courseId))
    });

    if (!enrollment) throw new Error('Not enrolled in this course');

    const assignments = await db
      .select({
        id: assignmentsTable.id,
        title: assignmentsTable.title,
        description: assignmentsTable.description,
        fileUrl: assignmentsTable.fileUrl,
        dueDate: assignmentsTable.dueDate,
        assignedDate: assignmentsTable.assignedDate
      })
      .from(assignmentsTable)
      .where(eq(assignmentsTable.courseId, courseId))
      .orderBy(desc(assignmentsTable.dueDate));

    const assignmentsWithSubmissions = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await db.query.assignmentSubmissions.findFirst({
          where: and(
            eq(assignmentSubmissions.assignmentId, assignment.id),
            eq(assignmentSubmissions.studentId, student.id)
          )
        });

        return {
          ...assignment,
          submitted: !!submission,
          submission: submission ? {
            fileUrl: submission.fileUrl,
            submittedAt: submission.submittedAt,
            grade: submission.grade ? Number(submission.grade) : null
          } : undefined
        };
      })
    );

    return assignmentsWithSubmissions;
  } catch (error) {
    console.error('[GET_COURSE_ASSIGNMENTS_ERROR]', error);
    throw new Error('Failed to fetch course assignments');
  }
}

export async function getCourseQuizzes(courseId: number): Promise<CourseQuiz[]> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.userId) throw new Error('Unauthorized');

    const student = await db.query.students.findFirst({
      where: eq(students.userId, authUser.userId),
      columns: { id: true }
    });

    if (!student) throw new Error('Student record not found');

    const enrollment = await db.query.enrollments.findFirst({
      where: and(eq(enrollments.studentId, student.id), eq(enrollments.courseId, courseId))
    });

    if (!enrollment) throw new Error('Not enrolled in this course');

    const quizzes = await db
      .select({
        id: quizzesTable.id,
        title: quizzesTable.title,
        instructions: quizzesTable.instructions,
        totalMarks: quizzesTable.totalMarks,
        quizDate: quizzesTable.quizDate
      })
      .from(quizzesTable)
      .where(eq(quizzesTable.courseId, courseId))
      .orderBy(desc(quizzesTable.quizDate));

    const quizzesWithSubmissions = await Promise.all(
      quizzes.map(async (quiz) => {
        const submission = await db.query.quizSubmissions.findFirst({
          where: and(
            eq(quizSubmissions.quizId, quiz.id),
            eq(quizSubmissions.studentId, student.id)
          )
        });

        return {
          ...quiz,
          submitted: !!submission,
          submission: submission ? {
            fileUrl: submission.fileUrl,
            submittedAt: submission.submittedAt,
            score: submission.score ? Number(submission.score) : null
          } : undefined
        };
      })
    );

    return quizzesWithSubmissions;
  } catch (error) {
    console.error('[GET_COURSE_QUIZZES_ERROR]', error);
    throw new Error('Failed to fetch course quizzes');
  }
}

// Add to lib/actions/studentCourse.actions.ts

export async function submitAssignment(assignmentId: number, formData: FormData) {
  const authUser = await getAuthUser();
  if (!authUser?.userId) throw new Error('Unauthorized');

  const student = await db.query.students.findFirst({
    where: eq(students.userId, authUser.userId),
    columns: { id: true }
  });

  if (!student) throw new Error('Student record not found');

  // Verify the student is enrolled in the course for this assignment
  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, assignmentId),
    with: {
      course: {
        with: {
          enrollments: {
            where: eq(enrollments.studentId, student.id)
          }
        }
      }
    }
  });

  if (!assignment || assignment.course.enrollments.length === 0) {
    throw new Error('Assignment not found or unauthorized access');
  }

  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  const fileUrl = await uploadFileToR2(file, "assignment-submissions");

  const submission = await db.insert(assignmentSubmissions).values({
    assignmentId,
    studentId: student.id,
    fileUrl,
    submittedAt: new Date()
  }).returning();

  revalidatePath(`/dashboard/student/courses/${assignment.course.id}`);
  return submission[0];
}

export async function submitQuiz(quizId: number, formData: FormData) {
  const authUser = await getAuthUser();
  if (!authUser?.userId) throw new Error('Unauthorized');

  const student = await db.query.students.findFirst({
    where: eq(students.userId, authUser.userId),
    columns: { id: true }
  });

  if (!student) throw new Error('Student record not found');

  // Verify the student is enrolled in the course for this quiz
  const quiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizId),
    with: {
      course: {
        with: {
          enrollments: {
            where: eq(enrollments.studentId, student.id)
          }
        }
      }
    }
  });

  if (!quiz || quiz.course.enrollments.length === 0) {
    throw new Error('Quiz not found or unauthorized access');
  }

  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  const fileUrl = await uploadFileToR2(file, "quiz-submissions");

  const submission = await db.insert(quizSubmissions).values({
    quizId,
    studentId: student.id,
    fileUrl,
    submittedAt: new Date()
  }).returning();

  revalidatePath(`/dashboard/student/courses/${quiz.course.id}`);
  return submission[0];
}

export async function recordMaterialView(materialId: number): Promise<{ success: boolean }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.userId) throw new Error('Unauthorized');

    const student = await db.query.students.findFirst({
      where: eq(students.userId, authUser.userId),
      columns: { id: true }
    });

    if (!student) throw new Error('Student record not found');

    const material = await db.query.courseMaterials.findFirst({
      where: eq(courseMaterials.id, materialId),
      with: {
        course: {
          columns: { id: true },
          with: {
            enrollments: {
              where: eq(enrollments.studentId, student.id)
            }
          }
        }
      }
    });

    if (!material || material.course.enrollments.length === 0) {
      throw new Error('Material not found or unauthorized access');
    }

    const existingView = await db.query.materialViews.findFirst({
      where: and(
        eq(materialViews.materialId, materialId),
        eq(materialViews.studentId, student.id)
      )
    });

    if (!existingView) {
      await db.insert(materialViews).values({
        materialId,
        studentId: student.id,
        interactionType: 'viewed'
      });
    }

    return { success: true };
  } catch (error) {
    console.error('[RECORD_MATERIAL_VIEW_ERROR]', error);
    throw new Error('Failed to record material view');
  }
}