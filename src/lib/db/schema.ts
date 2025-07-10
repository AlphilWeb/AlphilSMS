import { pgTable, serial, text, timestamp, unique, index, foreignKey, integer, numeric, date, time, varchar } from 'drizzle-orm/pg-core';
import { relations, InferInsertModel, InferSelectModel } from 'drizzle-orm';

// --- Core Tables ---

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
});
export type NewRole = InferInsertModel<typeof roles>;
export type SelectRole = InferSelectModel<typeof roles>;

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  roleId: integer('role_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
export type NewUser = InferInsertModel<typeof users>;
export type SelectUser = InferSelectModel<typeof users>;

export const userLogs = pgTable('user_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  targetTable: varchar('target_table', { length: 100 }),
  targetId: integer('target_id'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  description: text('description'),
});
export type NewUserLog = InferInsertModel<typeof userLogs>;
export type SelectUserLog = InferSelectModel<typeof userLogs>;

// --- Academic Structure Tables ---

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  headOfDepartmentId: integer('head_of_department_id'), // FK to staff.id
});
export type NewDepartment = InferInsertModel<typeof departments>;
export type SelectDepartment = InferSelectModel<typeof departments>;

export const programs = pgTable('programs', {
  id: serial('id').primaryKey(),
  departmentId: integer('department_id').notNull(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  durationSemesters: integer('duration_semesters').notNull(),
});
export type NewProgram = InferInsertModel<typeof programs>;
export type SelectProgram = InferSelectModel<typeof programs>;

export const semesters = pgTable('semesters', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  startDate: date('start_date', { mode: 'string' }).notNull(),
  endDate: date('end_date', { mode: 'string' }).notNull(),
});
export type NewSemester = InferInsertModel<typeof semesters>;
export type SelectSemester = InferSelectModel<typeof semesters>;

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  programId: integer('program_id').notNull(),
  semesterId: integer('semester_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  credits: numeric('credits', { precision: 4, scale: 2 }).notNull(),
  description: text('description'),
}, (table) => {
  return {
    programCodeSemesterIdx: unique('program_code_semester_idx').on(table.programId, table.code, table.semesterId),
  };
});
export type NewCourse = InferInsertModel<typeof courses>;
export type SelectCourse = InferSelectModel<typeof courses>;

// --- User Type Tables ---

export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  programId: integer('program_id').notNull(),
  departmentId: integer('department_id').notNull(),
  currentSemesterId: integer('current_semester_id').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  registrationNumber: varchar('registration_number', { length: 100 }).notNull().unique(),
  studentNumber: varchar('student_number', { length: 100 }).notNull().unique(),
  passportPhotoUrl: text('passport_photo_url'),
  idPhotoUrl: text('id_photo_url'),
  certificateUrl: text('certificate_url'),
});
export type NewStudent = InferInsertModel<typeof students>;
export type SelectStudent = InferSelectModel<typeof students>;

export const staff = pgTable('staff', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  departmentId: integer('department_id').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  position: varchar('position', { length: 100 }).notNull(),
  employmentDocumentsUrl: text('employment_documents_url'),
  nationalIdPhotoUrl: text('national_id_photo_url'),
  academicCertificatesUrl: text('academic_certificates_url'),
  passportPhotoUrl: text('passport_photo_url'),
});
export type NewStaff = InferInsertModel<typeof staff>;
export type SelectStaff = InferSelectModel<typeof staff>;

// --- Academic Records Tables ---

export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull(),
  courseId: integer('course_id').notNull(),
  semesterId: integer('semester_id').notNull(),
  enrollmentDate: date('enrollment_date', { mode: 'string' }).defaultNow(),
}, (table) => {
  return {
    studentCourseSemesterIdx: unique('student_course_semester_idx').on(table.studentId, table.courseId, table.semesterId),
  };
});
export type NewEnrollment = InferInsertModel<typeof enrollments>;
export type SelectEnrollment = InferSelectModel<typeof enrollments>;

