import { z } from "zod";

// This is for client-side validation only
export const studentSchemaClient = z.object({
  programId: z.number().positive(),
  departmentId: z.number().positive(),
  currentSemesterId: z.number().positive(),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email().max(255),
  idNumber: z.string().max(50).optional(),
  password: z.string()
    .min(8, "Password must be at least 8 characters"),
  roleId: z.number().positive("Role is required"),
  registrationNumber: z.string().min(1).max(100),
  studentNumber: z.string().min(1).max(100),

  // File fields - now all optional
  passportPhoto: z.instanceof(File).optional().refine(
    (file) => !file || file.size <= 5 * 1024 * 1024,
    "Passport photo must be less than 5MB"
  ),
  idPhoto: z.instanceof(File).optional().refine(
    (file) => !file || file.size <= 5 * 1024 * 1024,
    "ID photo must be less than 5MB"
  ),
  certificate: z.instanceof(File).optional().refine(
    (file) => !file || file.size <= 10 * 1024 * 1024,
    "Certificate must be less than 10MB"
  ),
});

export type StudentFormDataClient = z.infer<typeof studentSchemaClient>;

export const staffSchemaClient = z.object({
  departmentId: z.number().positive("Department is required"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  idNumber: z.string().min(1, "ID number is required").max(50).optional().or(z.literal("")),
  position: z.string().min(1, "Position is required").max(100),
  password: z.string()
    .min(8, "Password must be at least 8 characters"),
  roleId: z.number().positive("Role is required"),

  // File fields (already optional)
  employmentDocuments: z.instanceof(File).optional(),
  nationalIdPhoto: z.instanceof(File).optional(),
  academicCertificates: z.instanceof(File).optional(),
  passportPhoto: z.instanceof(File).optional(),
});

// Type for the form data
export type StaffFormData = z.infer<typeof staffSchemaClient>;
