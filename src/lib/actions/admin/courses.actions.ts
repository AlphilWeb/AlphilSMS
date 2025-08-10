// lib/actions/admin.manage.courses.action.ts
'use server';

import { db } from '@/lib/db';
import { courses, staff, assignments, courseMaterials, userLogs } from '@/lib/db/schema';
import { and, eq, sql, ne } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActionError } from '@/lib/utils';

// Types
export type CourseWithDetails = {
  id: number;
  name: string;
  code: string;
  credits: number | string;
  description: string | null;
  program: {
    id: number;
    name: string;
    department: {
      id: number;
      name: string;
    };
  };
  semester: {
    id: number;
    name: string;
  };
  lecturer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CourseFormValues = {
  name: string;
  code: string;
  credits: number | string;
  description?: string;
  programId: number;
  semesterId: number;
  lecturerId?: number;
};

// Get all courses with basic details
export async function getAllCourses(): Promise<CourseWithDetails[]> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

return db.query.courses.findMany({
  with: {
    program: {
      with: {
        department: true,
      },
    },
    semester: true,
    lecturer: true,
  },
});
}

// Get course details by ID
export async function getCourseDetails(courseId: number): Promise<CourseWithDetails> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

const course = await db.query.courses.findFirst({
  where: eq(courses.id, courseId),
  with: {
    program: {
      with: {
        department: true, // This will fetch the department details
      },
    },
    semester: true, // This will fetch the semester details
    lecturer: true, // This will fetch the lecturer details
  },
});

if (!course) {
  throw new ActionError('Course not found');
}

return course;
}

// Create a new course

export async function createCourse(data: CourseFormValues) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Validate course code uniqueness within program and semester
  const existingCourse = await db
    .select()
    .from(courses)
    .where(
      and(
        eq(courses.code, data.code),
        eq(courses.programId, data.programId),
        eq(courses.semesterId, data.semesterId)
      )
    )
    .then((res) => res[0]);

  if (existingCourse) {
    throw new ActionError('Course with this code already exists in the selected program and semester');
  }

  // 1. Insert the new course and return its basic details
  const [insertedCourse] = await db
    .insert(courses)
    .values({
      name: data.name,
      code: data.code,
      credits: String(data.credits),
      description: data.description,
      programId: data.programId,
      semesterId: data.semesterId,
      lecturerId: data.lecturerId,
    })
    .returning();

  if (!insertedCourse) {
    throw new ActionError('Failed to create course');
  }

  // 2. Query the database again to get the full CourseWithDetails object
  //    This step is necessary to satisfy the `setCourses` type
  const newCourseWithDetails = await db.query.courses.findFirst({
    where: eq(courses.id, insertedCourse.id),
    with: {
      program: {
        with: {
          department: true,
        },
      },
      semester: true,
      lecturer: true,
    },
  });

  if (!newCourseWithDetails) {
    throw new ActionError('Failed to retrieve full course details after creation');
  }

  // 3. Log the action using the ID of the new course
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'create',
    targetTable: 'courses',
    targetId: newCourseWithDetails.id,
    description: `Created course "${data.name}" (${data.code})`,
  });

  revalidatePath('/dashboard/admin/courses');

  // 4. Return the fully detailed course object
  return newCourseWithDetails;
}

// Update course details
// Update course details
export async function updateCourse(
  courseId: number,
  data: Partial<CourseFormValues>
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Prepare update data with proper types
  const updateData: Partial<{
    name: string;
    code: string;
    credits: number;
    description: string | null;
    programId: number;
    semesterId: number;
    lecturerId: number | null;
    updatedAt: Date;
  }> = {
    updatedAt: new Date(),
  };

  // Add only the fields that are provided
  if (data.name !== undefined) updateData.name = data.name;
  if (data.code !== undefined) updateData.code = data.code;
  if (data.credits !== undefined) updateData.credits = Number(data.credits);
  if (data.description !== undefined) {
    updateData.description = data.description || null;
  }
  if (data.programId !== undefined) updateData.programId = data.programId;
  if (data.semesterId !== undefined) updateData.semesterId = data.semesterId;
  if (data.lecturerId !== undefined) {
    updateData.lecturerId = data.lecturerId || null;
  }

  // If updating code, validate uniqueness
  if (data.code) {
    const existingCourse = await db
      .select()
      .from(courses)
      .where(
        and(
          eq(courses.code, data.code),
          eq(courses.programId, data.programId ?? sql`${courses.programId}`),
          eq(courses.semesterId, data.semesterId ?? sql`${courses.semesterId}`),
          ne(courses.id, courseId)
        )
      )
      .then((res) => res[0]);

    if (existingCourse) {
      throw new ActionError('Course with this code already exists in the selected program and semester');
    }
  }

const updatedCourse = await db
  .update(courses)
  .set({
    ...data,
    credits: data.credits !== undefined ? String(data.credits) : undefined,
    updatedAt: new Date(),
  })
  .where(eq(courses.id, courseId))
  .returning();

  const fullCourseDetails = await getCourseDetails(updatedCourse[0].id);
  
  if (updatedCourse.length === 0) {
    throw new ActionError('Course not found');
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'update',
    targetTable: 'courses',
    targetId: courseId,
    description: `Updated course details`,
  });

  revalidatePath('/dashboard/admin/courses');
  revalidatePath(`/dashboard/admin/courses/${courseId}`);
  return fullCourseDetails;