export const grades = pgTable('grades', {
  id: serial('id').primaryKey(),
  enrollmentId: integer('enrollment_id').notNull().unique(),
  catScore: numeric('cat_score', { precision: 5, scale: 2 }),
  examScore: numeric('exam_score', { precision: 5, scale: 2 }),
  totalScore: numeric('total_score', { precision: 5, scale: 2 }),
  letterGrade: varchar('letter_grade', { length: 5 }),
  gpa: numeric('gpa', { precision: 3, scale: 2 }),
});
export type NewGrade = InferInsertModel<typeof grades>;
export type SelectGrade = InferSelectModel<typeof grades>;

export const transcripts = pgTable('transcripts', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull(),
  semesterId: integer('semester_id').notNull(),
  gpa: numeric('gpa', { precision: 3, scale: 2 }),
  cgpa: numeric('cgpa', { precision: 3, scale: 2 }),
  generatedDate: timestamp('generated_date', { withTimezone: true }).defaultNow().notNull(),
  fileUrl: text('file_url'),
}, (table) => {
  return {
    studentSemesterTranscriptIdx: unique('student_semester_transcript_idx').on(table.studentId, table.semesterId),
  };
});
export type NewTranscript = InferInsertModel<typeof transcripts>;
export type SelectTranscript = InferSelectModel<typeof transcripts>;

export const timetables = pgTable('timetables', {
  id: serial('id').primaryKey(),
  semesterId: integer('semester_id').notNull(),
  courseId: integer('course_id').notNull(),
  lecturerId: integer('lecturer_id').notNull(),
  dayOfWeek: varchar('day_of_week', { length: 20 }).notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  room: varchar('room', { length: 50 }),
}, (table) => {
  return {
    semesterCourseDayTimeIdx: unique('semester_course_day_time_idx').on(table.semesterId, table.courseId, table.dayOfWeek, table.startTime),
  };
});
export type NewTimetable = InferInsertModel<typeof timetables>;
export type SelectTimetable = InferSelectModel<typeof timetables>;

// --- Finance Tables ---

export const feeStructures = pgTable('fee_structures', {
  id: serial('id').primaryKey(),
  programId: integer('program_id').notNull(),
  semesterId: integer('semester_id').notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
}, (table) => {
  return {
    programSemesterFeeIdx: unique('program_semester_fee_idx').on(table.programId, table.semesterId),
  };
});
export type NewFeeStructure = InferInsertModel<typeof feeStructures>;
export type SelectFeeStructure = InferSelectModel<typeof feeStructures>;

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull(),
  semesterId: integer('semester_id').notNull(),
  feeStructureId: integer('fee_structure_id'),
  amountDue: numeric('amount_due', { precision: 10, scale: 2 }).notNull(),
  amountPaid: numeric('amount_paid', { precision: 10, scale: 2 }).default('0.00').notNull(),
  balance: numeric('balance', { precision: 10, scale: 2 }).notNull(),
  dueDate: date('due_date', { mode: 'string' }).notNull(),
  issuedDate: timestamp('issued_date', { withTimezone: true }).defaultNow().notNull(),
  status: varchar('status', { length: 50 }).notNull(),
});
export type NewInvoice = InferInsertModel<typeof invoices>;
export type SelectInvoice = InferSelectModel<typeof invoices>;

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').notNull(),
  studentId: integer('student_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  transactionDate: timestamp('transaction_date', { withTimezone: true }).defaultNow().notNull(),
  referenceNumber: varchar('reference_number', { length: 255 }).unique(),
});
export type NewPayment = InferInsertModel<typeof payments>;
export type SelectPayment = InferSelectModel<typeof payments>;

export const staffSalaries = pgTable('staff_salaries', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  paymentDate: date('payment_date', { mode: 'string' }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull(),
});
export type NewStaffSalary = InferInsertModel<typeof staffSalaries>;
export type SelectStaffSalary = InferSelectModel<typeof staffSalaries>;

