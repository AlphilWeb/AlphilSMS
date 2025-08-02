// In: src/lib/actions/transcript.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/index';
import { transcripts, NewTranscript, students, semesters, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionError';
  }
}

const ROLES = {
  ADMIN: 'Admin',
  REGISTRAR: 'Registrar',
  HOD: 'HOD',
  ACCOUNTANT: 'Accountant',
  LECTURER: 'Lecturer',
  STAFF: 'Staff',
  STUDENT: 'Student',
};

function allowedRolesForManagingTranscripts() {
  return [ROLES.ADMIN, ROLES.REGISTRAR];
}

function allowedRolesForViewingAllTranscripts() {
  return [ROLES.ADMIN, ROLES.REGISTRAR];
}

function allowedRolesForViewingIndividualTranscript() {
  return [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.STUDENT]; // Student can view their own
}

/**
 * Creates a new transcript.
 * This action assumes a process where a Registrar might "finalize" a transcript.
 */
export async function createTranscript(formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingTranscripts())) {
      return { error: 'Unauthorized: You do not have permission to create transcripts.' };
    }

    const studentId = formData.get('studentId') ? Number(formData.get('studentId')) : null;
    const semesterId = formData.get('semesterId') ? Number(formData.get('semesterId')) : null;
    // GPA/CGPA are strings in schema, but typically numbers for calculations.
    // Ensure consistency with how they are stored and used. Assuming string for now.
    const gpa = formData.get('gpa') as string | null;
    const cgpa = formData.get('cgpa') as string | null;
    const fileUrl = formData.get('fileUrl') as string | null;

    if (!studentId || !semesterId || gpa === null || cgpa === null) {
      return { error: 'Missing required fields for transcript creation.' };
    }

    // Check if a transcript for this student and semester already exists
    const existingTranscript = await db.query.transcripts.findFirst({
      where: and(eq(transcripts.studentId, studentId), eq(transcripts.semesterId, semesterId)),
    });

    if (existingTranscript) {
      return { error: 'A transcript for this student in this semester already exists.' };
    }

    const newTranscript: NewTranscript = {
      studentId,
      semesterId,
      gpa,
      cgpa,
      generatedDate: new Date(), // Set generatedDate automatically
      fileUrl: fileUrl || undefined,
    };

    await db.insert(transcripts).values(newTranscript);

    revalidatePath('/dashboard/transcripts');
    revalidatePath(`/dashboard/students/${studentId}`);
    return { success: 'Transcript created successfully.' };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Updates an existing transcript.
 */
export async function updateTranscript(transcriptId: number, formData: FormData) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingTranscripts())) {
      return { error: 'Unauthorized: You do not have permission to update transcripts.' };
    }

    const studentId = formData.get('studentId') ? Number(formData.get('studentId')) : null;
    const semesterId = formData.get('semesterId') ? Number(formData.get('semesterId')) : null;
    const gpa = formData.get('gpa') as string | null;
    const cgpa = formData.get('cgpa') as string | null;
    const fileUrl = formData.get('fileUrl') as string | null;

    const updates: Partial<NewTranscript> = {};
    if (studentId !== null) updates.studentId = studentId;
    if (semesterId !== null) updates.semesterId = semesterId;
    if (gpa !== null) updates.gpa = gpa;
    if (cgpa !== null) updates.cgpa = cgpa;
    if (fileUrl !== null) updates.fileUrl = fileUrl;

    if (Object.keys(updates).length === 0) {
      return { error: 'No fields to update.' };
    }

    await db.update(transcripts).set(updates).where(eq(transcripts.id, transcriptId));

    revalidatePath('/dashboard/transcripts');
    revalidatePath(`/dashboard/transcripts/${transcriptId}`);
    if (studentId) revalidatePath(`/dashboard/students/${studentId}`);
    return { success: 'Transcript updated successfully.' };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Deletes a transcript.
 */
export async function deleteTranscript(transcriptId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !checkPermission(authUser, allowedRolesForManagingTranscripts())) {
      return { error: 'Unauthorized: You do not have permission to delete transcripts.' };
    }

    await db.delete(transcripts).where(eq(transcripts.id, transcriptId));

    revalidatePath('/dashboard/transcripts');
    return { success: 'Transcript deleted successfully.' };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches all transcripts with associated student and semester details.
 */
