"use server";

import { eq, and, inArray } from "drizzle-orm";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import { 
  db, students, programs, courses, semesters, staff
} from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// Get courses assigned to the logged-in lecturer
export async function getLecturerCourses() {
  try {
    const authUser = await getAuthUser();
    
    // First get the staff ID for the logged-in user
    const lecturerStaff = await db.select({
      id: staff.id
    })
    .from(staff)
    .where(eq(staff.userId, authUser.userId));
    
    if (lecturerStaff.length === 0) {
      return [];
    }
    
    const lecturerId = lecturerStaff[0].id;
    
    // Get courses assigned to this lecturer
    const data = await db.select({
      id: courses.id,
      name: courses.name,
      code: courses.code,
      credits: courses.credits,
      description: courses.description,
      programName: programs.name,
      semesterName: semesters.name
    })
    .from(courses)
    .where(eq(courses.lecturerId, lecturerId))
    .innerJoin(programs, eq(courses.programId, programs.id))
    .innerJoin(semesters, eq(courses.semesterId, semesters.id))
    .orderBy(courses.name);
    
    return data;
  } catch (error) {
    console.error("Error fetching lecturer courses:", error);
    throw new Error("Failed to load courses");
  }
}

// Get programs that the lecturer teaches courses in
export async function getLecturerPrograms() {
  try {
    const authUser = await getAuthUser();
    
    // First get the staff ID for the logged-in user
    const lecturerStaff = await db.select({
      id: staff.id
    })
    .from(staff)
    .where(eq(staff.userId, authUser.userId));
    
    if (lecturerStaff.length === 0) {
      return [];
    }
    
    const lecturerId = lecturerStaff[0].id;
    
    // Get programs that have courses taught by this lecturer
    const data = await db.select({
      id: programs.id,
      name: programs.name,
      code: programs.code
    })
    .from(programs)
    .innerJoin(courses, eq(courses.programId, programs.id))
    .where(eq(courses.lecturerId, lecturerId))
    .groupBy(programs.id, programs.name, programs.code)
    .orderBy(programs.name);
    
    return data;
  } catch (error) {
    console.error("Error fetching lecturer programs:", error);
    throw new Error("Failed to load programs");
  }
}

// Get semesters that the lecturer teaches courses in
export async function getLecturerSemesters() {
  try {
    const authUser = await getAuthUser();
    
    // First get the staff ID for the logged-in user
    const lecturerStaff = await db.select({
      id: staff.id
    })
    .from(staff)
    .where(eq(staff.userId, authUser.userId));
    
    if (lecturerStaff.length === 0) {
      return [];
    }
    
    const lecturerId = lecturerStaff[0].id;
    
    // Get semesters that have courses taught by this lecturer
    const data = await db.select({
      id: semesters.id,
      name: semesters.name,
      startDate: semesters.startDate,
      endDate: semesters.endDate
    })
    .from(semesters)
    .innerJoin(courses, eq(courses.semesterId, semesters.id))
    .where(eq(courses.lecturerId, lecturerId))
    .groupBy(semesters.id, semesters.name, semesters.startDate, semesters.endDate)
    .orderBy(semesters.startDate);
    
    return data;
  } catch (error) {
    console.error("Error fetching lecturer semesters:", error);
    throw new Error("Failed to load semesters");
  }
}

async function getBrowser() {
  if (process.env.NODE_ENV === "production") {
    return await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    return await puppeteer.launch({
      headless: true, 
      executablePath: process.env.CHROME_PATH || undefined,
    });
  }
}

/**
 * Generates a PDF from HTML using Puppeteer
 */