//   return updatedCourse[0];
}
// Assign lecturer to course
export async function assignCourseLecturer(
  courseId: number,
  lecturerId: number
) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Verify the staff member exists
  const staffMember = await db
    .select()
    .from(staff)
    .where(eq(staff.id, lecturerId))
    .then((res) => res[0]);

  if (!staffMember) {
    throw new ActionError('Staff member not found');
  }

  const updatedCourse = await db
    .update(courses)
    .set({
      lecturerId,
    })
    .where(eq(courses.id, courseId))
    .returning();

  if (updatedCourse.length === 0) {
    throw new ActionError('Course not found');
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'update',
    targetTable: 'courses',
    targetId: courseId,
    description: `Assigned ${staffMember.firstName} ${staffMember.lastName} as course lecturer`,
  });

  revalidatePath('/dashboard/admin/courses');
  revalidatePath(`/dashboard/admin/courses/${courseId}`);
  const fullCourseDetails = await getCourseDetails(updatedCourse[0].id);

  return fullCourseDetails;

//   return updatedCourse[0];
}

// Remove lecturer from course
export async function removeCourseLecturer(courseId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // 1. Initial check to find the course and confirm a lecturer exists
  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .then((res) => res[0]);

  if (!course) {
    throw new ActionError('Course not found');
  }

  if (!course.lecturerId) {
    throw new ActionError('No lecturer assigned to this course');
  }

  // 2. Perform the update to set lecturerId to null
  const updatedCourseArray = await db
    .update(courses)
    .set({
      lecturerId: null,
    })
    .where(eq(courses.id, courseId))
    .returning();

  if (updatedCourseArray.length === 0) {
    throw new ActionError('Course not found during update');
  }

  // 3. Fetch the full, updated course details with its relations
  // This is the crucial step to resolve the type mismatch
  const updatedCourseWithDetails = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      program: {
        with: {
          department: true,
        },
      },
      semester: true,
      lecturer: true, // This will correctly be null in the returned object
    },
  });

  if (!updatedCourseWithDetails) {
    throw new ActionError('Failed to retrieve full course details after update');
  }

  // 4. Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'update',
    targetTable: 'courses',
    targetId: courseId,
    description: 'Removed lecturer from course',
  });

  // 5. Revalidate paths and return the full object
  revalidatePath('/dashboard/admin/courses');
  revalidatePath(`/dashboard/admin/courses/${courseId}`);
  return updatedCourseWithDetails;
}

// Delete a course (only if no materials/assignments exist)
export async function deleteCourse(courseId: number) {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Unauthorized');

  // Check if course has any materials or assignments
  const [materialCount, assignmentCount] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(courseMaterials)
      .where(eq(courseMaterials.courseId, courseId))
      .then((res) => res[0].count),
    db
      .select({ count: sql<number>`count(*)` })
      .from(assignments)
      .where(eq(assignments.courseId, courseId))
      .then((res) => res[0].count),
  ]);

  if (materialCount > 0 || assignmentCount > 0) {
    throw new ActionError(
      'Cannot delete course with materials or assignments'
    );
  }

  const course = await db
    .delete(courses)
    .where(eq(courses.id, courseId))
    .returning();

  if (course.length === 0) {
    throw new ActionError('Course not found');
  }

  // Log the action
  await db.insert(userLogs).values({
    userId: authUser.userId,
    action: 'delete',
    targetTable: 'courses',
    targetId: courseId,
    description: `Deleted course "${course[0].name}" (${course[0].code})`,
  });

  revalidatePath('/dashboard/admin/courses');
  return { success: true };
}