// --- Relations for Drizzle ORM ---

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  userLogs: many(userLogs),
  student: one(students, {
    fields: [users.id],
    references: [students.userId],
  }),
  staff: one(staff, {
    fields: [users.id],
    references: [staff.userId],
  }),
}));

export const userLogsRelations = relations(userLogs, ({ one }) => ({
  user: one(users, {
    fields: [userLogs.userId],
    references: [users.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ many, one }) => ({
  programs: many(programs),
  students: many(students),
  staff: many(staff),
  headOfDepartment: one(staff, {
    fields: [departments.headOfDepartmentId],
    references: [staff.id],
  }),
}));

export const programsRelations = relations(programs, ({ one, many }) => ({
  department: one(departments, {
    fields: [programs.departmentId],
    references: [departments.id],
  }),
  students: many(students),
  courses: many(courses),
  feeStructures: many(feeStructures),
}));

export const semestersRelations = relations(semesters, ({ many }) => ({
  students: many(students), // as current_semester_id
  courses: many(courses),
  enrollments: many(enrollments),
  transcripts: many(transcripts),
  timetables: many(timetables),
  feeStructures: many(feeStructures),
  invoices: many(invoices),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  program: one(programs, {
    fields: [courses.programId],
    references: [programs.id],
  }),
  semester: one(semesters, {
    fields: [courses.semesterId],
    references: [semesters.id],
  }),
  enrollments: many(enrollments),
  timetables: many(timetables),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  program: one(programs, {
    fields: [students.programId],
    references: [programs.id],
  }),
  department: one(departments, {
    fields: [students.departmentId],
    references: [departments.id],
  }),
  currentSemester: one(semesters, {
    fields: [students.currentSemesterId],
    references: [semesters.id],
  }),
  enrollments: many(enrollments),
  transcripts: many(transcripts),
  invoices: many(invoices),
  payments: many(payments),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(users, {
    fields: [staff.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [staff.departmentId],
    references: [departments.id],
  }),
  departmentsHeaded: many(departments), // For head_of_department_id
  timetables: many(timetables),
  staffSalaries: many(staffSalaries),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(students, {
    fields: [enrollments.studentId],
    references: [students.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  semester: one(semesters, {
    fields: [enrollments.semesterId],
    references: [semesters.id],
  }),
  grade: one(grades, {
    fields: [enrollments.id],
    references: [grades.enrollmentId],
  }),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [grades.enrollmentId],
    references: [enrollments.id],
  }),
}));

export const transcriptsRelations = relations(transcripts, ({ one }) => ({
  student: one(students, {
    fields: [transcripts.studentId],
    references: [students.id],
  }),
  semester: one(semesters, {
    fields: [transcripts.semesterId],
    references: [semesters.id],
  }),
}));

export const timetablesRelations = relations(timetables, ({ one }) => ({
  semester: one(semesters, {
    fields: [timetables.semesterId],
    references: [semesters.id],
  }),
  course: one(courses, {
    fields: [timetables.courseId],
    references: [courses.id],
  }),
  lecturer: one(staff, {
    fields: [timetables.lecturerId],
    references: [staff.id],
  }),
}));

export const feeStructuresRelations = relations(feeStructures, ({ one, many }) => ({
  program: one(programs, {
    fields: [feeStructures.programId],
    references: [programs.id],
  }),
  semester: one(semesters, {
    fields: [feeStructures.semesterId],
    references: [semesters.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  student: one(students, {
    fields: [invoices.studentId],
    references: [students.id],
  }),
  semester: one(semesters, {
    fields: [invoices.semesterId],
    references: [semesters.id],
  }),
  feeStructure: one(feeStructures, {
    fields: [invoices.feeStructureId],
    references: [feeStructures.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  student: one(students, { 
    fields: [payments.studentId],
    references: [students.id],
  }),
}));

export const staffSalariesRelations = relations(staffSalaries, ({ one }) => ({
  staff: one(staff, {
    fields: [staffSalaries.staffId],
    references: [staff.id],
  }),
}));