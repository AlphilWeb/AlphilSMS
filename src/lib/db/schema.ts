import { pgTable, serial, text, timestamp, unique, foreignKey, integer, numeric, date, time, varchar, boolean } from 'drizzle-orm/pg-core';
import { relations, InferInsertModel, InferSelectModel } from 'drizzle-orm';
// import { file } from 'zod';

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
}, (table) => { // <--- Add a callback function here for constraints
  return {
    // Explicit Foreign Key Constraint: users.roleId -> roles.id
    roleFk: foreignKey({
      columns: [table.roleId],
      foreignColumns: [roles.id],
    }).onDelete('restrict'), // Or 'cascade', 'set null', 'set default'
  };
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
}, (table) => {
  return {
    // Explicit Foreign Key Constraint: userLogs.userId -> users.id
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete('cascade'), // If a user is deleted, their logs are deleted
  };
});
export type NewUserLog = InferInsertModel<typeof userLogs>;
export type SelectUserLog = InferSelectModel<typeof userLogs>;

// --- Academic Structure Tables ---
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  headOfDepartmentId: integer('head_of_department_id'), // This will be a foreign key to staff.id
});
export type NewDepartment = InferInsertModel<typeof departments>;
export type SelectDepartment = InferSelectModel<typeof departments>;

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
}, (table) => {
  return {
    // Explicit Foreign Key Constraint: staff.userId -> users.id
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete('cascade'), // If a user is deleted, their staff record is deleted
    // Explicit Foreign Key Constraint: staff.departmentId -> departments.id
    departmentFk: foreignKey({
      columns: [table.departmentId],
      foreignColumns: [departments.id],
    }).onDelete('restrict'),
  };
});
export type NewStaff = InferInsertModel<typeof staff>;
export type SelectStaff = InferSelectModel<typeof staff>;

export const programs = pgTable('programs', {
  id: serial('id').primaryKey(),
  departmentId: integer('department_id').notNull(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  durationSemesters: integer('duration_semesters').notNull(),
}, (table) => {
  return {
    // Explicit Foreign Key Constraint: programs.departmentId -> departments.id
    departmentFk: foreignKey({
      columns: [table.departmentId],
      foreignColumns: [departments.id],
    }).onDelete('restrict'), // Or 'cascade' if deleting a department should delete its programs
  };
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
  lecturerId: integer('lecturer_id').notNull(), // Added lecturerId field
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  credits: numeric('credits', { precision: 4, scale: 2 }).notNull(),
  description: text('description'),
}, (table) => {
  return {
    programCodeSemesterIdx: unique('program_code_semester_idx').on(table.programId, table.code, table.semesterId),
    // Explicit Foreign Key Constraint: courses.programId -> programs.id
    programFk: foreignKey({
      columns: [table.programId],
      foreignColumns: [programs.id],
    }).onDelete('restrict'),
    // Explicit Foreign Key Constraint: courses.semesterId -> semesters.id
    semesterFk: foreignKey({
      columns: [table.semesterId],
      foreignColumns: [semesters.id],
    }).onDelete('restrict'),
    // Explicit Foreign Key Constraint: courses.lecturerId -> staff.id
    lecturerFk: foreignKey({
      columns: [table.lecturerId],
      foreignColumns: [staff.id],
    }).onDelete('restrict'),
  };
});
export type NewCourse = InferInsertModel<typeof courses>;
export type SelectCourse = InferSelectModel<typeof courses>;

// Course Content/Materials
export const courseMaterials = pgTable('course_materials', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').notNull(),
  uploadedById: integer('uploaded_by_id').notNull(), // staff
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // e.g., 'notes', 'presentation', 'video'
  fileUrl: text('file_url').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    courseFk: foreignKey({ columns: [table.courseId], foreignColumns: [courses.id] }).onDelete('cascade'),
    uploadedByFk: foreignKey({ columns: [table.uploadedById], foreignColumns: [staff.id] }).onDelete('set null'),
  };
});
export type NewCourseMaterial = InferInsertModel<typeof courseMaterials>;
export type SelectCourseMaterial = InferSelectModel<typeof courseMaterials>;

