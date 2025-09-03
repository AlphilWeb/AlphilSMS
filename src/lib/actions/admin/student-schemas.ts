import { z } from "zod";

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
  contact1: z.string().min(9),
  contact2: z.string().optional(),
  contact3: z.string().optional(),
  dateJoined: z.string().min(1), // ISO date string
});

export type StudentWithDetailsFormData = z.infer<typeof studentWithDetailsSchemaClient>;