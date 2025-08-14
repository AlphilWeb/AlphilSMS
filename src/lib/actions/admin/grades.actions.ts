// app/actions/grades.ts
'use server';

import { db } from '@/lib/db'; // Your Drizzle DB instance
import { 
  grades, 
  enrollments, 
  students, 
  courses, 
  semesters,
  programs,
  departments,
  NewGrade, SelectGrade
} from '@/lib/db/schema';
import { and, eq, sql, inArray, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
// import { redirect } from 'next/navigation';

// Types from your schema
export type GradeData = {
  enrollmentId: number;
  catScore?: string | null;
  examScore?: string | null;
  totalScore?: string | null;
  letterGrade?: string | null;
  gpa?: string | null;
};

export type GradeWithDetails = {
  id: number;
  catScore: string | null;
  examScore: string | null;
  totalScore: string | null;
  letterGrade: string | null;
  gpa: string | null;
  enrollment: {
    id: number;
    student: {
      id: number;
      firstName: string;
      lastName: string;
      registrationNumber: string;
      studentNumber: string;
    };
    course: {
      id: number;
      name: string;
      code: string;
      credits: string | null;
      program: {
        id: number;
        name: string;
        department: {
          id: number;
          name: string;
        };
      };
    };
    semester: {
      id: number;
      name: string;
      startDate: string;
      endDate: string;
    };
  };
};

export type BulkGradeUpdateData = {
  courseId: number;
  semesterId: number;
  grades: Array<{
    studentId: number;
    catScore?: number | null;
    examScore?: number | null;
    letterGrade?: string | null;
    gpa?: number | null;
  }>;
};

/**
 * Fetches all grades with student, course, and semester details
 */
export async function getAllGrades(): Promise<GradeWithDetails[]> {
  try {
    const rawData = await db
      .select({
        id: grades.id,
        catScore: grades.catScore,
        examScore: grades.examScore,
        totalScore: grades.totalScore,
        letterGrade: grades.letterGrade,
        gpa: grades.gpa,
        enrollmentId: enrollments.id,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
        studentNumber: students.studentNumber,
        courseId: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        courseCredits: courses.credits,
        programId: programs.id,
        programName: programs.name,
        departmentId: departments.id,
        departmentName: departments.name,
        semesterId: semesters.id,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
      })
      .from(grades)
      .leftJoin(enrollments, eq(grades.enrollmentId, enrollments.id))
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(programs, eq(courses.programId, programs.id))
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id));

    // Map the flat result to the nested GradeWithDetails type
    const mappedData: GradeWithDetails[] = rawData
      .filter(
        (row) => row.enrollmentId !== null && row.studentId !== null && row.courseId !== null
      )
      .map((row) => ({
        id: row.id,
        catScore: row.catScore,
        examScore: row.examScore,
        totalScore: row.totalScore,
        letterGrade: row.letterGrade,
        gpa: row.gpa,
        enrollment: {
          id: row.enrollmentId!,
          student: {
            id: row.studentId!,
            firstName: row.studentFirstName ?? '',
            lastName: row.studentLastName ?? '',
            registrationNumber: row.studentRegistrationNumber ?? '',
            studentNumber: row.studentNumber ?? '',
          },
          course: {
            id: row.courseId!,
            name: row.courseName ?? '',
            code: row.courseCode ?? '',
            credits: row.courseCredits ?? '',
            program: {
              id: row.programId!,
              name: row.programName ?? '',
              department: {
                id: row.departmentId!,
                name: row.departmentName ?? '',
              },
            },
          },
          semester: {
            id: row.semesterId!,
            name: row.semesterName ?? '',
            startDate: row.semesterStartDate ?? '',
            endDate: row.semesterEndDate ?? '',
          },
        },
      }));

    return mappedData;
  } catch (error) {
    console.error('Failed to fetch grades:', error);
    throw new Error('Failed to fetch grades');
  }
}

/**
 * Fetches grades by semester with student and course details
 */

