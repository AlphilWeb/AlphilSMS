'use server';

import { db } from "@/lib/db";
import { staff, departments, users, roles } from "@/lib/db/schema";
import { s3Client, bucketName } from "@/lib/s3-client";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { asc, eq } from "drizzle-orm";
import { StaffWithDetails } from "../admin/staff.actions";
import bcrypt from "bcryptjs";

// Custom type for the form data
type StaffFormData = {
  departmentId: number;
  firstName: string;
  lastName: string;
  email: string;
  idNumber?: string | null;
  position: string;
  password?: string;
  roleId?: number;
  employmentDocuments?: File | null;
  nationalIdPhoto?: File | null;
  academicCertificates?: File | null;
  passportPhoto?: File | null;
};

export async function getAllStaff(): Promise<StaffWithDetails[]> {
  const raw = await db
    .select({
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      idNumber: staff.idNumber,
      position: staff.position,
      departmentId: departments.id,
      departmentName: departments.name,
      userId: users.id,
      roleId: roles.id,
      roleName: roles.name,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    })
    .from(staff)
    .innerJoin(users, eq(users.id, staff.userId))
    .innerJoin(roles, eq(roles.id, users.roleId))
    .innerJoin(departments, eq(departments.id, staff.departmentId))
    .orderBy(asc(staff.lastName), asc(staff.firstName));

  return raw.map(row => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    idNumber: row.idNumber,
    position: row.position,
    department: {
      id: row.departmentId,
      name: row.departmentName,
    },
    user: {
      id: row.userId,
      role: {
        id: row.roleId,
        name: row.roleName,
      },
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

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

// Function to get staff data for editing
export async function getStaffForEdit(staffId: number) {
  try {
    const staffData = await db.query.staff.findFirst({
      where: eq(staff.id, staffId),
      with: {
        department: {
          columns: {
            id: true,
            name: true,
          },
        },
        user: {
          with: {
            role: true
          },
        },
      },
    });

    if (!staffData) {
      throw new Error("Staff not found");
    }

    return {
      success: true,
      staff: staffData,
    };
  } catch (error) {
    console.error("Error fetching staff:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch staff",
    };
  }
}

// Main action to update a staff member
export async function updateStaff(staffId: number, data: StaffFormData & {
  shouldDeleteFiles?: {
    employmentDocuments?: boolean;
    nationalIdPhoto?: boolean;
    academicCertificates?: boolean;
    passportPhoto?: boolean;
  };
  password?: string;
  roleId?: number;
}) {
  try {
    // Manual validation (without Zod)
    if (!data.firstName || data.firstName.length < 1 || data.firstName.length > 100) {
      throw new Error("First name is required");
    }
    if (!data.lastName || data.lastName.length < 1 || data.lastName.length > 100) {
      throw new Error("Last name is required");
    }

    if (data.idNumber && data.idNumber.length > 50) {
        throw new Error("ID number cannot exceed 50 characters");
    }
    if (!data.position || data.position.length < 1 || data.position.length > 100) {
        throw new Error("Position is required");
    }
    if (data.password && data.password.length < 8) {
        throw new Error("Password must be at least 8 characters");
    }
    if (!data.departmentId || data.departmentId <= 0) {
        throw new Error("Department is required");
    }
    if (data.roleId && data.roleId <= 0) {
        throw new Error("Role is required");
    }
    // You can add more specific file size validations here if needed

    // Check if staff exists
    const existingStaff = await db.query.staff.findFirst({
      where: eq(staff.id, staffId),
      with: {
        user: true
      }
    });

    if (!existingStaff) {
      throw new Error("Staff not found");
    }

    if (!existingStaff.user) {
      throw new Error("Staff user record not found");
    }

    // Check if email already exists (excluding current staff)
    const emailExists = await db.query.staff.findFirst({
      where: (staff, { and, eq, ne }) => 
        and(
          eq(staff.email, data.email),
          ne(staff.id, staffId)
        ),
    });

    if (emailExists) {
      throw new Error("Email already exists in staff records");
    }

    // Check for unique email in users table (excluding current user)
    const uniqueUserEmailCheck = await db.query.users.findFirst({
      where: (users, { and, eq, ne }) => 
        and(
          eq(users.email, data.email),
          ne(users.id, existingStaff.user!.id)
        ),
    });

    if (uniqueUserEmailCheck) {
      throw new Error("Email already exists in user records");
    }

    // Check if idNumber already exists (if provided and excluding current staff)
    if (typeof data.idNumber === "string" && data.idNumber.trim() !== "") {
      const idNumberExists = await db.query.staff.findFirst({
        where: (staff, { and, eq, ne }) => 
          and(
            eq(staff.idNumber, data.idNumber as string),
            ne(staff.id, staffId)
          ),
      });

      if (idNumberExists) {
        throw new Error("ID number already exists");
      }
    }

    // Handle file uploads and deletions
    const fileUpdates: Record<string, string | null> = {};

    // Handle file deletions
    if (data.shouldDeleteFiles) {
      if (data.shouldDeleteFiles.employmentDocuments && existingStaff.employmentDocumentsUrl) {
        await deleteFileFromR2(existingStaff.employmentDocumentsUrl);
        fileUpdates.employmentDocumentsUrl = null;
      }
      if (data.shouldDeleteFiles.nationalIdPhoto && existingStaff.nationalIdPhotoUrl) {
        await deleteFileFromR2(existingStaff.nationalIdPhotoUrl);
        fileUpdates.nationalIdPhotoUrl = null;
      }
      if (data.shouldDeleteFiles.academicCertificates && existingStaff.academicCertificatesUrl) {
        await deleteFileFromR2(existingStaff.academicCertificatesUrl);
        fileUpdates.academicCertificatesUrl = null;
      }
      if (data.shouldDeleteFiles.passportPhoto && existingStaff.passportPhotoUrl) {
        await deleteFileFromR2(existingStaff.passportPhotoUrl);
        fileUpdates.passportPhotoUrl = null;
      }
    }

    // Handle new file uploads
    const uploadPromises = [];
    
    if (data.employmentDocuments instanceof File) {
      if (existingStaff.employmentDocumentsUrl) {
        await deleteFileFromR2(existingStaff.employmentDocumentsUrl);
      }
      uploadPromises.push(
        uploadFileToR2(data.employmentDocuments, "employment-documents")
          .then(url => { fileUpdates.employmentDocumentsUrl = url; })
      );
    }

    if (data.nationalIdPhoto instanceof File) {
      if (existingStaff.nationalIdPhotoUrl) {
        await deleteFileFromR2(existingStaff.nationalIdPhotoUrl);
      }
      uploadPromises.push(
        uploadFileToR2(data.nationalIdPhoto, "national-id-photos")
          .then(url => { fileUpdates.nationalIdPhotoUrl = url; })
      );
    }

    if (data.academicCertificates instanceof File) {
      if (existingStaff.academicCertificatesUrl) {
        await deleteFileFromR2(existingStaff.academicCertificatesUrl);
      }
      uploadPromises.push(
        uploadFileToR2(data.academicCertificates, "academic-certificates")
          .then(url => { fileUpdates.academicCertificatesUrl = url; })
      );
    }

    if (data.passportPhoto instanceof File) {
      if (existingStaff.passportPhotoUrl) {
        await deleteFileFromR2(existingStaff.passportPhotoUrl);
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
      .where(eq(users.id, existingStaff.user.id));

    // Update the staff record
    const [updatedStaff] = await db
      .update(staff)
      .set({
        departmentId: data.departmentId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        idNumber: data.idNumber || null,
        position: data.position,
        ...fileUpdates,
        updatedAt: new Date(),
      })
      .where(eq(staff.id, staffId))
      .returning();

    return {
      success: true,
      staff: updatedStaff,
    };
  } catch (error) {
    console.error("Error updating staff:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update staff",
    };
  }
}