// Assignments
export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').notNull(),
  assignedById: integer('assigned_by_id').notNull(), // staff
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  fileUrl: text('file_url'), // Optional: if there's an attachment
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  assignedDate: timestamp('assigned_date', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    courseFk: foreignKey({ columns: [table.courseId], foreignColumns: [courses.id] }).onDelete('cascade'),
    assignedByFk: foreignKey({ columns: [table.assignedById], foreignColumns: [staff.id] }).onDelete('set null'),
  };
});
export type NewAssignment = InferInsertModel<typeof assignments>;
export type SelectAssignment = InferSelectModel<typeof assignments>;

// Quizzes
export const quizzes = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').notNull(),
  createdById: integer('created_by_id').notNull(), // staff
  title: varchar('title', { length: 255 }).notNull(),
  instructions: text('instructions'),
  fileUrl: text('file_url').notNull(),
  totalMarks: integer('total_marks').notNull(),
  quizDate: timestamp('quiz_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    courseFk: foreignKey({ columns: [table.courseId], foreignColumns: [courses.id] }).onDelete('cascade'),
    createdByFk: foreignKey({ columns: [table.createdById], foreignColumns: [staff.id] }).onDelete('set null'),
  };
});
export type NewQuiz = InferInsertModel<typeof quizzes>;
export type SelectQuiz = InferSelectModel<typeof quizzes>;

export const assignmentSubmissions = pgTable('assignment_submissions', {
  id: serial('id').primaryKey(),
  assignmentId: integer('assignment_id').notNull(),
  studentId: integer('student_id').notNull(),
  fileUrl: text('file_url').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  remarks: text('remarks'),
  grade: numeric('grade', { precision: 5, scale: 2 }),
}, (table) => {
  return {
    assignmentFk: foreignKey({ columns: [table.assignmentId], foreignColumns: [assignments.id] }).onDelete('cascade'),
    studentFk: foreignKey({ columns: [table.studentId], foreignColumns: [students.id] }).onDelete('cascade'),
  };
});
export type NewAssignmentSubmission = InferInsertModel<typeof assignmentSubmissions>;
export type SelectAssignmentSubmission = InferSelectModel<typeof assignmentSubmissions>;

export const quizSubmissions = pgTable('quiz_submissions', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').notNull(),
  studentId: integer('student_id').notNull(),
  fileUrl: text('file_url').notNull(),
  score: numeric('score', { precision: 5, scale: 2 }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  feedback: text('feedback'),
}, (table) => {
  return {
    quizFk: foreignKey({ columns: [table.quizId], foreignColumns: [quizzes.id] }).onDelete('cascade'),
    studentFk: foreignKey({ columns: [table.studentId], foreignColumns: [students.id] }).onDelete('cascade'),
  };
});
export type NewQuizSubmission = InferInsertModel<typeof quizSubmissions>;
export type SelectQuizSubmission = InferSelectModel<typeof quizSubmissions>;

export const materialViews = pgTable('material_views', {
  id: serial('id').primaryKey(),
  materialId: integer('material_id').notNull(),
  studentId: integer('student_id').notNull(),
  viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow().notNull(),
  interactionType: varchar('interaction_type', { length: 50 }).notNull(), // e.g. 'viewed', 'downloaded'
}, (table) => {
  return {
    materialFk: foreignKey({ columns: [table.materialId], foreignColumns: [courseMaterials.id] }).onDelete('cascade'),
    studentFk: foreignKey({ columns: [table.studentId], foreignColumns: [students.id] }).onDelete('cascade'),
  };
});
export type NewMaterialView = InferInsertModel<typeof materialViews>;
export type SelectMaterialView = InferSelectModel<typeof materialViews>;


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
}, (table) => {
  return {
    // Explicit Foreign Key Constraint: students.userId -> users.id
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete('cascade'), // If a user is deleted, their student record is deleted
    // Explicit Foreign Key Constraint: students.programId -> programs.id
    programFk: foreignKey({
      columns: [table.programId],
      foreignColumns: [programs.id],
    }).onDelete('restrict'),
    // Explicit Foreign Key Constraint: students.departmentId -> departments.id
    departmentFk: foreignKey({
      columns: [table.departmentId],
      foreignColumns: [departments.id],
    }).onDelete('restrict'),
    // Explicit Foreign Key Constraint: students.currentSemesterId -> semesters.id
    currentSemesterFk: foreignKey({
      columns: [table.currentSemesterId],
      foreignColumns: [semesters.id],
    }).onDelete('restrict'),
  };
});
export type NewStudent = InferInsertModel<typeof students>;
export type SelectStudent = InferSelectModel<typeof students>;


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
    // Explicit Foreign Key Constraint: enrollments.studentId -> students.id
    studentFk: foreignKey({
      columns: [table.studentId],
      foreignColumns: [students.id],
    }).onDelete('cascade'),
    // Explicit Foreign Key Constraint: enrollments.courseId -> courses.id
    courseFk: foreignKey({
      columns: [table.courseId],
      foreignColumns: [courses.id],
    }).onDelete('restrict'),
    // Explicit Foreign Key Constraint: enrollments.semesterId -> semesters.id
    semesterFk: foreignKey({
      columns: [table.semesterId],
      foreignColumns: [semesters.id],
    }).onDelete('restrict'),
  };
});
export type NewEnrollment = InferInsertModel<typeof enrollments>;
export type SelectEnrollment = InferSelectModel<typeof enrollments>;