export async function getGradesBySemester(semesterId: number): Promise<GradeWithDetails[]> {
  try {
    // Drizzle's select method returns a flat structure.
    // We explicitly select each column and alias it to avoid naming conflicts.
    const rawData = await db
      .select({
        id: grades.id,
        catScore: grades.catScore,
        examScore: grades.examScore,
        totalScore: grades.totalScore,
        letterGrade: grades.letterGrade,
        gpa: grades.gpa,
        enrollmentId: enrollments.id,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
        studentNumber: students.studentNumber,
        courseId: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        courseCredits: courses.credits,
        programId: programs.id,
        programName: programs.name,
        departmentId: departments.id,
        departmentName: departments.name,
        semesterId: semesters.id,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
      })
      .from(grades)
      .leftJoin(enrollments, eq(grades.enrollmentId, enrollments.id))
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(programs, eq(courses.programId, programs.id))
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id))
      .where(eq(enrollments.semesterId, semesterId));

    // The rawData is a flat array of objects. We must now manually map it
    // into the nested structure defined by GradeWithDetails.
    // We also handle potential null values from the left joins.
    const mappedData: GradeWithDetails[] = rawData
      // Filter out any rows where the core relationships are null.
      // After this filter, we can safely use the non-null assertion operator (!).
      .filter(
        (row) => row.enrollmentId !== null && row.studentId !== null && row.courseId !== null
      )
      .map((row) => ({
        id: row.id,
        // Convert number scores and gpa to strings, or assign null if they are null
        catScore: row.catScore ? String(row.catScore) : null,
        examScore: row.examScore ? String(row.examScore) : null,
        totalScore: row.totalScore ? String(row.totalScore) : null,
        letterGrade: row.letterGrade,
        gpa: row.gpa ? String(row.gpa) : null,
        enrollment: {
          id: row.enrollmentId!,
          student: {
            id: row.studentId!,
            // Use null coalescing to provide an empty string for null values
            firstName: row.studentFirstName ?? '',
            lastName: row.studentLastName ?? '',
            registrationNumber: row.studentRegistrationNumber ?? '',
            studentNumber: row.studentNumber ?? '',
          },
          course: {
            id: row.courseId!,
            name: row.courseName ?? '',
            code: row.courseCode ?? '',
            // Convert credits to string, or assign null
            credits: row.courseCredits ? String(row.courseCredits) : null,
            program: {
              id: row.programId!,
              name: row.programName ?? '',
              department: {
                id: row.departmentId!,
                name: row.departmentName ?? '',
              },
            },
          },
          semester: {
            id: row.semesterId!,
            name: row.semesterName ?? '',
            startDate: row.semesterStartDate ?? '',
            endDate: row.semesterEndDate ?? '',
          },
        },
      }));

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch grades for semester ${semesterId}:`, error);
    throw new Error('Failed to fetch grades by semester');
  }
}

/**
 * Fetches grades by course with student details
 */
export async function getGradesByCourse(courseId: number): Promise<GradeWithDetails[]> {
  try {
    // Drizzle's select returns a flat structure. We select all necessary
    // columns and give them unique aliases.
    const rawData = await db
      .select({
        id: grades.id,
        catScore: grades.catScore,
        examScore: grades.examScore,
        totalScore: grades.totalScore,
        letterGrade: grades.letterGrade,
        gpa: grades.gpa,
        enrollmentId: enrollments.id,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
        studentNumber: students.studentNumber,
        courseId: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        courseCredits: courses.credits,
        programId: programs.id,
        programName: programs.name,
        departmentId: departments.id,
        departmentName: departments.name,
        semesterId: semesters.id,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
      })
      .from(grades)
      .leftJoin(enrollments, eq(grades.enrollmentId, enrollments.id))
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(programs, eq(courses.programId, programs.id))
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id))
      .where(eq(enrollments.courseId, courseId));

    // Manually map the flat data into the nested structure.
    const mappedData: GradeWithDetails[] = rawData
      .filter(
        // Filter out records with null key relationships
        (row) => row.enrollmentId !== null && row.studentId !== null && row.courseId !== null
      )
      .map((row) => ({
        id: row.id,
        // Convert number scores and gpa to strings, or null if they are null
        catScore: row.catScore ? String(row.catScore) : null,
        examScore: row.examScore ? String(row.examScore) : null,
        totalScore: row.totalScore ? String(row.totalScore) : null,
        letterGrade: row.letterGrade,
        gpa: row.gpa ? String(row.gpa) : null,
        enrollment: {
          id: row.enrollmentId!,
          student: {
            id: row.studentId!,
            firstName: row.studentFirstName ?? '',
            lastName: row.studentLastName ?? '',
            registrationNumber: row.studentRegistrationNumber ?? '',
            studentNumber: row.studentNumber ?? '',
          },
          course: {
            id: row.courseId!,
            name: row.courseName ?? '',
            code: row.courseCode ?? '',
            // Convert credits to string, or null
            credits: row.courseCredits ? String(row.courseCredits) : null,
            program: {
              id: row.programId!,
              name: row.programName ?? '',
              department: {
                id: row.departmentId!,
                name: row.departmentName ?? '',
              },
            },
          },
          semester: {
            id: row.semesterId!,
            name: row.semesterName ?? '',
            startDate: row.semesterStartDate ?? '',
            endDate: row.semesterEndDate ?? '',
          },
        },
      }));

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch grades for course ${courseId}:`, error);
    throw new Error('Failed to fetch grades by course');
  }
}

