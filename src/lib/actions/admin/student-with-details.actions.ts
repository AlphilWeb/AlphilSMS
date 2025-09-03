'use server';

import { db } from "@/lib/db";
import { students, studentPersonalDetails, users } from "@/lib/db/schema";
import { s3Client, bucketName } from "@/lib/s3-client";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { hash } from "bcryptjs";
import { eq, InferSelectModel } from "drizzle-orm";

// Extended schema to include personal details
export const studentWithDetailsSchemaClient = z.object({
  // Student basic info
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email(),
  idNumber: z.string().optional().nullable(),
  registrationNumber: z.string().min(1),
  studentNumber: z.string().min(1),
  programId: z.number().min(1),
  departmentId: z.number().min(1),
  currentSemesterId: z.number().min(1),
  password: z.string().min(6),
  roleId: z.number().min(1),
  
  // Personal details
  age: z.number().min(16).max(100),
  sex: z.string().min(1),
  county: z.string().min(2),
  village: z.string().min(2),
  contact1: z.string().min(10),
  contact2: z.string().optional(),
  contact3: z.string().optional(),
  dateJoined: z.string().min(1), // ISO date string
});

export type StudentWithDetailsFormData = z.infer<typeof studentWithDetailsSchemaClient>;

type User = InferSelectModel<typeof users>;
type Student = InferSelectModel<typeof students>;
type StudentPersonalDetails = InferSelectModel<typeof studentPersonalDetails>;