export const grades = pgTable('grades', {
  id: serial('id').primaryKey(),
  enrollmentId: integer('enrollment_id').unique(),
  catScore: numeric('cat_score', { precision: 5, scale: 2 }),
  examScore: numeric('exam_score', { precision: 5, scale: 2 }),
  totalScore: numeric('total_score', { precision: 5, scale: 2 }),
  letterGrade: varchar('letter_grade', { length: 5 }),
  gpa: numeric('gpa', { precision: 3, scale: 2 }),
}, (table) => {
  return {
    // Explicit Foreign Key Constraint: grades.enrollmentId -> enrollments.id
    enrollmentFk: foreignKey({
      columns: [table.enrollmentId],
      foreignColumns: [enrollments.id],
    }).onDelete('cascade'),
  };
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
    // Explicit Foreign Key Constraint: transcripts.studentId -> students.id
    studentFk: foreignKey({
      columns: [table.studentId],
      foreignColumns: [students.id],
    }).onDelete('cascade'),
    // Explicit Foreign Key Constraint: transcripts.semesterId -> semesters.id
    semesterFk: foreignKey({
      columns: [table.semesterId],
      foreignColumns: [semesters.id],
    }).onDelete('restrict'),
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
    // Explicit Foreign Key Constraint: timetables.semesterId -> semesters.id
    semesterFk: foreignKey({
      columns: [table.semesterId],
      foreignColumns: [semesters.id],
    }).onDelete('restrict'),
    // Explicit Foreign Key Constraint: timetables.courseId -> courses.id
    courseFk: foreignKey({
      columns: [table.courseId],
      foreignColumns: [courses.id],
    }).onDelete('restrict'),
    // Explicit Foreign Key Constraint: timetables.lecturerId -> staff.id
    lecturerFk: foreignKey({
      columns: [table.lecturerId],
      foreignColumns: [staff.id],
    }).onDelete('restrict'),
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
    // Explicit Foreign Key Constraint: feeStructures.programId -> programs.id
    programFk: foreignKey({
      columns: [table.programId],
      foreignColumns: [programs.id],
    }).onDelete('restrict'),
    // Explicit Foreign Key Constraint: feeStructures.semesterId -> semesters.id
    semesterFk: foreignKey({
      columns: [table.semesterId],
      foreignColumns: [semesters.id],
    }).onDelete('restrict'),
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
}, (table) => {
  return {
    // Explicit Foreign Key Constraint: invoices.studentId -> students.id
    studentFk: foreignKey({
      columns: [table.studentId],
      foreignColumns: [students.id],
    }).onDelete('cascade'),
    // Explicit Foreign Key Constraint: invoices.semesterId -> semesters.id
    semesterFk: foreignKey({
      columns: [table.semesterId],
      foreignColumns: [semesters.id],
    }).onDelete('restrict'),
    // Explicit Foreign Key Constraint: invoices.feeStructureId -> feeStructures.id
    feeStructureFk: foreignKey({
      columns: [table.feeStructureId],
      foreignColumns: [feeStructures.id],
    }).onDelete('set null'), // If a fee structure is deleted, set to null
  };
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
}, (table) => {
  return {
    // Explicit Foreign Key Constraint: payments.invoiceId -> invoices.id
    invoiceFk: foreignKey({
      columns: [table.invoiceId],
      foreignColumns: [invoices.id],
    }).onDelete('cascade'),
    // Explicit Foreign Key Constraint: payments.studentId -> students.id
    studentFk: foreignKey({
      columns: [table.studentId],
      foreignColumns: [students.id],
    }).onDelete('restrict'), // Should restrict deletion of student if payments exist
  };
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
}, (table) => {
  return {
    // Explicit Foreign Key Constraint: staffSalaries.staffId -> staff.id
    staffFk: foreignKey({
      columns: [table.staffId],
      foreignColumns: [staff.id],
    }).onDelete('cascade'),
  };
});
export type NewStaffSalary = InferInsertModel<typeof staffSalaries>;
export type SelectStaffSalary = InferSelectModel<typeof staffSalaries>;