async function generatePdfFromHtml(html: string, landscape: boolean = false): Promise<Buffer> {
  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    
    await page.setContent(html, {
      waitUntil: "networkidle0",
    });
    
    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true,
      landscape,
      margin: {
        top: "15mm",
        right: "10mm",
        bottom: "15mm",
        left: "10mm",
      },
    });

    const pdfBuffer = Buffer.from(pdfUint8Array);
    return pdfBuffer;
  } catch (error) {
    console.error("PDF generation failed:", error);
    throw new Error("Failed to generate PDF");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

interface AttendanceFilterParams {
  programId?: number;
  semesterId?: number;
  courseId?: number;
}

/**
 * Generates an attendance list PDF with filters
 */
export async function generateAttendanceListPdf(
  filters: AttendanceFilterParams,
): Promise<Buffer> {
  try {
    const authUser = await getAuthUser();

    // First get the staff ID for the logged-in user
    const lecturerStaff = await db.select({
      id: staff.id
    })
    .from(staff)
    .where(eq(staff.userId, authUser.userId));
    
    if (lecturerStaff.length === 0) {
      throw new Error("Lecturer not found");
    }
    
    const lecturerId = lecturerStaff[0].id;

    // Build the where clause based on provided filters
    const whereConditions = [];
    
    // Get courses taught by this lecturer
    const lecturerCourses = await db.select({
      id: courses.id,
      programId: courses.programId
    })
    .from(courses)
    .where(eq(courses.lecturerId, lecturerId));
    
    const lecturerCourseIds = lecturerCourses.map(course => course.id);
    const lecturerProgramIds = lecturerCourses.map(course => course.programId);
    
    if (lecturerCourseIds.length === 0) {
      throw new Error("No courses assigned to lecturer");
    }
    
    // Filter students by programs that the lecturer teaches
    whereConditions.push(inArray(students.programId, lecturerProgramIds));
    
    if (filters.programId) {
      whereConditions.push(eq(students.programId, filters.programId));
    }
    
    if (filters.semesterId) {
      whereConditions.push(eq(students.currentSemesterId, filters.semesterId));
    }

    // Get filtered students
    const studentsData = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        studentNumber: students.studentNumber,
        registrationNumber: students.registrationNumber,
        programName: programs.name,
        semesterName: semesters.name
      })
      .from(students)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .innerJoin(programs, eq(students.programId, programs.id))
      .leftJoin(semesters, eq(students.currentSemesterId, semesters.id))
      .orderBy(students.studentNumber);

    // Get additional filter details for the header
    let programName = "All Programs";
    let semesterName = "All Semesters";
    let courseName = "All Courses";

    if (filters.programId) {
      const prog = await db.select().from(programs).where(eq(programs.id, filters.programId));
      programName = prog[0]?.name || programName;
    }

    if (filters.semesterId) {
      const sem = await db.select().from(semesters).where(eq(semesters.id, filters.semesterId));
      semesterName = sem[0]?.name || semesterName;
    }

    if (filters.courseId) {
      const crs = await db.select().from(courses).where(eq(courses.id, filters.courseId));
      courseName = crs[0]?.name || courseName;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Student Attendance List</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    body {
      background-color: #f5f7f9;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }

    .attendance-container {
      background-color: white;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 1200px;
      padding: 20px;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #ec4899; /* Pink-500 */
      padding-bottom: 15px;
    }

    .school-name {
      font-size: 24px;
      font-weight: bold;
      color: #ec4899; /* Pink-500 */
      margin-bottom: 5px;
    }

    .school-address {
      color: #555;
      margin-bottom: 3px;
      line-height: 1.3;
      font-size: 14px;
    }

    .school-contact {
      color: #555;
      font-size: 13px;
    }

    .document-title {
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      color: #22c55e; /* Green */
      margin: 15px 0 10px;
      padding: 8px;
      background-color: #f0fdf4; /* Light green background */
      border-radius: 3px;
    }

    .filter-info {
      margin: 10px 0;
      padding: 10px;
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 3px;
      font-size: 12px;
    }

    .filter-row {
      display: flex;
      margin-bottom: 3px;
    }

    .filter-label {
      width: 120px;
      font-weight: bold;
      color: #495057;
    }

    .filter-value {
      flex: 1;
      color: #6c757d;
    }

    .attendance-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 11px;
      table-layout: fixed;
    }

    .attendance-table th,
    .attendance-table td {
      border: 1px solid #dee2e6;
      padding: 6px 4px;
      text-align: center;
      height: 25px;
      vertical-align: middle;
    }

    .attendance-table th {
      background-color: #ec4899; /* Pink-500 */
      color: white;
      font-weight: bold;
    }

    .attendance-table tr:nth-child(even) {
      background-color: #f8f9fa;
    }

    .student-info {
      text-align: left;
      padding-left: 8px !important;
    }

    .student-number {
      font-weight: bold;
      color: #495057;
    }

    .student-name {
      color: #6c757d;
    }

    .attendance-cell {
      width: 25px;
      min-width: 25px;
      max-width: 25px;
    }

    .week-header {
      background-color: #f472b6 !important; /* Lighter pink */
    }

    .lecturer-section {
      margin-top: 20px;
      padding: 15px;
      border-top: 2px solid #22c55e; /* Green */
    }

    .lecturer-info {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
    }

    .lecturer-field {
      flex: 1;
      margin: 0 10px;
    }

    .lecturer-label {
      font-size: 11px;
      color: #495057;
      margin-bottom: 5px;
      font-weight: bold;
    }

    .lecturer-line {
      border-bottom: 1px solid #6c757d;
      height: 20px;
      margin-bottom: 5px;
    }

    .lecturer-subtext {
      font-size: 10px;
      color: #6c757d;
      text-align: center;
    }

    .footer {
      margin-top: 15px;
      text-align: center;
      font-size: 10px;
      color: #6c757d;
      border-top: 1px solid #dee2e6;
      padding-top: 10px;
    }

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 60px;
      font-weight: bold;
      color: #ec4899; /* Pink-500 */
      opacity: 0.03;
      pointer-events: none;
      white-space: nowrap;
    }

    @media print {
      body {
        background-color: white;
        padding: 0;
      }
      .attendance-container {
        box-shadow: none;
        padding: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="attendance-container">
    <div class="watermark">ALPHIL</div>

    <div class="header">
      <div class="school-name">ALPHIL TRAINING COLLEGE</div>
      <div class="school-address">Kiratina Estate, menengai Ward, Nakuru , Kenya</div>
      <div class="school-contact">Phone: +254 782 179 498 | Email: alphilcollege@gmail.com</div>
    </div>

    <div class="document-title">STUDENT ATTENDANCE LIST</div>

    <div class="filter-info">

      <div class="filter-row">
        <div class="filter-label">Program:</div>
        <div class="filter-value">${programName}</div>
      </div>
      <div class="filter-row">
        <div class="filter-label">Semester:</div>
        <div class="filter-value">${semesterName}</div>
      </div>
      <div class="filter-row">
        <div class="filter-label">Course:</div>
        <div class="filter-value">${courseName}</div>
      </div>
      <div class="filter-row">
        <div class="filter-label">Generated Date:</div>
        <div class="filter-value">${new Date().toLocaleDateString()}</div>
      </div>
    </div>

    <table class="attendance-table">
      <thead>
        <tr>
          <th style="width: 40px">#</th>
          <th style="width: 100px">Student No.</th>
          <th style="width: 200px">Student Name</th>
          <th style="width: 120px">Reg. Number</th>
          <th colspan="6" class="week-header">Week 1</th>
          <th colspan="6" class="week-header">Week 2</th>
          <th colspan="6" class="week-header">Week 3</th>
          <th colspan="6" class="week-header">Week 4</th>
        </tr>
        <tr>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <!-- Week 1 days -->
          <th class="attendance-cell">M</th>
          <th class="attendance-cell">T</th>
          <th class="attendance-cell">W</th>
          <th class="attendance-cell">T</th>
          <th class="attendance-cell">F</th>
          <th class="attendance-cell">S</th>
          <!-- Week 2 days -->
          <th class="attendance-cell">M</th>
          <th class="attendance-cell">T</th>
          <th class="attendance-cell">W</th>
          <th class="attendance-cell">T</th>
          <th class="attendance-cell">F</th>
          <th class="attendance-cell">S</th>
          <!-- Week 3 days -->
          <th class="attendance-cell">M</th>
          <th class="attendance-cell">T</th>
          <th class="attendance-cell">W</th>
          <th class="attendance-cell">T</th>
          <th class="attendance-cell">F</th>
          <th class="attendance-cell">S</th>
          <!-- Week 4 days -->
          <th class="attendance-cell">M</th>
          <th class="attendance-cell">T</th>
          <th class="attendance-cell">W</th>
          <th class="attendance-cell">T</th>
          <th class="attendance-cell">F</th>
          <th class="attendance-cell">S</th>
        </tr>
      </thead>
      <tbody>
        ${studentsData.map((student, index) => `
          <tr>
            <td>${index + 1}</td>
            <td class="student-info student-number">${student.studentNumber}</td>
            <td class="student-info student-name">${student.firstName} ${student.lastName}</td>
            <td class="student-info">${student.registrationNumber}</td>
            <!-- Week 1 -->
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <!-- Week 2 -->
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <!-- Week 3 -->
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <!-- Week 4 -->
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
            <td class="attendance-cell"></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="lecturer-section">
      <div class="lecturer-info">
        <div class="lecturer-field">
          <div class="lecturer-label">Lecturer's Name</div>
          <div class="lecturer-line"></div>
          <div class="lecturer-subtext">(Print Name)</div>
        </div>
        <div class="lecturer-field">
          <div class="lecturer-label">Signature</div>
          <div class="lecturer-line"></div>
          <div class="lecturer-subtext">(Sign here)</div>
        </div>
        <div class="lecturer-field">
          <div class="lecturer-label">Date</div>
          <div class="lecturer-line"></div>
          <div class="lecturer-subtext">(DD/MM/YYYY)</div>
        </div>
      </div>
    </div>

    <div class="footer">
      Official Attendance Record - Alphil Training College | Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
    </div>
  </div>
</body>
</html>
`;

    const pdfBuffer = await generatePdfFromHtml(html, true);
       
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating attendance list PDF:", error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Failed to generate attendance list PDF"
    );
  }
}