export async function getTranscripts() {
  try {
    const authUser = await getAuthUser();
    if (!checkPermission(authUser, allowedRolesForViewingAllTranscripts())) {
      throw new ActionError('Unauthorized: You do not have permission to view transcripts.');
    }

    const result = await db
      .select({
        id: transcripts.id,
        studentId: transcripts.studentId,
        semesterId: transcripts.semesterId,
        gpa: transcripts.gpa,
        cgpa: transcripts.cgpa,
        generatedDate: transcripts.generatedDate,
        fileUrl: transcripts.fileUrl,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegNo: students.registrationNumber, // FIX: Use registrationNumber
        studentUserEmail: users.email,
        semesterName: semesters.name,
        // semesterYear: semesters.year, // REMOVED: Not in your schema
        // semesterType: semesters.type, // REMOVED: Not in your schema
      })
      .from(transcripts)
      .leftJoin(students, eq(transcripts.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(semesters, eq(transcripts.semesterId, semesters.id));

    const allTranscripts = result.map((t) => ({
      id: t.id,
      studentId: t.studentId,
      semesterId: t.semesterId,
      gpa: t.gpa,
      cgpa: t.cgpa,
      generatedDate: t.generatedDate,
      fileUrl: t.fileUrl || null,
      studentFullName:
        t.studentFirstName && t.studentLastName ? `${t.studentFirstName} ${t.studentLastName}` : null,
      studentRegNo: t.studentRegNo || null, // FIX: Use aliased name
      studentUserEmail: t.studentUserEmail || null,
      semesterName: t.semesterName || null,
      // semesterYear: t.semesterYear || null, // REMOVED: Not in your schema
      // semesterType: t.semesterType || null, // REMOVED: Not in your schema
    }));

    return allTranscripts;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches a single transcript by ID with associated student and semester details.
 */
export async function getTranscriptById(id: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const result = await db
      .select({
        id: transcripts.id,
        studentId: transcripts.studentId,
        semesterId: transcripts.semesterId,
        gpa: transcripts.gpa,
        cgpa: transcripts.cgpa,
        generatedDate: transcripts.generatedDate,
        fileUrl: transcripts.fileUrl,
        studentUserId: students.userId, // Needed for permission check
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentRegNo: students.registrationNumber, // FIX: Use registrationNumber
        studentUserEmail: users.email,
        semesterName: semesters.name,
        // semesterYear: semesters.year, // REMOVED: Not in your schema
        // semesterType: semesters.type, // REMOVED: Not in your schema
      })
      .from(transcripts)
      .leftJoin(students, eq(transcripts.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(semesters, eq(transcripts.semesterId, semesters.id))
      .where(eq(transcripts.id, id));

    const transcriptRecord = result[0];

    if (!transcriptRecord) {
      return { error: 'Transcript not found.' };
    }

    // Check if authorized as Admin, Registrar, or if it's the student's own transcript.
    const isAuthorized =
      checkPermission(authUser, allowedRolesForViewingIndividualTranscript()) ||
      authUser.userId === transcriptRecord.studentUserId;

    if (!isAuthorized) {
      return { error: 'Unauthorized: You do not have permission to view this transcript.' };
    }

    return {
      id: transcriptRecord.id,
      studentId: transcriptRecord.studentId,
      semesterId: transcriptRecord.semesterId,
      gpa: transcriptRecord.gpa,
      cgpa: transcriptRecord.cgpa,
      generatedDate: transcriptRecord.generatedDate,
      fileUrl: transcriptRecord.fileUrl || null,
      studentFullName:
        transcriptRecord.studentFirstName && transcriptRecord.studentLastName
          ? `${transcriptRecord.studentFirstName} ${transcriptRecord.studentLastName}`
          : null,
      studentRegNo: transcriptRecord.studentRegNo || null, // FIX: Use aliased name
      studentUserEmail: transcriptRecord.studentUserEmail || null,
      semesterName: transcriptRecord.semesterName || null,
      // semesterYear: transcriptRecord.semesterYear || null, // REMOVED: Not in your schema
      // semesterType: transcriptRecord.semesterType || null, // REMOVED: Not in your schema
    };
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}

/**
 * Fetches transcripts for a specific student with associated semester details.
 */
export async function getTranscriptsByStudentId(studentId: number) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { error: 'Unauthorized: You must be logged in.' };
    }

    const studentRecord = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      columns: { userId: true, firstName: true, lastName: true, registrationNumber: true }, // FIX: Use registrationNumber
    });

    if (!studentRecord) {
      return { error: 'Student not found.' };
    }

    // Authorization: Admin, Registrar, or the student themselves.
    const isAuthorized =
      checkPermission(authUser, allowedRolesForViewingAllTranscripts()) ||
      authUser.userId === studentRecord.userId;

    if (!isAuthorized) {
      return { error: 'Unauthorized: You do not have permission to view these transcripts.' };
    }

    const result = await db
      .select({
        id: transcripts.id,
        studentId: transcripts.studentId,
        semesterId: transcripts.semesterId,
        gpa: transcripts.gpa,
        cgpa: transcripts.cgpa,
        generatedDate: transcripts.generatedDate,
        fileUrl: transcripts.fileUrl,
        semesterName: semesters.name,
        // semesterYear: semesters.year, // REMOVED: Not in your schema
        // semesterType: semesters.type, // REMOVED: Not in your schema
      })
      .from(transcripts)
      .leftJoin(semesters, eq(transcripts.semesterId, semesters.id))
      .where(eq(transcripts.studentId, studentId));

    const studentTranscripts = result.map((t) => ({
      id: t.id,
      studentId: t.studentId,
      semesterId: t.semesterId,
      gpa: t.gpa,
      cgpa: t.cgpa,
      generatedDate: t.generatedDate,
      fileUrl: t.fileUrl || null,
      semesterName: t.semesterName || null,
      // semesterYear: t.semesterYear || null, // REMOVED: Not in your schema
      // semesterType: t.semesterType || null, // REMOVED: Not in your schema
      // Student details are for the collection, not per-transcript.
      // Can be added outside the map if needed once.
    }));

    return studentTranscripts;
  } catch (err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[ERROR_CONTEXT]', error);
  throw new ActionError(error.message);
}
}