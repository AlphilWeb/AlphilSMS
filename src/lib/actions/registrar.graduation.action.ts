// src/actions/registrar/graduation.actions.ts
'use server';

import { db, testConnection } from '@/lib/db';
import { 
  students, 

  enrollments,
  transcripts
} from '@/lib/db/schema';
import { and, eq, sql, or, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export type GraduationListFilters = {
  semesterId?: number;
  programId?: number;
  departmentId?: number;
  graduationStatus?: 'pending' | 'approved' | 'completed';
  searchQuery?: string;
};

export async function getGraduationList(filters: GraduationListFilters = {}) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
      throw new Error('Unauthorized');
    }

    const conditions = [];

    if (filters.semesterId) {
      conditions.push(eq(students.currentSemesterId, filters.semesterId));
    }

    if (filters.programId) {
      conditions.push(eq(students.programId, filters.programId));
    }

    if (filters.departmentId) {
      conditions.push(eq(students.departmentId, filters.departmentId));
    }

    if (filters.searchQuery) {
      conditions.push(
        or(
          sql`CONCAT(${students.firstName}, ' ', ${students.lastName}) ILIKE ${'%' + filters.searchQuery + '%'}`,
          sql`${students.registrationNumber}::text ILIKE ${'%' + filters.searchQuery + '%'}`,
          sql`${students.studentNumber}::text ILIKE ${'%' + filters.searchQuery + '%'}`
        )
      );
    }

    const allSemesters = await db.query.semesters.findMany({
      orderBy: (semesters, { desc }) => [desc(semesters.startDate)],
    });

    const allPrograms = await db.query.programs.findMany({
      orderBy: (programs, { asc }) => [asc(programs.name)],
    });

    const allDepartments = await db.query.departments.findMany({
      orderBy: (departments, { asc }) => [asc(departments.name)],
    });

    // First get all potential graduation candidates
    const graduationCandidates = await db.query.students.findMany({
      where: and(...conditions),
      with: {
        program: {
          columns: {
            name: true,
            code: true,
            durationSemesters: true,
          },
          with: {
            department: {
              columns: {
                name: true,
              },
            },
          },
        },
        currentSemester: {
          columns: {
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: (students, { asc }) => [asc(students.lastName), asc(students.firstName)],
    });

    // Then fetch additional data for each candidate
const candidatesWithDetails = await Promise.all(
  graduationCandidates.map(async (student) => {
    // Check if the semester ID is null before performing the query
    if (student.currentSemesterId === null) {
      return {
        ...student,
        enrollments: [], // or whatever default is appropriate
        transcripts: [],
      };
    }

    const [studentEnrollments, studentTranscripts] = await Promise.all([
      db.query.enrollments.findMany({
        where: eq(enrollments.studentId, student.id),
        with: {
          course: {
            columns: {
              name: true,
              credits: true,
            },
          },
          grade: {
            columns: {
              totalScore: true,
              letterGrade: true,
              gpa: true,
            },
          },
        },
      }),
      db.query.transcripts.findMany({
        where: and(
          eq(transcripts.studentId, student.id),
          eq(transcripts.semesterId, student.currentSemesterId)
        ),
        columns: {
          id: true,
          gpa: true,
          cgpa: true,
          generatedDate: true,
          fileUrl: true,
        },
      }),
    ]);

    return {
      ...student,
      enrollments: studentEnrollments,
      transcripts: studentTranscripts,
    };
  })
);

    const processedCandidates = candidatesWithDetails.map((student) => {
      const totalCredits = student.enrollments.reduce(
        (sum, enrollment) => sum + Number(enrollment.course.credits || 0),
        0
      );

      const passedCredits = student.enrollments.reduce((sum, enrollment) => {
        if (enrollment.grade && enrollment.grade.letterGrade !== 'F') {
          return sum + Number(enrollment.course.credits || 0);
        }
        return sum;
      }, 0);

      const completionPercentage = (passedCredits / totalCredits) * 100;
      const programDuration = student.program.durationSemesters;
      const semestersCompleted = student.currentSemesterId;

      const hasTranscript = student.transcripts.length > 0;
      const transcript = hasTranscript ? student.transcripts[0] : null;

      let status: 'pending' | 'approved' | 'completed';
      if (transcript?.fileUrl) {
        status = 'completed';
      } else if (completionPercentage >= 100) {
        status = 'approved';
      } else {
        status = 'pending';
      }

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        registrationNumber: student.registrationNumber,
        studentNumber: student.studentNumber,
        program: student.program.name,
        programCode: student.program.code,
        department: student.program.department.name,
        currentSemester: student.currentSemester?.name,
        creditsCompleted: passedCredits,
        totalCredits: totalCredits,
        completionPercentage: completionPercentage.toFixed(2),
        semestersCompleted,
        programDuration,
        status,
        gpa: transcript?.gpa || null,
        cgpa: transcript?.cgpa || null,
        transcriptGenerated: hasTranscript,
        transcriptUrl: transcript?.fileUrl || null,
      };
    });

    const filteredCandidates = filters.graduationStatus
      ? processedCandidates.filter((candidate) => candidate.status === filters.graduationStatus)
      : processedCandidates;

    return {
      filters: {
        semesters: allSemesters,
        programs: allPrograms,
        departments: allDepartments,
      },
      candidates: filteredCandidates,
      stats: {
        total: processedCandidates.length,
        pending: processedCandidates.filter((c) => c.status === 'pending').length,
        approved: processedCandidates.filter((c) => c.status === 'approved').length,
        completed: processedCandidates.filter((c) => c.status === 'completed').length,
      },
    };
  } catch (error) {
    console.error('Error in getGraduationList:', error);
    throw new Error('Failed to fetch graduation list');
  }
}