/**
 * Fetches grades by student with course and semester details
 */
export async function getGradesByStudent(studentId: number): Promise<GradeWithDetails[]> {
  try {
    // Drizzle's select returns a flat structure. We select all necessary
    // columns and give them unique aliases.
    const rawData = await db
      .select({
        id: grades.id,
        catScore: grades.catScore,
        examScore: grades.examScore,
        totalScore: grades.totalScore,
        letterGrade: grades.letterGrade,
        gpa: grades.gpa,
        enrollmentId: enrollments.id,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
        studentNumber: students.studentNumber,
        courseId: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        courseCredits: courses.credits,
        programId: programs.id,
        programName: programs.name,
        departmentId: departments.id,
        departmentName: departments.name,
        semesterId: semesters.id,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
      })
      .from(grades)
      .leftJoin(enrollments, eq(grades.enrollmentId, enrollments.id))
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(programs, eq(courses.programId, programs.id))
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id))
      .where(eq(enrollments.studentId, studentId));

    // Manually map the flat data into the nested structure.
    const mappedData: GradeWithDetails[] = rawData
      .filter(
        // Filter out records with null key relationships
        (row) => row.enrollmentId !== null && row.studentId !== null && row.courseId !== null
      )
      .map((row) => ({
        id: row.id,
        // Convert number scores and gpa to strings, or null if they are null
        catScore: row.catScore ? String(row.catScore) : null,
        examScore: row.examScore ? String(row.examScore) : null,
        totalScore: row.totalScore ? String(row.totalScore) : null,
        letterGrade: row.letterGrade,
        gpa: row.gpa ? String(row.gpa) : null,
        enrollment: {
          id: row.enrollmentId!,
          student: {
            id: row.studentId!,
            firstName: row.studentFirstName ?? '',
            lastName: row.studentLastName ?? '',
            registrationNumber: row.studentRegistrationNumber ?? '',
            studentNumber: row.studentNumber ?? '',
          },
          course: {
            id: row.courseId!,
            name: row.courseName ?? '',
            code: row.courseCode ?? '',
            // Convert credits to string, or null
            credits: row.courseCredits ? String(row.courseCredits) : null,
            program: {
              id: row.programId!,
              name: row.programName ?? '',
              department: {
                id: row.departmentId!,
                name: row.departmentName ?? '',
              },
            },
          },
          semester: {
            id: row.semesterId!,
            name: row.semesterName ?? '',
            startDate: row.semesterStartDate ?? '',
            endDate: row.semesterEndDate ?? '',
          },
        },
      }));

    return mappedData;
  } catch (error) {
    console.error(`Failed to fetch grades for student ${studentId}:`, error);
    throw new Error('Failed to fetch grades by student');
  }
}

/**
 * Fetches a single grade by ID with all details
 */
export async function getGradeById(gradeId: number): Promise<GradeWithDetails | null> {
  try {
    const rawData = await db
      .select({
        id: grades.id,
        catScore: grades.catScore,
        examScore: grades.examScore,
        totalScore: grades.totalScore,
        letterGrade: grades.letterGrade,
        gpa: grades.gpa,
        enrollmentId: enrollments.id,
        studentId: students.id,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegistrationNumber: students.registrationNumber,
        studentNumber: students.studentNumber,
        courseId: courses.id,
        courseName: courses.name,
        courseCode: courses.code,
        courseCredits: courses.credits,
        programId: programs.id,
        programName: programs.name,
        departmentId: departments.id,
        departmentName: departments.name,
        semesterId: semesters.id,
        semesterName: semesters.name,
        semesterStartDate: semesters.startDate,
        semesterEndDate: semesters.endDate,
      })
      .from(grades)
      .leftJoin(enrollments, eq(grades.enrollmentId, enrollments.id))
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(programs, eq(courses.programId, programs.id))
      .leftJoin(departments, eq(programs.departmentId, departments.id))
      .leftJoin(semesters, eq(enrollments.semesterId, semesters.id))
      .where(eq(grades.id, gradeId))
      .limit(1);

    const result = rawData[0];

    // If no grade is found, return null.
    if (!result || result.enrollmentId === null || result.studentId === null || result.courseId === null) {
        return null;
    }

    // Manually map the flat data into the nested structure.
    const mappedData: GradeWithDetails = {
        id: result.id,
        catScore: result.catScore ? String(result.catScore) : null,
        examScore: result.examScore ? String(result.examScore) : null,
        totalScore: result.totalScore ? String(result.totalScore) : null,
        letterGrade: result.letterGrade,
        gpa: result.gpa ? String(result.gpa) : null,
        enrollment: {
            id: result.enrollmentId!,
            student: {
                id: result.studentId!,
                firstName: result.studentFirstName ?? '',
                lastName: result.studentLastName ?? '',
                registrationNumber: result.studentRegistrationNumber ?? '',
                studentNumber: result.studentNumber ?? '',
            },
            course: {
                id: result.courseId!,
                name: result.courseName ?? '',
                code: result.courseCode ?? '',
                credits: result.courseCredits ? String(result.courseCredits) : null,
                program: {
                    id: result.programId!,
                    name: result.programName ?? '',
                    department: {
                        id: result.departmentId!,
                        name: result.departmentName ?? '',
                    },
                },
            },
            semester: {
                id: result.semesterId!,
                name: result.semesterName ?? '',
                startDate: result.semesterStartDate ?? '',
                endDate: result.semesterEndDate ?? '',
            },
        },
    };

    return mappedData;

  } catch (error) {
    console.error(`Failed to fetch grade ${gradeId}:`, error);
    throw new Error('Failed to fetch grade by ID');
  }
}