// --- Drizzle Relations (these are still important for querying) ---
// Keep all your existing relations definitions as they are, they are correct for Drizzle queries.
// Add to your schema file
export const academicCalendarEvents = pgTable('academic_calendar_events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'holiday', 'exam', 'registration', 'break', 'other'
  semesterId: integer('semester_id').notNull(),
  isRecurring: boolean('is_recurring').default(false),
  recurringPattern: text('recurring_pattern'), // e.g., 'RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO'
  location: varchar('location', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdById: integer('created_by_id').notNull(), // staff ID who created it
}, (table) => {
  return {
    semesterFk: foreignKey({
      columns: [table.semesterId],
      foreignColumns: [semesters.id],
    }).onDelete('cascade'),
    createdByFk: foreignKey({
      columns: [table.createdById],
      foreignColumns: [staff.id],
    }).onDelete('set null'),
  };
});

export type NewAcademicCalendarEvent = InferInsertModel<typeof academicCalendarEvents>;
export type SelectAcademicCalendarEvent = InferSelectModel<typeof academicCalendarEvents>;

// Add to your relations
export const academicCalendarEventsRelations = relations(academicCalendarEvents, ({ one }) => ({
  semester: one(semesters, {
    fields: [academicCalendarEvents.semesterId],
    references: [semesters.id],
  }),
  createdBy: one(staff, {
    fields: [academicCalendarEvents.createdById],
    references: [staff.id],
  }),
}));

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
  lecturer: one(staff, {  // Added lecturer relation
    fields: [courses.lecturerId],
    references: [staff.id],
  }),
  enrollments: many(enrollments),
  timetables: many(timetables),
}));

export const courseMaterialsRelations = relations(courseMaterials, ({ one }) => ({
  course: one(courses, {
    fields: [courseMaterials.courseId],
    references: [courses.id],
  }),
  uploadedBy: one(staff, {
    fields: [courseMaterials.uploadedById],
    references: [staff.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  course: one(courses, {
    fields: [assignments.courseId],
    references: [courses.id],
  }),
  assignedBy: one(staff, {
    fields: [assignments.assignedById],
    references: [staff.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one }) => ({
  course: one(courses, {
    fields: [quizzes.courseId],
    references: [courses.id],
  }),
  createdBy: one(staff, {
    fields: [quizzes.createdById],
    references: [staff.id],
  }),
}));

export const assignmentSubmissionsRelations = relations(assignmentSubmissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [assignmentSubmissions.assignmentId],
    references: [assignments.id],
  }),
  student: one(students, {
    fields: [assignmentSubmissions.studentId],
    references: [students.id],
  }),
}));

export const quizSubmissionsRelations = relations(quizSubmissions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizSubmissions.quizId],
    references: [quizzes.id],
  }),
  student: one(students, {
    fields: [quizSubmissions.studentId],
    references: [students.id],
  }),
}));

export const materialViewsRelations = relations(materialViews, ({ one }) => ({
  material: one(courseMaterials, {
    fields: [materialViews.materialId],
    references: [courseMaterials.id],
  }),
  student: one(students, {
    fields: [materialViews.studentId],
    references: [students.id],
  }),
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
  courses: many(courses), // Added courses relation
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