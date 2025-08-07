// lib/actions/lecturer.manage.courses.action.ts
'use server';

import { db } from '@/lib/db';
import {
  courses,
  courseMaterials,
  enrollments,
  students,
  programs,
  semesters,
  staff,
  timetables,
} from '@/lib/db/schema';
import { and, eq, desc, asc, sql } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { uploadFileToR2 } from '@/lib/file-upload';

// Types
export type CourseWithProgram = {
  id: number;
  name: string;
  code: string;
  credits: string;
  description: string | null;
  program: {
    id: number;
    name: string;
    code: string;
  };
  semester: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
};

// In lib/actions/lecturer.manage.courses.action.ts
export type CourseMaterial = {
  id: number;
  courseId?: number; // Make optional since it might not always be returned
  uploadedById?: number; // Make optional
  title: string;
  type: string;
  fileUrl: string | null;
  content: string | object | null; // Accept both string and object for backward compatibility
  uploadedAt: Date;
};

export type CourseMaterialContent = {
  html: string;
  json?: object; // Make this optional for backward compatibility
  createdAt?: string;
  version?: string;
};

export type CourseDetails = CourseWithProgram & {
  studentCount: number;
  materialsCount: number;
};

export type CourseEnrollment = {
  id: number;
  enrollmentDate: string | null;
  student: {
    id: number;
    firstName: string;
    lastName: string;
    registrationNumber: string;
    email: string;
  };
};

// Get all courses taught by the lecturer
export async function getLecturerCourses() {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  return db
    .select({
      id: courses.id,
      name: courses.name,
      code: courses.code,
      credits: courses.credits,
      description: courses.description,
      program: {
        id: programs.id,
        name: programs.name,
        code: programs.code,
      },
      semester: {
        id: semesters.id,
        name: semesters.name,
        startDate: semesters.startDate,
        endDate: semesters.endDate,
      },
    })
    .from(courses)
    .innerJoin(programs, eq(programs.id, courses.programId))
    .innerJoin(semesters, eq(semesters.id, courses.semesterId))
    .innerJoin(staff, eq(staff.id, courses.lecturerId))
    .where(eq(staff.userId, authUser.userId))
    .orderBy(desc(semesters.startDate), asc(courses.name));
}

// Get course details with statistics
export async function getCourseDetails(courseId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the course is taught by the lecturer
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

  const [courseWithProgram, stats] = await Promise.all([
    db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
        credits: courses.credits,
        description: courses.description,
        program: {
          id: programs.id,
          name: programs.name,
          code: programs.code,
        },
        semester: {
          id: semesters.id,
          name: semesters.name,
          startDate: semesters.startDate,
          endDate: semesters.endDate,
        },
      })
      .from(courses)
      .innerJoin(programs, eq(programs.id, courses.programId))
      .innerJoin(semesters, eq(semesters.id, courses.semesterId))
      .where(eq(courses.id, courseId))
      .then((res) => res[0]),

    db
      .select({
        studentCount: sql<number>`count(distinct ${enrollments.studentId})`,
        materialsCount: sql<number>`count(distinct ${courseMaterials.id})`,
      })
      .from(enrollments)
      .leftJoin(courseMaterials, eq(courseMaterials.courseId, courseId))
      .where(eq(enrollments.courseId, courseId))
      .then((res) => res[0]),
  ]);

  return {
    ...courseWithProgram,
    ...stats,
  };
}