/**
 * Creates a new grade record
 */
export async function createGrade(gradeData: GradeData) {
  try {
    // Create a new payload to build the final object for the database.
    const payload: GradeData = {
      ...gradeData,
      totalScore: null,
    };

    // Convert string scores to numbers for calculation.
    const catScoreNum = payload.catScore ? parseFloat(payload.catScore) : null;
    const examScoreNum = payload.examScore ? parseFloat(payload.examScore) : null;

    // Check if both scores are valid numbers before calculating the total.
    if (catScoreNum !== null && examScoreNum !== null && !isNaN(catScoreNum) && !isNaN(examScoreNum)) {
      payload.totalScore = String(catScoreNum + examScoreNum);
    }

    const result = await db.insert(grades).values(payload).returning();

    revalidatePath('/admin/grades');
    return result[0];
  } catch (error) {
    console.error('Failed to create grade:', error);
    throw new Error('Failed to create grade');
  }
}

/**
 * Updates an existing grade record
 */
export async function updateGrade(gradeId: number, gradeData: Partial<GradeData>) {
  try {
    // Create a new payload to build the final object for the database.
    const updatePayload: Partial<GradeData> = { ...gradeData };

    // If updating CAT or exam scores, recalculate the total.
    if (updatePayload.catScore !== undefined || updatePayload.examScore !== undefined) {
      const existingGrade = await db
        .select()
        .from(grades)
        .where(eq(grades.id, gradeId))
        .limit(1)
        .execute();

      const currentGrade = existingGrade[0];
      if (!currentGrade) {
        throw new Error(`Grade with ID ${gradeId} not found.`);
      }

      // Convert all scores to numbers for calculation.
      const existingCatScore = currentGrade.catScore ? parseFloat(currentGrade.catScore) : 0;
      const existingExamScore = currentGrade.examScore ? parseFloat(currentGrade.examScore) : 0;

      // Use the new score if provided, otherwise use the existing one.
      const newCatScore = updatePayload.catScore !== undefined
        ? (updatePayload.catScore ? parseFloat(updatePayload.catScore) : 0)
        : existingCatScore;
      const newExamScore = updatePayload.examScore !== undefined
        ? (updatePayload.examScore ? parseFloat(updatePayload.examScore) : 0)
        : existingExamScore;

      // Check if both scores are valid numbers before calculating the total.
      if (!isNaN(newCatScore) && !isNaN(newExamScore)) {
        updatePayload.totalScore = String(newCatScore + newExamScore);
      }
    }

    // Now update the database with the corrected payload.
    const result = await db
      .update(grades)
      .set(updatePayload)
      .where(eq(grades.id, gradeId))
      .returning();

    revalidatePath('/admin/grades');
    return result[0];
  } catch (error) {
    console.error(`Failed to update grade ${gradeId}:`, error);
    throw new Error('Failed to update grade');
  }
}

/**
 * Deletes a grade record
 */
