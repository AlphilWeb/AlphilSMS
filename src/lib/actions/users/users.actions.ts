'use server';

import { db } from "@/lib/db";
import { staff, departments, roles, SelectUser, users } from "@/lib/db/schema";
import { s3Client, bucketName } from "@/lib/s3-client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { StaffFormData, staffSchemaClient } from "../test/student.schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";


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
export async function getStaffFormOptions() {
  // Select all departments
  const departmentsList = await db.select({
    id: departments.id,
    name: departments.name,
  }).from(departments);

  // Select all roles
  const rolesList = await db.select({
    id: roles.id,
    name: roles.name,
  }).from(roles);

  // Return an object containing both lists
  return {
    departments: departmentsList,
    roles: rolesList,
  };
}

// Main action to add a staff member
export async function addStaff(data: StaffFormData & { password: string; roleId: number }) {
  let newUser: SelectUser | null = null;
  
  try {
    // Validate input data
    const validatedData = staffSchemaClient.parse(data);

    // Check if email already exists in users table
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, validatedData.email),
    });

    if (existingUser) {
      throw new Error("Email already exists");
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

    // Upload files to R2 if they exist
    const [
      employmentDocumentsUrl,
      nationalIdPhotoUrl,
      academicCertificatesUrl,
      passportPhotoUrl
    ] = await Promise.all([
      validatedData.employmentDocuments 
        ? uploadFileToR2(validatedData.employmentDocuments, "employment-documents") 
        : Promise.resolve(null),
      validatedData.nationalIdPhoto 
        ? uploadFileToR2(validatedData.nationalIdPhoto, "national-id-photos") 
        : Promise.resolve(null),
      validatedData.academicCertificates 
        ? uploadFileToR2(validatedData.academicCertificates, "academic-certificates") 
        : Promise.resolve(null),
      validatedData.passportPhoto 
        ? uploadFileToR2(validatedData.passportPhoto, "passport-photos") 
        : Promise.resolve(null),
    ]);

    // Create the staff record with the user ID
    const [newStaff] = await db
      .insert(staff)
      .values({
        userId: newUser.id,
        departmentId: validatedData.departmentId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        idNumber: validatedData.idNumber || null,
        position: validatedData.position,
        employmentDocumentsUrl,
        nationalIdPhotoUrl,
        academicCertificatesUrl,
        passportPhotoUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      success: true,
      staff: newStaff,
      user: newUser,
    };

  } catch (error) {
    console.error("Error adding staff:", error);

    // Cleanup: If user was created but staff creation failed, delete the user
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
      error: error instanceof Error ? error.message : "Failed to add staff",
    };
  }
}