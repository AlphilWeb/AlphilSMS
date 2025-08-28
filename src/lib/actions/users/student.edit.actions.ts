'use server';

import { db } from "@/lib/db";
import { students, users } from "@/lib/db/schema";
import { s3Client, bucketName } from "@/lib/s3-client";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Custom type definitions
type StudentFormData = {
  programId: number;
  departmentId: number;
  currentSemesterId: number;
  firstName: string;
  lastName: string;
  email: string;
  idNumber?: string | null;
  registrationNumber: string;
  studentNumber: string;
  passportPhoto?: File | null;
  idPhoto?: File | null;
  certificate?: File | null;
};

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

// Function to get student data for editing
export async function getStudentForEdit(studentId: number) {
  try {
    const studentData = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      with: {
        program: {
          columns: {
            id: true,
            name: true,
            code: true,
          }
        },
        department: {
          columns: {
            id: true,
            name: true,
          }
        },
        currentSemester: {
          columns: {
            id: true,
            name: true,
          }
        },
        user: {
          columns: {
            id: true,
            email: true,
            idNumber: true,
            roleId: true,
          },
          with: {
            role: {
              columns: {
                id: true,
                name: true,
              }
            }
          }
        }
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
    console.error("Error fetching student:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch student",
    };
  }
}

export async function updateStudent(studentId: number, data: StudentFormData & {
  shouldDeleteFiles?: {
    certificate?: boolean;
    idPhoto?: boolean;
    passportPhoto?: boolean;
  };
  password?: string;
  roleId?: number;
}) {
  try {
    // Manual validation (without Zod)
    if (!data.firstName || data.firstName.length < 2 || data.firstName.length > 100) {
      throw new Error("Invalid first name");
    }
    if (!data.lastName || data.lastName.length < 2 || data.lastName.length > 100) {
      throw new Error("Invalid last name");
    }

    if (!data.programId || !data.departmentId || !data.currentSemesterId) {
      throw new Error("Program, Department, or Semester not selected");
    }
    // You can add more validation checks here as needed

    // Check if student exists
    const existingStudent = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      with: {
        user: true
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
      throw new Error(
        uniqueCheck.email === data.email 
          ? "Email already exists" 
          : uniqueCheck.registrationNumber === data.registrationNumber 
            ? "Registration number already exists" 
            : "Student number already exists"
      );
    }

    // Check for unique email in users table (excluding current user)
    const uniqueUserEmailCheck = await db.query.users.findFirst({
      where: (users, { and, eq, ne }) => 
        and(
          eq(users.email, data.email),
          ne(users.id, existingStudent.user!.id)
        ),
    });

    if (uniqueUserEmailCheck) {
      throw new Error("Email already exists in user records");
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

    const uploadPromises = [];

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

    // Prepare user updates
    const userUpdates: {
      email: string;
      idNumber: string | null;
      updatedAt: Date;
      passwordHash?: string;
      roleId?: number;
    } = {
      email: data.email,
      idNumber: data.idNumber || null,
      updatedAt: new Date(),
    };

    // Update password if provided and not empty
    if (data.password && data.password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      userUpdates.passwordHash = hashedPassword;
    }

    // Update role if provided
    if (data.roleId) {
      userUpdates.roleId = data.roleId;
    }

    // Update user record
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

    return {
      success: true,
      student: updatedStudent,
    };
  } catch (error) {
    console.error("Error updating student:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update student",
    };
  }
}