export async function deleteGrade(gradeId: number) {
  try {
    await db.delete(grades).where(eq(grades.id, gradeId));

    revalidatePath('/admin/grades');
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete grade ${gradeId}:`, error);
    throw new Error('Failed to delete grade');
  }
}

/**
 * Calculates GPA for a student based on their grades
 */
export async function calculateStudentGPA(studentId: number): Promise<number> {
  try {
    const result = await db
      .select({ gpa: sql<number>`COALESCE(AVG(${grades.gpa}), 0)` })
      .from(grades)
      .leftJoin(enrollments, eq(grades.enrollmentId, enrollments.id))
      .where(eq(enrollments.studentId, studentId));

    return result[0]?.gpa || 0;
  } catch (error) {
    console.error(`Failed to calculate GPA for student ${studentId}:`, error);
    throw new Error('Failed to calculate GPA');
  }
}

/**
 * Bulk updates grades for multiple students in a course
 */
export async function bulkUpdateCourseGrades(
  courseId: number,
  semesterId: number,
  gradesData: Array<{
    studentId: number;
    catScore?: string | null;
    examScore?: string | null;
    letterGrade?: string | null;
    gpa?: string | null;
  }>
): Promise<SelectGrade[]> {
  try {
    return await db.transaction(async (tx) => {
      // Explicitly type the results array to resolve the TypeScript error
      const results: SelectGrade[] = [];
      const studentIds = gradesData.map(g => g.studentId);

      if (studentIds.length === 0) {
        return [];
      }

      const enrollmentsResult = await tx
        .select({
          id: enrollments.id,
          studentId: enrollments.studentId,
        })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.courseId, courseId),
            eq(enrollments.semesterId, semesterId),
            inArray(enrollments.studentId, studentIds)
          )
        );

      const enrollmentMap = new Map(enrollmentsResult.map(e => [e.studentId, e.id]));

      for (const gradeItem of gradesData) {
        const enrollmentId = enrollmentMap.get(gradeItem.studentId);
        if (!enrollmentId) {
          continue;
        }

        const existingGradeResult = await tx
          .select()
          .from(grades)
          .where(eq(grades.enrollmentId, enrollmentId))
          .limit(1);

        const existingGrade = existingGradeResult[0];

        const catScoreNum = gradeItem.catScore !== undefined 
          ? (gradeItem.catScore ? parseFloat(gradeItem.catScore) : null)
          : (existingGrade?.catScore ? parseFloat(existingGrade.catScore) : null);
        
        const examScoreNum = gradeItem.examScore !== undefined
          ? (gradeItem.examScore ? parseFloat(gradeItem.examScore) : null)
          : (existingGrade?.examScore ? parseFloat(existingGrade.examScore) : null);

        let totalScoreString: string | null = null;
        if (catScoreNum !== null && examScoreNum !== null && !isNaN(catScoreNum) && !isNaN(examScoreNum)) {
          totalScoreString = String(catScoreNum + examScoreNum);
        }

        const gradePayload = {
          catScore: gradeItem.catScore,
          examScore: gradeItem.examScore,
          totalScore: totalScoreString,
          letterGrade: gradeItem.letterGrade,
          gpa: gradeItem.gpa,
        };

        let result;
        if (existingGrade) {
          result = await tx
            .update(grades)
            .set(gradePayload)
            .where(eq(grades.id, existingGrade.id))
            .returning();
        } else {
          const newGradePayload: NewGrade = {
            enrollmentId,
            ...gradePayload,
          };
          result = await tx
            .insert(grades)
            .values(newGradePayload)
            .returning();
        }
        results.push(result[0]);
      }

      revalidatePath('/admin/grades');
      return results;
    });
  } catch (error) {
    console.error('Failed to bulk update grades:', error);
    throw new Error('Failed to bulk update grades');
  }
}

/**
 * Gets all enrollments for a course in a semester without grades
 * Useful for bulk grade entry
 */
export async function getCourseEnrollmentsWithoutGrades(
  courseId: number,
  semesterId: number
) {
  try {
    return await db
      .select({
        id: enrollments.id,
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          registrationNumber: students.registrationNumber,
        },
      })
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(grades, eq(enrollments.id, grades.enrollmentId))
      .where(
        and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.semesterId, semesterId),
          isNull(grades.id) 
        )
      );
  } catch (error) {
    console.error('Failed to fetch enrollments without grades:', error);
    throw new Error('Failed to fetch enrollments without grades');
  }
}

/**
 * Gets all enrollments for a course in a semester
 * Useful for bulk grade entry
 */
export async function getCourseEnrollments(
  courseId: number,
  semesterId: number
) {
  try {
    return await db
      .select({
        id: enrollments.id,
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          registrationNumber: students.registrationNumber,
        },
      })
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .where(
        and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.semesterId, semesterId)
        )
      );
  } catch (error) {
    console.error('Failed to fetch course enrollments:', error);
    throw new Error('Failed to fetch course enrollments');
  }
}