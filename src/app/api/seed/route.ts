import { db } from '@/lib/db/config';
import { eq } from 'drizzle-orm';
import {
  roles,
  users,
  departments,
  staff,
  programs,
  semesters,
  students,
  courses,
  enrollments,
  timetables,
  courseMaterials,
  assignments,
  quizzes,
  assignmentSubmissions,
  quizSubmissions,
  materialViews
} from '@/lib/db/schema';
import {hash} from 'bcryptjs';

async function clearDatabase() {
  console.log('Clearing existing database data...');
  
  // Clear data in reverse order of dependencies (child tables first)
  await db.delete(materialViews).execute();
  console.log('Cleared material_views table');
  
  await db.delete(quizSubmissions).execute();
  console.log('Cleared quiz_submissions table');
  
  await db.delete(assignmentSubmissions).execute();
  console.log('Cleared assignment_submissions table');
  
  await db.delete(quizzes).execute();
  console.log('Cleared quizzes table');
  
  await db.delete(assignments).execute();
  console.log('Cleared assignments table');
  
  await db.delete(courseMaterials).execute();
  console.log('Cleared course_materials table');
  
  await db.delete(timetables).execute();
  console.log('Cleared timetables table');
  
  await db.delete(enrollments).execute();
  console.log('Cleared enrollments table');
  
  await db.delete(students).execute();
  console.log('Cleared students table');
  
  await db.delete(courses).execute();
  console.log('Cleared courses table');
  
  await db.delete(programs).execute();
  console.log('Cleared programs table');
  
  await db.delete(staff).execute();
  console.log('Cleared staff table');
  
  await db.delete(departments).execute();
  console.log('Cleared departments table');
  
  await db.delete(semesters).execute();
  console.log('Cleared semesters table');
  
  await db.delete(users).execute();
  console.log('Cleared users table');
  
  await db.delete(roles).execute();
  console.log('Cleared roles table');
  
  console.log('Database cleared successfully!');
}

// Helper function to generate random dates within a range
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

