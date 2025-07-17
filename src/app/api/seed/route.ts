import { NextResponse } from 'next/server';
import { faker } from '@faker-js/faker';
import { db } from '@/lib/db/config';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';

export async function GET() {
  try {
    const password = await hash('password123', 10);

    console.log('Clearing existing data...');
    // Clear tables in reverse dependency order to avoid foreign key constraints issues
    await db.delete(schema.payments);
    await db.delete(schema.invoices);
    await db.delete(schema.feeStructures);
    await db.delete(schema.grades);
    await db.delete(schema.timetables); // Timetables depend on courses and staff
    await db.delete(schema.enrollments);
    await db.delete(schema.transcripts);
    await db.delete(schema.courses); // Courses depend on programs and semesters
    await db.delete(schema.students);
    await db.delete(schema.staffSalaries);
    await db.delete(schema.staff);
    await db.delete(schema.programs);
    await db.delete(schema.departments);
    await db.delete(schema.userLogs); // Clear user logs before users
    await db.delete(schema.users);
    await db.delete(schema.roles);
    await db.delete(schema.semesters);
    console.log('Existing data cleared.');

    console.log('Seeding roles...');
    // Roles
    const [adminRole, staffRole, studentRole] = await db
      .insert(schema.roles)
      .values([
        { name: 'Admin' },
        { name: 'Staff' },
        { name: 'Student' }
      ])
      .returning();
    console.log('Roles seeded.');

    console.log('Seeding semesters...');
    // Semesters
    const semesters = await db
      .insert(schema.semesters)
      .values([
        { name: 'Fall 2024', startDate: '2024-09-01', endDate: '2024-12-15' },
        { name: 'Spring 2025', startDate: '2025-01-15', endDate: '2025-05-15' },
        { name: 'Summer 2025', startDate: '2025-06-01', endDate: '2025-08-15' },
        { name: 'Fall 2025', startDate: '2025-09-01', endDate: '2025-12-15' },
      ])
      .returning();
    console.log('Semesters seeded.');

    console.log('Seeding admin user...');
    // Admin User
    const [adminUser] = await db
      .insert(schema.users)
      .values({
        email: 'admin@example.com',
        passwordHash: password,
        roleId: adminRole.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    console.log('Admin user seeded.');

    console.log('Seeding departments...');
    // Departments
    const departments = await db
      .insert(schema.departments)
      .values([
        { name: 'Computer Science' },
        { name: 'Business Administration' },
        { name: 'Electrical Engineering' },
        { name: 'Health Sciences' },
        { name: 'Arts & Humanities' }
      ])
      .returning();
    console.log('Departments seeded.');

    console.log('Seeding programs...');
    // Programs
    const programs = await db
      .insert(schema.programs)
      .values([
        { departmentId: departments[0].id, name: 'Bachelor of Software Engineering', code: 'BSE', durationSemesters: 8 },
        { departmentId: departments[0].id, name: 'Diploma in Web Development', code: 'DWD', durationSemesters: 4 },
        { departmentId: departments[1].id, name: 'Bachelor of Business Management', code: 'BBM', durationSemesters: 8 },
        { departmentId: departments[1].id, name: 'Diploma in Marketing', code: 'DMT', durationSemesters: 4 },
        { departmentId: departments[2].id, name: 'Bachelor of Electrical Engineering', code: 'BEE', durationSemesters: 8 },
        { departmentId: departments[3].id, name: 'Diploma in Nursing', code: 'DNU', durationSemesters: 6 },
        { departmentId: departments[4].id, name: 'Bachelor of English Literature', code: 'BEL', durationSemesters: 8 },
      ])
      .returning();
    console.log('Programs seeded.');

    console.log('Seeding staff users and records...');
    // Staff Users and Records (Increase staff count for lecturers)
    const numStaff = 35; // Increased staff count
    const staffUsersData = Array.from({ length: numStaff }).map((_, i) => ({
      email: `staff${i + 1}@example.com`,
      passwordHash: password,
      roleId: staffRole.id,
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent({ days: 30 }),
    }));
    const staffUsers = await db.insert(schema.users).values(staffUsersData).returning();

    const staffData = staffUsers.map((u, i) => {
      const department = departments[i % departments.length];
      const positions = ['Lecturer', 'Assistant Lecturer', 'Administrator', 'Head of Department'];
      return {
        userId: u.id,
        departmentId: department.id,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: u.email,
        position: faker.helpers.arrayElement(positions),
        employmentDocumentsUrl: faker.internet.url(),
        nationalIdPhotoUrl: faker.image.urlLoremFlickr({ category: 'id' }),
        academicCertificatesUrl: faker.internet.url(),
        passportPhotoUrl: faker.image.avatar(),
      };
    });
    const staff = await db.insert(schema.staff).values(staffData).returning();
    console.log('Staff users and records seeded.');

    console.log('Updating departments with head of department...');
    // Update departments with headOfDepartmentId
    for (const dept of departments) {
      const potentialHeads = staff.filter(s => s.departmentId === dept.id && s.position.includes('Head'));
      if (potentialHeads.length > 0) {
        await db.update(schema.departments)
          .set({ headOfDepartmentId: faker.helpers.arrayElement(potentialHeads).id })
          .where(eq(schema.departments.id, dept.id));
      } else {
        // If no "Head of Department" exists, assign a random lecturer from that department
        const randomLecturer = staff.find(s => s.departmentId === dept.id && s.position.includes('Lecturer'));
        if (randomLecturer) {
          await db.update(schema.departments)
            .set({ headOfDepartmentId: randomLecturer.id })
            .where(eq(schema.departments.id, dept.id));
        }
      }
    }
    console.log('Departments updated with head of department.');

    console.log('Seeding student users and records (150 students)...');
    // Students (150 more users)
    const numStudents = 150; // Increased student count
    const studentUsersData = Array.from({ length: numStudents }).map((_, i) => ({
      email: `student${i + 1}@example.com`,
      passwordHash: password,
      roleId: studentRole.id,
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 15 }),
    }));
    const studentUsers = await db.insert(schema.users).values(studentUsersData).returning();

    const studentsData = studentUsers.map((u, i) => {
      const program = programs[i % programs.length];
      const semester = semesters[i % semesters.length]; // Start students in different semesters
      return {
        userId: u.id,
        programId: program.id,
        departmentId: program.departmentId,
        currentSemesterId: semester.id,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: u.email,
        registrationNumber: faker.string.alphanumeric(10).toUpperCase(),
        studentNumber: faker.string.alphanumeric(8).toUpperCase(),
        passportPhotoUrl: faker.image.avatar(),
        idPhotoUrl: faker.image.urlLoremFlickr({ width: 640, height: 480, category: 'id card' }),
        certificateUrl: faker.internet.url()
      };
    });
    const students = await db.insert(schema.students).values(studentsData).returning();
    console.log('Student users and records seeded.');

    console.log('Seeding courses...');
    // Courses (More comprehensive course generation)
    const coursesData: schema.NewCourse[] = [];
    programs.forEach(p => {
      semesters.forEach(s => {
        const numCoursesPerSemester = faker.number.int({ min: 5, max: 8 });
        for (let i = 0; i < numCoursesPerSemester; i++) {
          coursesData.push({
            programId: p.id,
            semesterId: s.id,
            name: `${p.name} - ${faker.commerce.productAdjective()} ${faker.word.noun()} ${i + 1}`,
            code: `${p.code}${s.name.substring(0,1).toUpperCase()}${i + 1}${faker.string.numeric(2)}`,
            // Fix: Use fractionDigits instead of precision for float generation
            credits: faker.number.float({ min: 2.0, max: 4.0, fractionDigits: 1 }).toFixed(2), // Changed precision to fractionDigits and toFixed(2) for consistency
            description: faker.lorem.paragraph(1),
          });
        }
      });
    });
    const courses = await db.insert(schema.courses).values(coursesData).returning();
    console.log('Courses seeded.');

    console.log('Seeding timetables...');
    // Timetables (Fill every table)
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00'];
    const roomNumbers = ['LH1', 'LH2', 'LH3', 'LAB1', 'LAB2', 'LIB1'];
    const timetablesData: schema.NewTimetable[] = [];

    // Ensure staff has lecturers
    const lecturers = staff.filter(s => s.position.includes('Lecturer'));
    if (lecturers.length === 0) {
      console.warn('No lecturers found. Timetables will not be generated for lecturers.');
    }

    courses.forEach(course => {
      const numSlotsPerCourse = faker.number.int({ min: 1, max: 3 });
      const usedSlotsForCourse = new Set<string>(); // To track unique day-time combinations for this course

      for (let i = 0; i < numSlotsPerCourse; i++) {
        let day: string;
        let startTime: string;
        let combination: string;
        let attempts = 0;
        const maxAttempts = daysOfWeek.length * timeSlots.length; // Max possible unique combinations

        // Try to find a unique day/time combination
        do {
          day = faker.helpers.arrayElement(daysOfWeek);
          startTime = faker.helpers.arrayElement(timeSlots);
          combination = `${day}-${startTime}`;
          attempts++;
          if (attempts > maxAttempts * 2) { // Add a safety break to prevent infinite loops
            console.warn(`Could not find unique timetable slot for course ${course.code} after many attempts.`);
            break;
          }
        } while (usedSlotsForCourse.has(combination));

        // If a unique combination was found (or loop broke due to maxAttempts)
        if (!usedSlotsForCourse.has(combination)) {
          usedSlotsForCourse.add(combination);

          const endTimeHour = parseInt(startTime.split(':')[0]) + faker.number.int({ min: 1, max: 2 });
          const endTime = `${endTimeHour.toString().padStart(2, '0')}:00`;
          const room = faker.helpers.arrayElement(roomNumbers);
          const lecturer = faker.helpers.arrayElement(lecturers);

          if (lecturer) {
            timetablesData.push({
              semesterId: course.semesterId,
              courseId: course.id,
              lecturerId: lecturer.id,
              dayOfWeek: day,
              startTime: startTime,
              endTime: endTime,
              room: room,
            });
          }
        }
      }
    });
    await db.insert(schema.timetables).values(timetablesData);
    console.log('Timetables seeded.');

    console.log('Seeding enrollments and grades...');
    // Enrollments & Grades (Enroll students in more courses, across semesters)
    const enrollmentsData: schema.NewEnrollment[] = [];
    for (const student of students) {
      const studentProgramsCourses = courses.filter(c => c.programId === student.programId);

      // Enroll student in courses from their current semester
      const currentSemesterCourses = studentProgramsCourses.filter(c => c.semesterId === student.currentSemesterId);
      const coursesToEnrollInCurrent = faker.helpers.arrayElements(currentSemesterCourses, { min: 3, max: 5 });

      for (const course of coursesToEnrollInCurrent) {
        enrollmentsData.push({
          studentId: student.id,
          courseId: course.id,
          semesterId: student.currentSemesterId,
          enrollmentDate: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
        });
      }

      // Optionally, enroll student in courses from past semesters (for transcript history)
      const pastSemesters = semesters.filter(s => s.id !== student.currentSemesterId && new Date(s.endDate) < new Date());
      for (const pastSemester of pastSemesters.slice(0, faker.number.int({ min: 0, max: 2 }))) { // Enroll in 0-2 past semesters
        const pastSemesterCourses = studentProgramsCourses.filter(c => c.semesterId === pastSemester.id);
        const coursesToEnrollInPast = faker.helpers.arrayElements(pastSemesterCourses, { min: 2, max: 4 });
        for (const course of coursesToEnrollInPast) {
          enrollmentsData.push({
            studentId: student.id,
            courseId: course.id,
            semesterId: pastSemester.id,
            enrollmentDate: faker.date.past({ years: 1 }).toISOString().split('T')[0],
          });
        }
      }
    }
    const enrollments = await db.insert(schema.enrollments).values(enrollmentsData).returning();

    const gradesData = enrollments.map((e) => {
      // Fix: Use fractionDigits instead of precision for float generation
      const cat = faker.number.float({ min: 40, max: 100, fractionDigits: 2 });
      const exam = faker.number.float({ min: 40, max: 100, fractionDigits: 2 });
      const total = (cat * 0.3 + exam * 0.7).toFixed(2);
      const gpa = (parseFloat(total) / 25).toFixed(2); // Simplified GPA calculation
      const letter =
        parseFloat(total) >= 90 ? 'A' :
          parseFloat(total) >= 80 ? 'B' :
            parseFloat(total) >= 70 ? 'C' :
              parseFloat(total) >= 60 ? 'D' : 'F';
      return {
        enrollmentId: e.id,
        catScore: cat.toFixed(2),
        examScore: exam.toFixed(2),
        totalScore: total,
        gpa: gpa,
        letterGrade: letter,
      };
    });
    await db.insert(schema.grades).values(gradesData);
    console.log('Enrollments and grades seeded.');

    console.log('Seeding transcripts...');
    // Transcripts (Generate for all semesters where a student has grades)
    const studentSemesterGrades = await db.select()
      .from(schema.grades)
      .innerJoin(schema.enrollments, eq(schema.grades.enrollmentId, schema.enrollments.id));

    const transcriptEntries: Record<string, { studentId: number, semesterId: number, totalGpa: number, courseCount: number }> = {};

    for (const sg of studentSemesterGrades) {
      const key = `${sg.enrollments.studentId}-${sg.enrollments.semesterId}`;
      if (!transcriptEntries[key]) {
        transcriptEntries[key] = {
          studentId: sg.enrollments.studentId,
          semesterId: sg.enrollments.semesterId,
          totalGpa: 0,
          courseCount: 0
        };
      }
      transcriptEntries[key].totalGpa += parseFloat(sg.grades.gpa || '0');
      transcriptEntries[key].courseCount++;
    }

    const transcriptsData = Object.values(transcriptEntries).map(entry => ({
      studentId: entry.studentId,
      semesterId: entry.semesterId,
      gpa: (entry.totalGpa / entry.courseCount).toFixed(2),
      // Fix: Use fractionDigits instead of precision for float generation
      cgpa: faker.number.float({ min: 2.5, max: 4.0, fractionDigits: 2 }).toFixed(2), // Changed precision to fractionDigits
      generatedDate: faker.date.recent({ days: 60 }),
      fileUrl: faker.internet.url(),
    }));
    await db.insert(schema.transcripts).values(transcriptsData);
    console.log('Transcripts seeded.');

    console.log('Seeding fee structures...');
    // Fee Structures
    const feeStructures = await db.insert(schema.feeStructures).values(
      programs.flatMap((p) =>
        semesters.map((s) => ({
          programId: p.id,
          semesterId: s.id,
          totalAmount: faker.finance.amount({ min: 10000, max: 50000, dec: 2 }),
          description: `Fee structure for ${p.name} - ${s.name}`
        }))
      )
    ).returning();
    console.log('Fee structures seeded.');

    console.log('Seeding invoices and payments...');
    // Invoices & Payments (Ensure all students have invoices for their current/past semesters)
    const invoicesData: schema.NewInvoice[] = [];
    for (const student of students) {
      const studentUser = studentUsers.find(u => u.id === student.userId);
      if (!studentUser) continue;

      const studentRelevantSemesters = semesters.filter(s =>
        s.id === student.currentSemesterId ||
        (new Date(s.endDate) < new Date() && new Date(s.startDate) >= new Date(studentUser.createdAt))
      );

      for (const sem of studentRelevantSemesters) {
        const fs = feeStructures.find(f => f.programId === student.programId && f.semesterId === sem.id);
        if (fs) {
          const amountDue = parseFloat(fs.totalAmount);
          const amountPaid = faker.number.float({ min: amountDue * 0.5, max: amountDue, fractionDigits: 2 });
          const balance = (amountDue - amountPaid).toFixed(2);
          const status = parseFloat(balance) === 0 ? 'Paid' : (parseFloat(balance) > 0 && faker.datatype.boolean() ? 'Pending' : 'Overdue');

          invoicesData.push({
            studentId: student.id,
            semesterId: sem.id,
            feeStructureId: fs.id,
            amountDue: amountDue.toFixed(2),
            amountPaid: amountPaid.toFixed(2),
            balance: balance,
            issuedDate: faker.date.between({
              from: new Date('2023-01-01'),
              to: new Date(),
            }),

            dueDate: faker.date.future({ years: 0.5, refDate: sem.endDate }).toISOString().split('T')[0],
            status: status,
          });
        }
      }
    }
    const invoices = await db.insert(schema.invoices).values(invoicesData).returning();

    const paymentsData = invoices.flatMap((inv) => {
      const numPayments = faker.number.int({ min: 1, max: 3 });
      const paymentsForInvoice: schema.NewPayment[] = [];
      let remainingAmount = parseFloat(inv.amountPaid || '0');

      for (let i = 0; i < numPayments; i++) {
        if (remainingAmount <= 0) break;

        const paymentAmount = i === numPayments - 1
          ? remainingAmount
          : faker.number.float({ min: 1000, max: remainingAmount / numPayments * 2, fractionDigits: 2 });

        remainingAmount -= paymentAmount;

        let fromDate = new Date(inv.issuedDate);
        const toDate = new Date();
        if (fromDate > toDate) {
          fromDate = faker.date.past({ years: 0.1 });
        }

        paymentsForInvoice.push({
          invoiceId: inv.id,
          studentId: inv.studentId,
          amount: paymentAmount.toFixed(2),
          paymentMethod: faker.helpers.arrayElement(['M-Pesa', 'Bank Transfer', 'Credit Card']),
          referenceNumber: faker.string.alphanumeric(15).toUpperCase(),
          transactionDate: faker.date.between({ from: fromDate, to: toDate }),
        });
      }

      return paymentsForInvoice;
    });
    await db.insert(schema.payments).values(paymentsData);
    console.log('Invoices and payments seeded.');

    console.log('Seeding staff salaries...');
    // Staff Salaries
    await db.insert(schema.staffSalaries).values(
      staff.map((s) => ({
        staffId: s.id,
        amount: faker.finance.amount({ min: 80000, max: 250000, dec: 2 }),
        paymentDate: faker.date.past({ years: 0.5 }).toISOString().split('T')[0],
        description: 'Monthly Salary',
        status: faker.helpers.arrayElement(['Paid', 'Pending']),
      }))
    );
    console.log('Staff salaries seeded.');

    console.log('Seeding user logs...');
    // User Logs
    const allUsers = [...staffUsers, ...studentUsers, adminUser];
    const userLogsData = allUsers.flatMap(user => {
      const logs: schema.NewUserLog[] = [];
      const numLogs = faker.number.int({ min: 1, max: 5 }); // 1-5 logs per user

      for (let i = 0; i < numLogs; i++) {
        const actions = ['Login', 'Update Profile', 'View Grades', 'Submit Assignment', 'Logout'];
        if (user.roleId === adminRole.id) actions.push('Create User', 'Delete User', 'Generate Report');
        if (user.roleId === staffRole.id) actions.push('Add Grade', 'Update Timetable');

        const action = faker.helpers.arrayElement(actions);
        logs.push({
          userId: user.id,
          action: action,
          targetTable: faker.helpers.arrayElement(['users', 'students', 'courses', 'grades', null]),
          targetId: faker.number.int({ min: 1, max: 100 }), // Placeholder ID
          timestamp: faker.date.recent({ days: 90 }),
          description: `User ${user.email} performed: ${action}`,
        });
      }
      return logs;
    });
    await db.insert(schema.userLogs).values(userLogsData);
    console.log('User logs seeded.');

    return NextResponse.json({ message: '🌱 Full seed successful' });
  } catch (error) {
    console.error('Seeding failed:', error);
    return NextResponse.json({ error: 'Seeding failed', details: (error as Error).message }, { status: 500 });
  }
}