// Get all materials for a course
export async function getCourseMaterials(courseId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the course is taught by the lecturer
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

  const materials = await db
    .select({
      id: courseMaterials.id,
      title: courseMaterials.title,
      type: courseMaterials.type,
      fileUrl: courseMaterials.fileUrl || null,
      content: courseMaterials.content || null,
      uploadedAt: courseMaterials.uploadedAt,
    })
    .from(courseMaterials)
    .where(eq(courseMaterials.courseId, courseId))
    .orderBy(desc(courseMaterials.uploadedAt));

  return materials.map(material => {
    if (material.type === 'notes' && material.content) {
      try {
        // Handle both string and object content
        const content = typeof material.content === 'string' 
          ? JSON.parse(material.content) 
          : material.content;
        
        return {
          ...material,
          content: {
            html: content.html || (typeof material.content === 'string' ? material.content : ''),
            json: content.json || {}
          }
        };
      } catch {
        return {
          ...material,
          content: {
            html: typeof material.content === 'string' ? material.content : '',
            json: {}
          }
        };
      }
    }
    return material;
  });
}

// Upload new course material
export async function uploadCourseMaterial(
  courseId: number,
  formData: FormData,
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the course is taught by the lecturer
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
    .then((res) => res[0]);

  if (!course) throw new Error('Course not found or unauthorized');

  const title = formData.get('title') as string;
  const type = formData.get('type') as string;

if (type === 'notes') {
  const content = formData.get('content') as string;
  
  // Parse the content if it's a JSON string
  let contentData: CourseMaterialContent;
  try {
    const parsedContent = JSON.parse(content);
    contentData = {
      html: parsedContent.html || parsedContent,
      json: parsedContent.json || {},
      createdAt: new Date().toISOString(),
      version: '1.0'
    };
  } catch {
    // Fallback to plain HTML if parsing fails
    contentData = {
      html: content,
      json: {}, // Empty JSON as fallback
      createdAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  const newMaterial = await db
    .insert(courseMaterials)
    .values({
      courseId,
      uploadedById: course.staff.id,
      title,
      type,
      content: contentData,
      fileUrl: null,
    })
    .returning();

    revalidatePath(`/dashboard/lecturer/courses/${courseId}/materials`);
    return newMaterial[0];
  } else {
    // File upload handling remains the same
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      throw new Error('File is required for this material type');
    }

    const fileUrl = await uploadFileToR2(file, 'course-materials');

    const newMaterial = await db
      .insert(courseMaterials)
      .values({
        courseId,
        uploadedById: course.staff.id,
        title,
        type,
        fileUrl,
        content: null,
      })
      .returning();

    revalidatePath(`/dashboard/lecturer/courses/${courseId}/materials`);
    return newMaterial[0];
  }
}

// Delete course material
export async function deleteCourseMaterial(materialId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the material belongs to a course taught by the lecturer
  const material = await db
    .select()
    .from(courseMaterials)
    .innerJoin(courses, eq(courses.id, courseMaterials.courseId))
    .innerJoin(staff, eq(staff.id, courses.lecturerId))
    .where(
      and(
        eq(courseMaterials.id, materialId),
        eq(staff.userId, authUser.userId),
      ),
    )
    .then((res) => res[0]?.course_materials);

  if (!material) throw new Error('Material not found or unauthorized');

  await db.delete(courseMaterials).where(eq(courseMaterials.id, materialId));

  revalidatePath(`/dashboard/lecturer/courses/${material.courseId}/materials`);
  return { success: true };
}

// Get all enrolled students for a course
export async function getCourseEnrollments(courseId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the course is taught by the lecturer
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

  return db
    .select({
      id: enrollments.id,
      enrollmentDate: enrollments.enrollmentDate,
      student: {
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        registrationNumber: students.registrationNumber,
        email: students.email,
      },
    })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(eq(enrollments.courseId, courseId))
    .orderBy(students.lastName, students.firstName);
}

// Get course timetable
export async function getCourseTimetable(courseId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the course is taught by the lecturer
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

  return db
    .select({
      dayOfWeek: timetables.dayOfWeek,
      startTime: timetables.startTime,
      endTime: timetables.endTime,
      room: timetables.room,
    })
    .from(timetables)
    .where(eq(timetables.courseId, courseId))
    .orderBy(
      timetables.dayOfWeek,
      timetables.startTime,
    );
}