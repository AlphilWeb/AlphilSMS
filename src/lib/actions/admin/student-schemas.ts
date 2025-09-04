// Interface for student with details
export interface StudentWithDetailsFormData {
  // Student basic info
  firstName: string;
  lastName: string;
  email: string;
  idNumber?: string | null;
  registrationNumber: string;
  studentNumber: string;
  programId: number;
  departmentId: number;
  currentSemesterId: number;
  password: string;
  roleId: number;
  
  // Personal details
  age: number;
  sex: string;
  county: string;
  village: string;
  contact1: string;
  contact2?: string;
  contact3?: string;
  dateJoined: string;
}