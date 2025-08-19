'use server';

import { db } from "@/lib/db";
import { students, programs, departments, semesters, SelectUser, users, roles } from "@/lib/db/schema";
import { s3Client, bucketName } from "@/lib/s3-client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { studentSchemaClient } from "./student.schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

// Type for the form data
type StudentFormData = z.infer<typeof studentSchemaClient>;

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
  return fileName; // Return the path/key for the file in R2
}

// Function to get select options for related entities
export async function getStudentFormOptions() {
  const [programsList, departmentsList, semestersList, rolesList] = await Promise.all([
    db.select({
      id: programs.id,
      name: programs.name,
      code: programs.code,
      departmentId: programs.departmentId,
    }).from(programs),
    
    db.select({
      id: departments.id,
      name: departments.name,
    }).from(departments),
    
    db.select({
      id: semesters.id,
      name: semesters.name,
      startDate: semesters.startDate,
      endDate: semesters.endDate,
    }).from(semesters),

    db.select({
      id:roles.id,
      name: roles.name,
    }).from(roles),
  ]);

  return {
    programs: programsList,
    departments: departmentsList,
    semesters: semestersList,
    roles: rolesList,
  };
}

// Main action to add a student
export async function addStudent(data: StudentFormData & { password: string; roleId: number }) {
  let newUser: SelectUser | null = null;
  
  try {
    // Validate input data - ensure your schema includes password and roleId
    const validatedData = studentSchemaClient.parse(data);

    // Check if email already exists in users table
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

    // Check if idNumber already exists in users table (if provided)
    if (validatedData.idNumber !== undefined && validatedData.idNumber !== null) {
      const existingIdNumber = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.idNumber, validatedData.idNumber as string),
      });

      if (existingIdNumber) {
        throw new Error("ID number already exists");
      }
    }

    // Hash the password
    const passwordHash = await hash(validatedData.password, 10);

    // Create user record first
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

    // Upload files to R2

    const [passportPhotoUrl, idPhotoUrl, certificateUrl] = await Promise.all([
      validatedData.idPhoto 
        ? uploadFileToR2(validatedData.idPhoto, "id-photos") 
        : Promise.resolve(null),
      validatedData.passportPhoto 
        ? uploadFileToR2(validatedData.passportPhoto, "passport-photos")
        : Promise.resolve(null),
      
      validatedData.certificate 
        ? uploadFileToR2(validatedData.certificate, "certificates") 
        : Promise.resolve(null),
    ]);

    // Create the student record with the user ID
    const [newStudent] = await db
      .insert(students)
      .values({
        userId: newUser.id, // Link to the created user
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
        certificateUrl: certificateUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      success: true,
      student: newStudent,
      user: newUser,
    };
  } catch (error) {
    console.error("Error adding student:", error);

    // Cleanup: If user was created but student creation failed, delete the user
    if (newUser) {
      try {
        await db.delete(users).where(eq(users.id, newUser.id));
        console.log("Cleaned up orphaned user record:", newUser.id);
      } catch (cleanupError) {
        console.error("Failed to clean up orphaned user record:", cleanupError);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add student",
    };
  }
}