async function seedDatabase() {
  await clearDatabase();
  console.log('Starting database seeding...');

  const commonPassword = await hash('password', 10);

  // Seed Roles
  console.log('Seeding roles...');
  const roleData = [
    { name: 'admin' },
    { name: 'bursar' },
    { name: 'registrar' },
    { name: 'hod' },
    { name: 'lecturer' },
    { name: 'student' },
  ];
  const insertedRoles = await db.insert(roles).values(roleData).returning();

  // Seed Users
  console.log('Seeding users...');
  const userData = [
    // Admin
    { email: 'admin@university.edu', passwordHash: commonPassword, roleId: insertedRoles[0].id },
    
    // Bursar
    { email: 'bursar@university.edu', passwordHash: commonPassword, roleId: insertedRoles[1].id },
    
    // Registrar
    { email: 'registrar@university.edu', passwordHash: commonPassword, roleId: insertedRoles[2].id },
    
    // HODs
    { email: 'hod.cs@university.edu', passwordHash: commonPassword, roleId: insertedRoles[3].id },
    { email: 'hod.ee@university.edu', passwordHash: commonPassword, roleId: insertedRoles[3].id },
    { email: 'hod.ba@university.edu', passwordHash: commonPassword, roleId: insertedRoles[3].id },
    
    // Lecturers
    { email: 'lecturer1@university.edu', passwordHash: commonPassword, roleId: insertedRoles[4].id },
    { email: 'lecturer2@university.edu', passwordHash: commonPassword, roleId: insertedRoles[4].id },
    { email: 'lecturer3@university.edu', passwordHash: commonPassword, roleId: insertedRoles[4].id },
    { email: 'lecturer4@university.edu', passwordHash: commonPassword, roleId: insertedRoles[4].id },
    { email: 'lecturer5@university.edu', passwordHash: commonPassword, roleId: insertedRoles[4].id },
    
    // Students
    { email: 'student1@university.edu', passwordHash: commonPassword, roleId: insertedRoles[5].id },
    { email: 'student2@university.edu', passwordHash: commonPassword, roleId: insertedRoles[5].id },
    { email: 'student3@university.edu', passwordHash: commonPassword, roleId: insertedRoles[5].id },
    { email: 'student4@university.edu', passwordHash: commonPassword, roleId: insertedRoles[5].id },
    { email: 'student5@university.edu', passwordHash: commonPassword, roleId: insertedRoles[5].id },
    { email: 'student6@university.edu', passwordHash: commonPassword, roleId: insertedRoles[5].id },
    { email: 'student7@university.edu', passwordHash: commonPassword, roleId: insertedRoles[5].id },
    { email: 'student8@university.edu', passwordHash: commonPassword, roleId: insertedRoles[5].id },
  ];
  const insertedUsers = await db.insert(users).values(userData).returning();

  // Seed Departments
  console.log('Seeding departments...');
  const departmentData = [
    { name: 'Computer Science' },
    { name: 'Electrical Engineering' },
    { name: 'Business Administration' },
    { name: 'Medicine' },
    { name: 'Law' },
  ];
  const insertedDepartments = await db.insert(departments).values(departmentData).returning();

  // Seed Staff
  console.log('Seeding staff...');
  const staffData = [
    // Bursar
    { 
      userId: insertedUsers[1].id,
      departmentId: insertedDepartments[0].id,
      firstName: 'John',
      lastName: 'Smith',
      email: 'bursar@university.edu',
      position: 'bursar',
      passportPhotoUrl: 'https://example.com/photos/bursar',
      nationalIdPhotoUrl: 'https://example.com/ids/bursar',
    },
    
    // Registrar
    { 
      userId: insertedUsers[2].id,
      departmentId: insertedDepartments[0].id,
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'registrar@university.edu',
      position: 'registrar',
      passportPhotoUrl: 'https://example.com/photos/registrar',
      nationalIdPhotoUrl: 'https://example.com/ids/registrar',
    },
    
    // HODs
    { 
      userId: insertedUsers[3].id,
      departmentId: insertedDepartments[0].id,
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'hod.cs@university.edu',
      position: 'hod',
      passportPhotoUrl: 'https://example.com/photos/hod_cs',
      nationalIdPhotoUrl: 'https://example.com/ids/hod_cs',
    },
    { 
      userId: insertedUsers[4].id,
      departmentId: insertedDepartments[1].id,
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'hod.ee@university.edu',
      position: 'hod',
      passportPhotoUrl: 'https://example.com/photos/hod_ee',
      nationalIdPhotoUrl: 'https://example.com/ids/hod_ee',
    },
    { 
      userId: insertedUsers[5].id,
      departmentId: insertedDepartments[2].id,
      firstName: 'David',
      lastName: 'Wilson',
      email: 'hod.ba@university.edu',
      position: 'hod',
      passportPhotoUrl: 'https://example.com/photos/hod_ba',
      nationalIdPhotoUrl: 'https://example.com/ids/hod_ba',
    },
    
    // Lecturers
    { 
      userId: insertedUsers[6].id,
      departmentId: insertedDepartments[0].id,
      firstName: 'Robert',
      lastName: 'Johnson',
      email: 'lecturer1@university.edu',
      position: 'lecturer',
      passportPhotoUrl: 'https://example.com/photos/lecturer1',
      nationalIdPhotoUrl: 'https://example.com/ids/lecturer1',
    },
    { 
      userId: insertedUsers[7].id,
      departmentId: insertedDepartments[0].id,
      firstName: 'Jennifer',
      lastName: 'Williams',
      email: 'lecturer2@university.edu',
      position: 'lecturer',
      passportPhotoUrl: 'https://example.com/photos/lecturer2',
      nationalIdPhotoUrl: 'https://example.com/ids/lecturer2',
    },
    { 
      userId: insertedUsers[8].id,
      departmentId: insertedDepartments[1].id,
      firstName: 'Thomas',
      lastName: 'Jones',
      email: 'lecturer3@university.edu',
      position: 'lecturer',
      passportPhotoUrl: 'https://example.com/photos/lecturer3',
      nationalIdPhotoUrl: 'https://example.com/ids/lecturer3',
    },
    { 
      userId: insertedUsers[9].id,
      departmentId: insertedDepartments[1].id,
      firstName: 'Lisa',
      lastName: 'Miller',
      email: 'lecturer4@university.edu',
      position: 'lecturer',
      passportPhotoUrl: 'https://example.com/photos/lecturer4',
      nationalIdPhotoUrl: 'https://example.com/ids/lecturer4',
    },
    { 
      userId: insertedUsers[10].id,
      departmentId: insertedDepartments[2].id,
      firstName: 'Paul',
      lastName: 'Taylor',
      email: 'lecturer5@university.edu',
      position: 'lecturer',
      passportPhotoUrl: 'https://example.com/photos/lecturer5',
      nationalIdPhotoUrl: 'https://example.com/ids/lecturer5',
    },
  ];
  const insertedStaff = await db.insert(staff).values(staffData).returning();

  // Update departments with heads
  console.log('Setting department heads...');
  await db.update(departments)
    .set({ headOfDepartmentId: insertedStaff[2].id }) // Michael Brown as head of Computer Science
    .where(eq(departments.id, insertedDepartments[0].id));

  await db.update(departments)
    .set({ headOfDepartmentId: insertedStaff[3].id }) // Emily Davis as head of Electrical Engineering
    .where(eq(departments.id, insertedDepartments[1].id));

  await db.update(departments)
    .set({ headOfDepartmentId: insertedStaff[4].id }) // David Wilson as head of Business Admin
    .where(eq(departments.id, insertedDepartments[2].id));

  // Seed Programs
  console.log('Seeding programs...');
  const programData = [
    { departmentId: insertedDepartments[0].id, name: 'Computer Science', code: 'CS', durationSemesters: 8 },
    { departmentId: insertedDepartments[0].id, name: 'Software Engineering', code: 'SE', durationSemesters: 8 },
    { departmentId: insertedDepartments[1].id, name: 'Electrical Engineering', code: 'EE', durationSemesters: 8 },
    { departmentId: insertedDepartments[1].id, name: 'Electronics Engineering', code: 'ECE', durationSemesters: 8 },
    { departmentId: insertedDepartments[2].id, name: 'Business Administration', code: 'BA', durationSemesters: 8 },
    { departmentId: insertedDepartments[2].id, name: 'Accounting', code: 'ACC', durationSemesters: 8 },
    { departmentId: insertedDepartments[3].id, name: 'Medicine', code: 'MD', durationSemesters: 12 },
    { departmentId: insertedDepartments[4].id, name: 'Law', code: 'LLB', durationSemesters: 10 },
  ];
  const insertedPrograms = await db.insert(programs).values(programData).returning();

  // Seed Semesters
  console.log('Seeding semesters...');
  const semesterData = [
    { name: 'Fall 2023', startDate: '2023-09-01', endDate: '2023-12-15' },
    { name: 'Spring 2024', startDate: '2024-01-15', endDate: '2024-05-01' },
    { name: 'Summer 2024', startDate: '2024-06-01', endDate: '2024-08-15' },
    { name: 'Fall 2024', startDate: '2024-09-01', endDate: '2024-12-15' },
  ];
  const insertedSemesters = await db.insert(semesters).values(semesterData).returning();

  // Seed Students
  console.log('Seeding students...');
  const studentData = [
    { 
      userId: insertedUsers[11].id,
      programId: insertedPrograms[0].id,
      departmentId: insertedDepartments[0].id,
      currentSemesterId: insertedSemesters[0].id,
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'student1@university.edu',
      registrationNumber: 'REG20230001',
      studentNumber: 'STU20230001',
      passportPhotoUrl: 'https://example.com/photos/student1',
      idPhotoUrl: 'https://example.com/ids/student1',
      certificateUrl: 'https://example.com/certs/student1',
    },
    { 
      userId: insertedUsers[12].id,
      programId: insertedPrograms[0].id,
      departmentId: insertedDepartments[0].id,
      currentSemesterId: insertedSemesters[0].id,
      firstName: 'Bob',
      lastName: 'Williams',
      email: 'student2@university.edu',
      registrationNumber: 'REG20230002',
      studentNumber: 'STU20230002',
      passportPhotoUrl: 'https://example.com/photos/student2',
      idPhotoUrl: 'https://example.com/ids/student2',
      certificateUrl: 'https://example.com/certs/student2',
    },
    { 
      userId: insertedUsers[13].id,
      programId: insertedPrograms[1].id,
      departmentId: insertedDepartments[0].id,
      currentSemesterId: insertedSemesters[1].id,
      firstName: 'Charlie',
      lastName: 'Davis',
      email: 'student3@university.edu',
      registrationNumber: 'REG20230003',
      studentNumber: 'STU20230003',
      passportPhotoUrl: 'https://example.com/photos/student3',
      idPhotoUrl: 'https://example.com/ids/student3',
      certificateUrl: 'https://example.com/certs/student3',
    },
    { 
      userId: insertedUsers[14].id,
      programId: insertedPrograms[2].id,
      departmentId: insertedDepartments[1].id,
      currentSemesterId: insertedSemesters[0].id,
      firstName: 'Diana',
      lastName: 'Miller',
      email: 'student4@university.edu',
      registrationNumber: 'REG20230004',
      studentNumber: 'STU20230004',
      passportPhotoUrl: 'https://example.com/photos/student4',
      idPhotoUrl: 'https://example.com/ids/student4',
      certificateUrl: 'https://example.com/certs/student4',
    },
    { 
      userId: insertedUsers[15].id,
      programId: insertedPrograms[3].id,
      departmentId: insertedDepartments[1].id,
      currentSemesterId: insertedSemesters[1].id,
      firstName: 'Edward',
      lastName: 'Wilson',
      email: 'student5@university.edu',
      registrationNumber: 'REG20230005',
      studentNumber: 'STU20230005',
      passportPhotoUrl: 'https://example.com/photos/student5',
      idPhotoUrl: 'https://example.com/ids/student5',
      certificateUrl: 'https://example.com/certs/student5',
    },
    { 
      userId: insertedUsers[16].id,
      programId: insertedPrograms[4].id,
      departmentId: insertedDepartments[2].id,
      currentSemesterId: insertedSemesters[2].id,
      firstName: 'Fiona',
      lastName: 'Moore',
      email: 'student6@university.edu',
      registrationNumber: 'REG20230006',
      studentNumber: 'STU20230006',
      passportPhotoUrl: 'https://example.com/photos/student6',
      idPhotoUrl: 'https://example.com/ids/student6',
      certificateUrl: 'https://example.com/certs/student6',
    },
    { 
      userId: insertedUsers[17].id,
      programId: insertedPrograms[5].id,
      departmentId: insertedDepartments[2].id,
      currentSemesterId: insertedSemesters[3].id,
      firstName: 'George',
      lastName: 'Taylor',
      email: 'student7@university.edu',
      registrationNumber: 'REG20230007',
      studentNumber: 'STU20230007',
      passportPhotoUrl: 'https://example.com/photos/student7',
      idPhotoUrl: 'https://example.com/ids/student7',
      certificateUrl: 'https://example.com/certs/student7',
    },
  ];
  const insertedStudents = await db.insert(students).values(studentData).returning();

  // Seed Courses (focusing on Computer Science and Electrical Engineering)
  console.log('Seeding courses...');
  const courseData = [
    // Computer Science Courses (Fall 2023) - Lecturer: Robert Johnson
    {
      programId: insertedPrograms[0].id,
      semesterId: insertedSemesters[0].id,
      lecturerId: insertedStaff[5].id,
      name: 'Introduction to Programming',
      code: 'CS101',
      credits: '3.00',
      description: 'Fundamentals of programming using Python',
    },
    {
      programId: insertedPrograms[0].id,
      semesterId: insertedSemesters[0].id,
      lecturerId: insertedStaff[6].id,
      name: 'Discrete Mathematics',
      code: 'CS102',
      credits: '3.00',
      description: 'Mathematical foundations for computer science',
    },
    {
      programId: insertedPrograms[0].id,
      semesterId: insertedSemesters[0].id,
      lecturerId: insertedStaff[5].id,
      name: 'Computer Organization',
      code: 'CS103',
      credits: '3.00',
      description: 'Computer architecture and organization',
    },
    
    // Computer Science Courses (Spring 2024) - Lecturer: Jennifer Williams
    {
      programId: insertedPrograms[0].id,
      semesterId: insertedSemesters[1].id,
      lecturerId: insertedStaff[6].id,
      name: 'Data Structures',
      code: 'CS201',
      credits: '3.00',
      description: 'Basic data structures and algorithms',
    },
    {
      programId: insertedPrograms[0].id,
      semesterId: insertedSemesters[1].id,
      lecturerId: insertedStaff[5].id,
      name: 'Database Systems',
      code: 'CS202',
      credits: '3.00',
      description: 'Relational databases and SQL',
    },
    {
      programId: insertedPrograms[0].id,
      semesterId: insertedSemesters[1].id,
      lecturerId: insertedStaff[6].id,
      name: 'Operating Systems',
      code: 'CS203',
      credits: '3.00',
      description: 'Principles of operating systems',
    },
    
    // Electrical Engineering Courses (Fall 2023) - Lecturer: Thomas Jones
    {
      programId: insertedPrograms[2].id,
      semesterId: insertedSemesters[0].id,
      lecturerId: insertedStaff[7].id,
      name: 'Circuit Theory',
      code: 'EE101',
      credits: '3.00',
      description: 'Fundamentals of electrical circuits',
    },
    {
      programId: insertedPrograms[2].id,
      semesterId: insertedSemesters[0].id,
      lecturerId: insertedStaff[8].id,
      name: 'Electronics I',
      code: 'EE102',
      credits: '3.00',
      description: 'Introduction to electronic components',
    },
    
    // Electrical Engineering Courses (Spring 2024) - Lecturer: Thomas Jones
    {
      programId: insertedPrograms[2].id,
      semesterId: insertedSemesters[1].id,
      lecturerId: insertedStaff[7].id,
      name: 'Digital Electronics',
      code: 'EE201',
      credits: '3.00',
      description: 'Digital logic and circuit design',
    },
    {
      programId: insertedPrograms[2].id,
      semesterId: insertedSemesters[1].id,
      lecturerId: insertedStaff[8].id,
      name: 'Signals and Systems',
      code: 'EE202',
      credits: '3.00',
      description: 'Analysis of continuous and discrete signals',
    },
    
    // Business Administration Courses (Fall 2023) - Lecturer: Paul Taylor
    {
      programId: insertedPrograms[4].id,
      semesterId: insertedSemesters[0].id,
      lecturerId: insertedStaff[9].id,
      name: 'Principles of Management',
      code: 'BA101',
      credits: '3.00',
      description: 'Introduction to business management',
    },
    {
      programId: insertedPrograms[4].id,
      semesterId: insertedSemesters[0].id,
      lecturerId: insertedStaff[9].id,
      name: 'Business Communication',
      code: 'BA102',
      credits: '3.00',
      description: 'Effective communication in business',
    },
  ];
  const insertedCourses = await db.insert(courses).values(courseData).returning();

  // Seed Timetables (assigning lecturers to courses)
  console.log('Seeding timetables...');
  const timetableData = [
    // Computer Science Courses
    {
      semesterId: insertedSemesters[0].id,
      courseId: insertedCourses[0].id,
      lecturerId: insertedStaff[5].id, // Robert Johnson
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:30',
      room: 'CS101',
    },
    {
      semesterId: insertedSemesters[0].id,
      courseId: insertedCourses[1].id,
      lecturerId: insertedStaff[6].id, // Jennifer Williams
      dayOfWeek: 'Tuesday',
      startTime: '10:00',
      endTime: '11:30',
      room: 'CS102',
    },
    {
      semesterId: insertedSemesters[0].id,
      courseId: insertedCourses[2].id,
      lecturerId: insertedStaff[5].id, // Robert Johnson
      dayOfWeek: 'Wednesday',
      startTime: '14:00',
      endTime: '15:30',
      room: 'CS103',
    },
    {
      semesterId: insertedSemesters[1].id,
      courseId: insertedCourses[3].id,
      lecturerId: insertedStaff[6].id, // Jennifer Williams
      dayOfWeek: 'Monday',
      startTime: '11:00',
      endTime: '12:30',
      room: 'CS201',
    },
    {
      semesterId: insertedSemesters[1].id,
      courseId: insertedCourses[4].id,
      lecturerId: insertedStaff[5].id, // Robert Johnson
      dayOfWeek: 'Thursday',
      startTime: '09:00',
      endTime: '10:30',
      room: 'CS202',
    },
    
    // Electrical Engineering Courses
    {
      semesterId: insertedSemesters[0].id,
      courseId: insertedCourses[6].id,
      lecturerId: insertedStaff[7].id, // Thomas Jones
      dayOfWeek: 'Monday',
      startTime: '13:00',
      endTime: '14:30',
      room: 'EE101',
    },
    {
      semesterId: insertedSemesters[0].id,
      courseId: insertedCourses[7].id,
      lecturerId: insertedStaff[8].id, // Lisa Miller
      dayOfWeek: 'Friday',
      startTime: '10:00',
      endTime: '11:30',
      room: 'EE102',
    },
    {
      semesterId: insertedSemesters[1].id,
      courseId: insertedCourses[8].id,
      lecturerId: insertedStaff[7].id, // Thomas Jones
      dayOfWeek: 'Wednesday',
      startTime: '09:00',
      endTime: '10:30',
      room: 'EE201',
    },
    
    // Business Administration Courses
    {
      semesterId: insertedSemesters[0].id,
      courseId: insertedCourses[10].id,
      lecturerId: insertedStaff[9].id, // Paul Taylor
      dayOfWeek: 'Tuesday',
      startTime: '14:00',
      endTime: '15:30',
      room: 'BA101',
    },
  ];
  const insertedTimetables = await db.insert(timetables).values(timetableData).returning();

  // Seed Course Materials
  console.log('Seeding course materials...');
  const courseMaterialData = [
    {
      courseId: insertedCourses[0].id,
      uploadedById: insertedStaff[5].id,
      title: 'Python Basics Slides',
      type: 'presentation',
      fileUrl: 'https://example.com/materials/python-basics.pdf',
    },
    {
      courseId: insertedCourses[0].id,
      uploadedById: insertedStaff[5].id,
      title: 'Python Exercises',
      type: 'document',
      fileUrl: 'https://example.com/materials/python-exercises.pdf',
    },
    {
      courseId: insertedCourses[3].id,
      uploadedById: insertedStaff[6].id,
      title: 'Data Structures Lecture Notes',
      type: 'document',
      fileUrl: 'https://example.com/materials/data-structures-notes.pdf',
    },
    {
      courseId: insertedCourses[6].id,
      uploadedById: insertedStaff[7].id,
      title: 'Circuit Theory Video Lecture',
      type: 'video',
      fileUrl: 'https://example.com/materials/circuit-theory-lecture.mp4',
    },
  ];
  const insertedCourseMaterials = await db.insert(courseMaterials).values(courseMaterialData).returning();

  // Seed Assignments
  console.log('Seeding assignments...');
  const assignmentData = [
    {
      courseId: insertedCourses[0].id,
      assignedById: insertedStaff[5].id,
      title: 'Python Programming Assignment 1',
      description: 'Complete the exercises and submit your solutions',
      fileUrl: 'https://example.com/assignments/python-assignment1.pdf',
      dueDate: new Date('2023-10-15T23:59:00Z'),
    },
    {
      courseId: insertedCourses[3].id,
      assignedById: insertedStaff[6].id,
      title: 'Data Structures Assignment 1',
      description: 'Implement the required data structures',
      fileUrl: 'https://example.com/assignments/ds-assignment1.pdf',
      dueDate: new Date('2024-03-01T23:59:00Z'),
    },
    {
      courseId: insertedCourses[6].id,
      assignedById: insertedStaff[7].id,
      title: 'Circuit Analysis Problem Set',
      description: 'Solve the circuit problems and show your work',
      fileUrl: 'https://example.com/assignments/circuit-problems.pdf',
      dueDate: new Date('2023-11-10T23:59:00Z'),
    },
  ];
  const insertedAssignments = await db.insert(assignments).values(assignmentData).returning();

  // Seed Quizzes
  console.log('Seeding quizzes...');
  const quizData = [
    {
      courseId: insertedCourses[0].id,
      createdById: insertedStaff[5].id,
      title: 'Python Basics Quiz',
      instructions: 'Complete the quiz within 30 minutes',
      totalMarks: 20,
      quizDate: new Date('2023-10-30T10:00:00Z'),
      fileUrl: 'https://example.com/quizzes/python-basics-quiz.pdf',
    },
    {
      courseId: insertedCourses[3].id,
      createdById: insertedStaff[6].id,
      title: 'Data Structures Midterm Quiz',
      instructions: 'Answer all questions within 45 minutes',
      totalMarks: 30,
      quizDate: new Date('2024-03-15T11:00:00Z'),
      fileUrl: 'https://example.com/quizzes/data-structures-quiz.pdf',
    },
  ];
  const insertedQuizzes = await db.insert(quizzes).values(quizData).returning();

  // Seed Enrollments
  console.log('Seeding enrollments...');
  const enrollmentData = [];
  
  // Enroll students in their program courses
  for (const student of insertedStudents) {
    const studentProgram = insertedPrograms.find(p => p.id === student.programId);
    if (!studentProgram) continue;
    
    const programCourses = insertedCourses.filter(c => c.programId === studentProgram.id);
    
    for (const course of programCourses) {
      // Only enroll if the course is in the student's current semester or earlier
      if (course.semesterId <= student.currentSemesterId) {
        enrollmentData.push({
          studentId: student.id,
          courseId: course.id,
          semesterId: course.semesterId,
          enrollmentDate: randomDate(
            new Date(course.semesterId === insertedSemesters[0].id ? '2023-09-01' : '2024-01-15'),
            new Date(course.semesterId === insertedSemesters[0].id ? '2023-09-15' : '2024-01-30')
          ),
        });
      }
    }
  }
  
  const insertedEnrollments = await db.insert(enrollments).values(enrollmentData).returning();

  // Seed Assignment Submissions
  console.log('Seeding assignment submissions...');
  const assignmentSubmissionData = [];
  
  for (const enrollment of insertedEnrollments) {
    const courseAssignments = insertedAssignments.filter(a => a.courseId === enrollment.courseId);
    
    for (const assignment of courseAssignments) {
      // Only create submissions for assignments that are due before now
      if (assignment.dueDate < new Date()) {
        assignmentSubmissionData.push({
          assignmentId: assignment.id,
          studentId: enrollment.studentId,
          fileUrl: `https://example.com/submissions/assignment-${assignment.id}-student-${enrollment.studentId}.pdf`,
          remarks: 'Submitted on time',
          grade: (Math.floor(Math.random() * 20) + 60).toString(),
        });
      }
    }
  }
  
  const insertedAssignmentSubmissions = await db.insert(assignmentSubmissions).values(assignmentSubmissionData).returning();

  // Seed Quiz Submissions
  console.log('Seeding quiz submissions...');
  const quizSubmissionData = [];
  
  for (const enrollment of insertedEnrollments) {
    const courseQuizzes = insertedQuizzes.filter(q => q.courseId === enrollment.courseId);
    
    for (const quiz of courseQuizzes) {
      // Only create submissions for quizzes that have passed
      if (quiz.quizDate < new Date()) {
        quizSubmissionData.push({
          quizId: quiz.id,
          studentId: enrollment.studentId,
          fileUrl: `https://example.com/submissions/quiz-${quiz.id}-student-${enrollment.studentId}.pdf`,
          score: (Math.floor(Math.random() * 10) + 10).toString(), // Random score between 10-20
          feedback: 'Good attempt',
        });
      }
    }
  }
  
  const insertedQuizSubmissions = await db.insert(quizSubmissions).values(quizSubmissionData).returning();

  // Seed Material Views
  console.log('Seeding material views...');
  const materialViewData = [];
  
  for (const enrollment of insertedEnrollments) {
    const courseMaterials = insertedCourseMaterials.filter(m => m.courseId === enrollment.courseId);
    
    for (const material of courseMaterials) {
      // Randomly decide if student viewed this material (70% chance)
      if (Math.random() < 0.7) {
        materialViewData.push({
          materialId: material.id,
          studentId: enrollment.studentId,
          interactionType: Math.random() < 0.8 ? 'viewed' : 'downloaded',
        });
      }
    }
  }
  
  const insertedMaterialViews = await db.insert(materialViews).values(materialViewData).returning();

  console.log('Database seeding completed successfully!');
}

seedDatabase().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});