export async function generateGraduationTranscript(studentId: number) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
      throw new Error('Unauthorized');
    }

    // Get student details
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      with: {
        program: {
          columns: {
            name: true,
            code: true,
          },
          with: {
            department: {
              columns: {
                name: true,
              },
            },
          },
        },
        currentSemester: {
          columns: {
            id: true,
            name: true,
          },
        },
        enrollments: {
          with: {
            course: {
              columns: {
                name: true,
                code: true,
                credits: true,
              },
            },
            grade: {
              columns: {
                totalScore: true,
                letterGrade: true,
                gpa: true,
              },
            },
            semester: {
              columns: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Calculate GPA and CGPA
    const grades = student.enrollments
      .filter((e) => e.grade)
      .map((e) => ({
        credits: Number(e.course.credits),
        gpa: Number(e.grade?.gpa || 0),
      }));

    const totalCredits = grades.reduce((sum, grade) => sum + grade.credits, 0);
    const weightedGPA = grades.reduce((sum, grade) => sum + (grade.gpa * grade.credits), 0);
    const cgpa = totalCredits > 0 ? weightedGPA / totalCredits : 0;

    // Generate a mock file URL (in a real app, this would generate an actual PDF)
    const fileUrl = `/transcripts/${student.registrationNumber}_${student.currentSemester?.name.replace(/\s+/g, '_')}.pdf`;

    // Create or update transcript record
const semesterId = student.currentSemester?.id;
let existingTranscript = null;

if (semesterId) {
  existingTranscript = await db.query.transcripts.findFirst({
    where: and(
      eq(transcripts.studentId, studentId),
      eq(transcripts.semesterId, semesterId)
    ),
  });
}

let transcript;
if (existingTranscript) {
  transcript = await db.update(transcripts)
    .set({
      gpa: cgpa.toFixed(2),
      cgpa: cgpa.toFixed(2),
      fileUrl,
      generatedDate: new Date(),
    })
    .where(eq(transcripts.id, existingTranscript.id))
    .returning();
} else {
  transcript = await db.insert(transcripts)
    .values({
      studentId,
      semesterId: student.currentSemester?.id ?? 0,
      gpa: cgpa.toFixed(2),
      cgpa: cgpa.toFixed(2),
      fileUrl,
    })
    .returning();
}

    return {
      success: true,
      transcript: {
        ...transcript[0],
        studentName: `${student.firstName} ${student.lastName}`,
        registrationNumber: student.registrationNumber,
        program: student.program.name,
        semester: student.currentSemester?.name,
      },
    };
  } catch (error) {
    console.error('Error in generateGraduationTranscript:', error);
    throw new Error('Failed to generate graduation transcript');
  }
}

export async function approveGraduation(studentIds: number[]) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser || authUser.role.toLowerCase() !== 'registrar') {
      throw new Error('Unauthorized');
    }

    // In a real application, this would perform additional checks and updates
    // For now, we'll just return the approved students
    const approvedStudents = await db.query.students.findMany({
      where: inArray(students.id, studentIds),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        registrationNumber: true,
      },
    });

    return {
      success: true,
      count: approvedStudents.length,
      students: approvedStudents.map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        registrationNumber: s.registrationNumber,
      })),
    };
  } catch (error) {
    console.error('Error in approveGraduation:', error);
    throw new Error('Failed to approve graduation');
  }
}