// Helper function to upload file to R2
async function uploadFileToR2(file: File, folder: string): Promise<string> {
  const fileExtension = file.name.split(".").pop();
  const fileName = `${folder}/${uuidv4()}.${fileExtension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
  });

  await s3Client.send(command);
  return fileName;
}

// Helper function to delete file from R2
async function deleteFileFromR2(fileUrl: string | null): Promise<void> {
  if (!fileUrl) return;
  
  const key = fileUrl.split('/').slice(-2).join('/');
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting file from R2:", error);
  }
}

// GET student with details for editing
export async function getStudentWithDetails(studentId: number) {
  try {
    const studentData = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      with: {
        program: { columns: { id: true, name: true, code: true } },
        department: { columns: { id: true, name: true } },
        currentSemester: { columns: { id: true, name: true } },
        user: {
          columns: { id: true, email: true, idNumber: true, roleId: true },
          with: { role: { columns: { id: true, name: true } } }
        },
        personalDetails: true
      }
    });

    if (!studentData) {
      throw new Error("Student not found");
    }

    return {
      success: true,
      student: studentData,
    };
  } catch (error) {
    console.error("Error fetching student with details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch student",
    };
  }
}

// CREATE student with details
export async function addStudentWithDetails(data: StudentWithDetailsFormData & {
  passportPhoto?: File | null;
  idPhoto?: File | null;
  certificate?: File | null;
}) {
  let newUser: User | null = null;
  let newStudent: Student | null = null;
  
  try {
    const validatedData = studentWithDetailsSchemaClient.parse(data);

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, validatedData.email),
    });

    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Check if registrationNumber or studentNumber already exist
    const existingStudent = await db.query.students.findFirst({
      where: (students, { or, eq }) => 
        or(
          eq(students.registrationNumber, validatedData.registrationNumber),
          eq(students.studentNumber, validatedData.studentNumber)
        ),
    });

    if (existingStudent) {
      throw new Error(
        existingStudent.registrationNumber === validatedData.registrationNumber 
          ? "Registration number already exists" 
          : "Student number already exists"
      );
    }

    // Hash password
    const passwordHash = await hash(validatedData.password, 10);

    // Create user record
    const [createdUser] = await db
      .insert(users)
      .values({
        email: validatedData.email,
        passwordHash,
        roleId: validatedData.roleId,
        idNumber: validatedData.idNumber || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    newUser = createdUser;

    // Upload files
    const [passportPhotoUrl, idPhotoUrl, certificateUrl] = await Promise.all([
      data.passportPhoto ? uploadFileToR2(data.passportPhoto, "passport-photos") : Promise.resolve(null),
      data.idPhoto ? uploadFileToR2(data.idPhoto, "id-photos") : Promise.resolve(null),
      data.certificate ? uploadFileToR2(data.certificate, "certificates") : Promise.resolve(null),
    ]);

    // Create student record
    const [createdStudent] = await db
      .insert(students)
      .values({
        userId: newUser.id,
        programId: validatedData.programId,
        departmentId: validatedData.departmentId,
        currentSemesterId: validatedData.currentSemesterId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        idNumber: validatedData.idNumber,
        registrationNumber: validatedData.registrationNumber,
        studentNumber: validatedData.studentNumber,
        passportPhotoUrl,
        idPhotoUrl,
        certificateUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    newStudent = createdStudent;

    // Create personal details record
    const [personalDetails] = await db
      .insert(studentPersonalDetails)
      .values({
        studentId: newStudent.id,
        age: validatedData.age,
        sex: validatedData.sex,
        county: validatedData.county,
        village: validatedData.village,
        contact1: validatedData.contact1,
        contact2: validatedData.contact2 || null,
        contact3: validatedData.contact3 || null,
        dateJoined: validatedData.dateJoined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      success: true,
      student: newStudent,
      user: newUser,
      personalDetails,
    };
  } catch (error) {
    console.error("Error adding student with details:", error);

    // Cleanup: Delete created records if any step fails
    if (newStudent) {
      try {
        await db.delete(students).where(eq(students.id, newStudent.id));
      } catch (cleanupError) {
        console.error("Failed to clean up student record:", cleanupError);
      }
    }

    if (newUser) {
      try {
        await db.delete(users).where(eq(users.id, newUser.id));
      } catch (cleanupError) {
        console.error("Failed to clean up user record:", cleanupError);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add student with details",
    };
  }
}

// UPDATE student with details
export async function updateStudentWithDetails(
  studentId: number, 
  data: StudentWithDetailsFormData & {
    shouldDeleteFiles?: {
      certificate?: boolean;
      idPhoto?: boolean;
      passportPhoto?: boolean;
    };
    passportPhoto?: File | null;
    idPhoto?: File | null;
    certificate?: File | null;
  }
) {
  try {
    // Manual validation
    if (!data.firstName || data.firstName.length < 2 || data.firstName.length > 100) {
      throw new Error("Invalid first name");
    }

    // Check if student exists with personal details
    const existingStudent = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      with: {
        user: true,
        personalDetails: true
      }
    });

    if (!existingStudent) {
      throw new Error("Student not found");
    }

    if (!existingStudent.user) {
      throw new Error("Student user record not found");
    }

    // Check for unique fields (excluding current student)
    const uniqueCheck = await db.query.students.findFirst({
      where: (students, { and, or, eq, ne }) => 
        and(
          or(
            eq(students.email, data.email),
            eq(students.registrationNumber, data.registrationNumber),
            eq(students.studentNumber, data.studentNumber)
          ),
          ne(students.id, studentId)
        ),
    });

    if (uniqueCheck) {
      throw new Error("Email, registration number, or student number already exists");
    }

    // Handle file uploads and deletions
    const fileUpdates: Record<string, string | null> = {};

    if (data.shouldDeleteFiles) {
      if (data.shouldDeleteFiles.certificate && existingStudent.certificateUrl) {
        await deleteFileFromR2(existingStudent.certificateUrl);
        fileUpdates.certificateUrl = null;
      }
      if (data.shouldDeleteFiles.idPhoto && existingStudent.idPhotoUrl) {
        await deleteFileFromR2(existingStudent.idPhotoUrl);
        fileUpdates.idPhotoUrl = null;
      }
      if (data.shouldDeleteFiles.passportPhoto && existingStudent.passportPhotoUrl) {
        await deleteFileFromR2(existingStudent.passportPhotoUrl);
        fileUpdates.passportPhotoUrl = null;
      }
    }

    const uploadPromises: Promise<void>[] = [];

    if (data.certificate instanceof File) {
      if (existingStudent.certificateUrl) {
        await deleteFileFromR2(existingStudent.certificateUrl);
      }
      uploadPromises.push(
        uploadFileToR2(data.certificate, "certificates")
          .then(url => { fileUpdates.certificateUrl = url; })
      );
    }

    if (data.idPhoto instanceof File) {
      if (existingStudent.idPhotoUrl) {
        await deleteFileFromR2(existingStudent.idPhotoUrl);
      }
      uploadPromises.push(
        uploadFileToR2(data.idPhoto, "id-photos")
          .then(url => { fileUpdates.idPhotoUrl = url; })
      );
    }

    if (data.passportPhoto instanceof File) {
      if (existingStudent.passportPhotoUrl) {
        await deleteFileFromR2(existingStudent.passportPhotoUrl);
      }
      uploadPromises.push(
        uploadFileToR2(data.passportPhoto, "passport-photos")
          .then(url => { fileUpdates.passportPhotoUrl = url; })
      );
    }

    await Promise.all(uploadPromises);

    // Update user record
    const userUpdates = {
      email: data.email,
      idNumber: data.idNumber || null,
      updatedAt: new Date(),
    };

    await db
      .update(users)
      .set(userUpdates)
      .where(eq(users.id, existingStudent.user.id));

    // Update student record
    const [updatedStudent] = await db
      .update(students)
      .set({
        programId: data.programId,
        departmentId: data.departmentId,
        currentSemesterId: data.currentSemesterId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        idNumber: data.idNumber,
        registrationNumber: data.registrationNumber,
        studentNumber: data.studentNumber,
        ...fileUpdates,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId))
      .returning();

    // Update or create personal details
    if (existingStudent.personalDetails) {
      // Update existing personal details
      await db
        .update(studentPersonalDetails)
        .set({
          age: data.age,
          sex: data.sex,
          county: data.county,
          village: data.village,
          contact1: data.contact1,
          contact2: data.contact2 || null,
          contact3: data.contact3 || null,
          dateJoined: data.dateJoined,
          updatedAt: new Date(),
        })
        .where(eq(studentPersonalDetails.studentId, studentId));
    } else {
      // Create new personal details
      await db
        .insert(studentPersonalDetails)
        .values({
          studentId: studentId,
          age: data.age,
          sex: data.sex,
          county: data.county,
          village: data.village,
          contact1: data.contact1,
          contact2: data.contact2 || null,
          contact3: data.contact3 || null,
          dateJoined: data.dateJoined,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
    }

    return {
      success: true,
      student: updatedStudent,
    };
  } catch (error) {
    console.error("Error updating student with details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update student",
    };
  }
}

// BULK CREATE students with details
export async function bulkAddStudentsWithDetails(studentsData: StudentWithDetailsFormData[]) {
  const results = {
    success: 0,
    errors: [] as { index: number; error: string }[],
    createdStudents: [] as Array<{
      success: boolean;
      student?: Student;
      user?: User;
      personalDetails?: StudentPersonalDetails;
      error?: string;
    }>,
  };

  for (let i = 0; i < studentsData.length; i++) {
    try {
      const result = await addStudentWithDetails(studentsData[i]);
      
      if (result.success) {
        results.success++;
        results.createdStudents.push(result);
      } else {
        results.errors.push({ index: i, error: result.error || "Unknown error" });
      }
    } catch (error) {
      results.errors.push({ 
        index: i, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }

  return results;
}