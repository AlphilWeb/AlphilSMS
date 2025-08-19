"use server";

import { eq, desc, and, or, like, gte, lte, gt, inArray, sql } from "drizzle-orm";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import { 
  db, documentLogs, payments, students, invoices, programs, departments, 
  enrollments, courses, grades, semesters, staff, feeStructures 
} from "@/lib/db";

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
 * Logs document generation activity to the database
 */
async function logDocumentGeneration(
  userId: number, 
  documentType: string, 
  targetId: number,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await db.insert(documentLogs).values({
      userId,
      documentType,
      targetId,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Failed to log document generation:", error);
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

/**
 * Generates a receipt PDF for a payment
 */
export async function generateReceiptPdf(
  paymentId: number, 
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<Buffer> {
  try {
    const paymentData = await db
      .select({
        payment: payments,
        student: students,
        invoice: invoices,
      })
      .from(payments)
      .where(eq(payments.id, paymentId))
      .innerJoin(students, eq(payments.studentId, students.id))
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .then((rows) => rows[0]);

    if (!paymentData) {
      throw new Error("Payment not found");
    }

    const { payment, student, invoice } = paymentData;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 15px; color: #333; font-size: 12px; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 8px; }
          .school-name { font-size: 18px; font-weight: bold; }
          .receipt-title { font-size: 16px; margin: 10px 0; }
          .details { margin: 15px 0; }
          .detail-row { display: flex; margin-bottom: 6px; }
          .detail-label { width: 120px; font-weight: bold; }
          .detail-value { flex: 1; }
          .amount { font-size: 14px; font-weight: bold; margin: 10px 0; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">SCHOOL NAME</div>
          <div>School Address, City, Country</div>
          <div>Phone: (123) 456-7890 | Email: info@school.edu</div>
        </div>
        
        <div class="receipt-title">PAYMENT RECEIPT</div>
        
        <div class="details">
          <div class="detail-row">
            <div class="detail-label">Receipt Number:</div>
            <div class="detail-value">${payment.id}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Date:</div>
            <div class="detail-value">${new Date(payment.transactionDate).toLocaleDateString()}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Student Name:</div>
            <div class="detail-value">${student.firstName} ${student.lastName}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Student ID:</div>
            <div class="detail-value">${student.studentNumber}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Invoice Reference:</div>
            <div class="detail-value">${invoice.id}</div>
          </div>
        </div>
        
        <div class="amount">
          Amount Paid: $${payment.amount}
        </div>
        
        <div class="details">
          <div class="detail-row">
            <div class="detail-label">Payment Method:</div>
            <div class="detail-value">${payment.paymentMethod}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Reference Number:</div>
            <div class="detail-value">${payment.referenceNumber || 'N/A'}</div>
          </div>
        </div>
        
        <div class="footer">
          This is an official receipt from School Name. Thank you for your payment.
          <br>Generated on: ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await generatePdfFromHtml(html);
    
    await logDocumentGeneration(
      userId, 
      "receipt", 
      paymentId,
      ipAddress,
      userAgent
    );
    
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating receipt PDF:", error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Failed to generate receipt PDF"
    );
  }
}

/**
 * Generates a student list PDF with filtering options
 */
export async function generateStudentListPdf(
  filters: {
    programId?: number;
    courseId?: number;
    semesterId?: number;
    programAndSemester?: { programId: number; semesterId: number };
  },
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<Buffer> {
  try {
    const whereConditions = [];

    if (filters.programId) {
      whereConditions.push(eq(students.programId, filters.programId));
    }

    if (filters.semesterId) {
      whereConditions.push(eq(students.currentSemesterId, filters.semesterId));
    }

    if (filters.programAndSemester) {
      whereConditions.push(
        eq(students.programId, filters.programAndSemester.programId),
        eq(students.currentSemesterId, filters.programAndSemester.semesterId)
      );
    }

    // If filtering by course, we need to join with enrollments
    let studentQuery;
    if (filters.courseId) {
      studentQuery = db
        .select({
          student: students,
          program: programs,
          department: departments,
          semester: semesters,
        })
        .from(students)
        .innerJoin(programs, eq(students.programId, programs.id))
        .innerJoin(departments, eq(students.departmentId, departments.id))
        .innerJoin(semesters, eq(students.currentSemesterId, semesters.id))
        .innerJoin(enrollments, eq(students.id, enrollments.studentId))
        .where(
          and(
            eq(enrollments.courseId, filters.courseId),
            ...whereConditions
          )
        )
        .orderBy(students.lastName, students.firstName);
    } else {
      studentQuery = db
        .select({
          student: students,
          program: programs,
          department: departments,
          semester: semesters,
        })
        .from(students)
        .innerJoin(programs, eq(students.programId, programs.id))
        .innerJoin(departments, eq(students.departmentId, departments.id))
        .innerJoin(semesters, eq(students.currentSemesterId, semesters.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(students.lastName, students.firstName);
    }

    const studentData = await studentQuery;

    // Generate filter description text
    let filterDescription = "All Students";
    if (filters.programId) {
      const program = await db.select().from(programs).where(eq(programs.id, filters.programId)).then(rows => rows[0]);
      filterDescription = `Program: ${program?.name || 'Unknown'}`;
    }
    if (filters.semesterId) {
      const semester = await db.select().from(semesters).where(eq(semesters.id, filters.semesterId)).then(rows => rows[0]);
      filterDescription += filterDescription !== "All Students" ? `, Semester: ${semester?.name || 'Unknown'}` : `Semester: ${semester?.name || 'Unknown'}`;
    }
    if (filters.courseId) {
      const course = await db.select().from(courses).where(eq(courses.id, filters.courseId)).then(rows => rows[0]);
      filterDescription += filterDescription !== "All Students" ? `, Course: ${course?.name || 'Unknown'}` : `Course: ${course?.name || 'Unknown'}`;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Student List</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 15px; color: #333; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .school-name { font-size: 20px; font-weight: bold; }
          .report-title { font-size: 18px; margin: 12px 0; text-align: center; }
          .filter-info { margin: 10px 0; text-align: center; font-style: italic; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 25px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">SCHOOL NAME</div>
          <div>School Address, City, Country</div>
          <div>Phone: (123) 456-7890 | Email: info@school.edu</div>
        </div>
        
        <div class="report-title">STUDENT LIST</div>
        
        <div class="filter-info">${filterDescription}</div>
        
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Program</th>
              <th>Department</th>
              <th>Current Semester</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            ${studentData.map(student => `
              <tr>
                <td>${student.student.studentNumber}</td>
                <td>${student.student.firstName} ${student.student.lastName}</td>
                <td>${student.program.name}</td>
                <td>${student.department.name}</td>
                <td>${student.semester.name}</td>
                <td>${student.student.email}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          Total students: ${studentData.length}
          <br>Generated on: ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await generatePdfFromHtml(html, true);
    
    await logDocumentGeneration(
      userId, 
      "student_list", 
      0,
      ipAddress,
      userAgent
    );
    
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating student list PDF:", error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Failed to generate student list PDF"
    );
  }
}

/**
 * Generates a staff list PDF with filtering options
 */
export async function generateStaffListPdf(
  filters: {
    programId?: number;
    position?: string;
  },
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<Buffer> {
  try {
    const whereConditions = [];

    if (filters.position) {
      whereConditions.push(eq(staff.position, filters.position));
    }

    // If filtering by program, we need to join with departments and programs
    let staffQuery;
    if (filters.programId) {
      staffQuery = db
        .select({
          staff: staff,
          department: departments,
          program: programs,
        })
        .from(staff)
        .innerJoin(departments, eq(staff.departmentId, departments.id))
        .innerJoin(programs, eq(programs.departmentId, departments.id))
        .where(
          and(
            eq(programs.id, filters.programId),
            ...whereConditions
          )
        )
        .orderBy(staff.lastName, staff.firstName);
    } else {
      staffQuery = db
        .select({
          staff: staff,
          department: departments,
        })
        .from(staff)
        .innerJoin(departments, eq(staff.departmentId, departments.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(staff.lastName, staff.firstName);
    }

    const staffData = await staffQuery;

    // Generate filter description text
    let filterDescription = "All Staff";
    if (filters.programId) {
      const program = await db.select().from(programs).where(eq(programs.id, filters.programId)).then(rows => rows[0]);
      filterDescription = `Program: ${program?.name || 'Unknown'}`;
    }
    if (filters.position) {
      filterDescription += filterDescription !== "All Staff" ? `, Position: ${filters.position}` : `Position: ${filters.position}`;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Staff Directory</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 15px; color: #333; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .school-name { font-size: 20px; font-weight: bold; }
          .report-title { font-size: 18px; margin: 12px 0; text-align: center; }
          .filter-info { margin: 10px 0; text-align: center; font-style: italic; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 25px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">SCHOOL NAME</div>
          <div>School Address, City, Country</div>
          <div>Phone: (123) 456-7890 | Email: info@school.edu</div>
        </div>
        
        <div class="report-title">STAFF DIRECTORY</div>
        
        <div class="filter-info">${filterDescription}</div>
        
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Department</th>
              <th>Email</th>
              ${filters.programId ? '<th>Program</th>' : ''}
            </tr>
          </thead>
<tbody>
  ${staffData.map(person => `
    <tr>
      <td>${person.staff.firstName} ${person.staff.lastName}</td>
      <td>${person.staff.position}</td>
      <td>${person.department.name}</td>
      <td>${person.staff.email}</td>
      ${filters.programId ? `<td>${'program' in person ? (person as {program: {name: string}}).program.name : 'N/A'}</td>` : ''}
    </tr>
  `).join('')}
</tbody>
        </table>
        
        <div class="footer">
          Total staff: ${staffData.length}
          <br>Generated on: ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await generatePdfFromHtml(html, true);
    
    await logDocumentGeneration(
      userId, 
      "staff_list", 
      0,
      ipAddress,
      userAgent
    );
    
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating staff list PDF:", error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Failed to generate staff list PDF"
    );
  }
}

/**
 * Generates an invoice list PDF with filtering options
 */
export async function generateInvoiceListPdf(
  filters: {
    studentName?: string;
    balanceGreaterThanZero?: boolean;
    dueDateRange?: { start: Date; end: Date };
    status?: string;
  },
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<Buffer> {
  try {
    const whereConditions = [];

    if (filters.studentName) {
      // Get student IDs that match the name
      const studentIds = await db
        .select({ id: students.id })
        .from(students)
        .where(
          or(
            like(students.firstName, `%${filters.studentName}%`),
            like(students.lastName, `%${filters.studentName}%`),
            like(sql`CONCAT(${students.firstName}, ' ', ${students.lastName})`, `%${filters.studentName}%`)
          )
        )
        .then(rows => rows.map(row => row.id));
      
      if (studentIds.length > 0) {
        whereConditions.push(inArray(invoices.studentId, studentIds));
      } else {
        // If no students match, return empty result
        whereConditions.push(sql`1 = 0`);
      }
    }

    if (filters.balanceGreaterThanZero) {
      whereConditions.push(gt(invoices.balance, "0"));
    }

    if (filters.dueDateRange) {
      whereConditions.push(
        and(
          gte(invoices.dueDate, filters.dueDateRange.start.toISOString().split('T')[0]),
          lte(invoices.dueDate, filters.dueDateRange.end.toISOString().split('T')[0])
        )
      );
    }

    if (filters.status) {
      whereConditions.push(eq(invoices.status, filters.status));
    }

    const invoiceData = await db
      .select({
        invoice: invoices,
        student: students,
        semester: semesters,
        feeStructure: feeStructures,
      })
      .from(invoices)
      .innerJoin(students, eq(invoices.studentId, students.id))
      .innerJoin(semesters, eq(invoices.semesterId, semesters.id))
      .leftJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(invoices.issuedDate);

    // Generate filter description text
    let filterDescription = "All Invoices";
    if (filters.studentName) {
      filterDescription = `Student: ${filters.studentName}`;
    }
    if (filters.balanceGreaterThanZero) {
      filterDescription += filterDescription !== "All Invoices" ? ", With Balance" : "With Balance";
    }
    if (filters.dueDateRange) {
      filterDescription += filterDescription !== "All Invoices" ? 
        `, Due: ${filters.dueDateRange.start.toLocaleDateString()} - ${filters.dueDateRange.end.toLocaleDateString()}` : 
        `Due: ${filters.dueDateRange.start.toLocaleDateString()} - ${filters.dueDateRange.end.toLocaleDateString()}`;
    }
    if (filters.status) {
      filterDescription += filterDescription !== "All Invoices" ? 
        `, Status: ${filters.status}` : 
        `Status: ${filters.status}`;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice List</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 15px; color: #333; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .school-name { font-size: 20px; font-weight: bold; }
          .report-title { font-size: 18px; margin: 12px 0; text-align: center; }
          .filter-info { margin: 10px 0; text-align: center; font-style: italic; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 25px; text-align: center; font-size: 12px; color: #666; }
          .negative { color: red; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">SCHOOL NAME</div>
          <div>School Address, City, Country</div>
          <div>Phone: (123) 456-7890 | Email: info@school.edu</div>
        </div>
        
        <div class="report-title">INVOICE LIST</div>
        
        <div class="filter-info">${filterDescription}</div>
        
        <table>
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Student</th>
              <th>Semester</th>
              <th>Amount Due</th>
              <th>Amount Paid</th>
              <th>Balance</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.map(inv => `
              <tr>
                <td>${inv.invoice.id}</td>
                <td>${inv.student.firstName} ${inv.student.lastName}</td>
                <td>${inv.semester.name}</td>
                <td>$${inv.invoice.amountDue}</td>
                <td>$${inv.invoice.amountPaid}</td>
                <td class="${Number(inv.invoice.balance) > 0 ? 'negative' : ''}">$${inv.invoice.balance}</td>
                <td>${new Date(inv.invoice.dueDate).toLocaleDateString()}</td>
                <td>${inv.invoice.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          Total invoices: ${invoiceData.length}
          <br>Generated on: ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await generatePdfFromHtml(html, true);
    
    await logDocumentGeneration(
      userId, 
      "invoice_list", 
      0,
      ipAddress,
      userAgent
    );
    
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating invoice list PDF:", error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Failed to generate invoice list PDF"
    );
  }
}

/**
 * Generates a payment list PDF with filtering options
 */
export async function generatePaymentListPdf(
  filters: {
    paymentMethod?: string;
    studentName?: string;
    dateRange?: { start: Date; end: Date };
  },
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<Buffer> {
  try {
    const whereConditions = [];

    if (filters.paymentMethod) {
      whereConditions.push(eq(payments.paymentMethod, filters.paymentMethod));
    }

    if (filters.studentName) {
      // Get student IDs that match the name
      const studentIds = await db
        .select({ id: students.id })
        .from(students)
        .where(
          or(
            like(students.firstName, `%${filters.studentName}%`),
            like(students.lastName, `%${filters.studentName}%`),
            like(sql`CONCAT(${students.firstName}, ' ', ${students.lastName})`, `%${filters.studentName}%`)
          )
        )
        .then(rows => rows.map(row => row.id));
      
      if (studentIds.length > 0) {
        whereConditions.push(inArray(payments.studentId, studentIds));
      } else {
        // If no students match, return empty result
        whereConditions.push(sql`1 = 0`);
      }
    }

    if (filters.dateRange) {
      whereConditions.push(
        and(
          gte(payments.transactionDate, filters.dateRange.start),
          lte(payments.transactionDate, filters.dateRange.end)
        )
      );
    }

    const paymentData = await db
      .select({
        payment: payments,
        student: students,
        invoice: invoices,
      })
      .from(payments)
      .innerJoin(students, eq(payments.studentId, students.id))
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(payments.transactionDate);

    // Generate filter description text
    let filterDescription = "All Payments";
    if (filters.paymentMethod) {
      filterDescription = `Method: ${filters.paymentMethod}`;
    }
    if (filters.studentName) {
      filterDescription += filterDescription !== "All Payments" ? 
        `, Student: ${filters.studentName}` : 
        `Student: ${filters.studentName}`;
    }
    if (filters.dateRange) {
      filterDescription += filterDescription !== "All Payments" ? 
        `, Date: ${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}` : 
        `Date: ${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment List</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 15px; color: #333; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .school-name { font-size: 20px; font-weight: bold; }
          .report-title { font-size: 18px; margin: 12px 0; text-align: center; }
          .filter-info { margin: 10px 0; text-align: center; font-style: italic; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 25px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">SCHOOL NAME</div>
          <div>School Address, City, Country</div>
          <div>Phone: (123) 456-7890 | Email: info@school.edu</div>
        </div>
        
        <div class="report-title">PAYMENT LIST</div>
        
        <div class="filter-info">${filterDescription}</div>
        
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Student</th>
              <th>Invoice ID</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${paymentData.map(pay => `
              <tr>
                <td>${pay.payment.id}</td>
                <td>${pay.student.firstName} ${pay.student.lastName}</td>
                <td>${pay.invoice.id}</td>
                <td>$${pay.payment.amount}</td>
                <td>${pay.payment.paymentMethod}</td>
                <td>${pay.payment.referenceNumber || 'N/A'}</td>
                <td>${new Date(pay.payment.transactionDate).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          Total payments: ${paymentData.length}
          <br>Total amount: $${paymentData.reduce((sum, pay) => sum + Number(pay.payment.amount), 0).toFixed(2)}
          <br>Generated on: ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await generatePdfFromHtml(html, true);
    
    await logDocumentGeneration(
      userId, 
      "payment_list", 
      0,
      ipAddress,
      userAgent
    );
    
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating payment list PDF:", error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Failed to generate payment list PDF"
    );
  }
}

/**
 * Generates a transcript PDF with filtering options
 */
export async function generateTranscriptPdf(
  filters: {
    programId?: number;
    courseId?: number;
    studentName?: string;
  },
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<Buffer> {
  try {
    let studentIds: number[] = [];
    
    // If filtering by student name, get matching student IDs
    if (filters.studentName) {
      studentIds = await db
        .select({ id: students.id })
        .from(students)
        .where(
          or(
            like(students.firstName, `%${filters.studentName}%`),
            like(students.lastName, `%${filters.studentName}%`),
            like(sql`CONCAT(${students.firstName}, ' ', ${students.lastName})`, `%${filters.studentName}%`)
          )
        )
        .then(rows => rows.map(row => row.id));
      
      if (studentIds.length === 0) {
        throw new Error("No students found matching the search criteria");
      }
    }

    // If filtering by program, get students in that program
    if (filters.programId && !filters.studentName) {
      studentIds = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.programId, filters.programId))
        .then(rows => rows.map(row => row.id));
    }

    // If filtering by course, get students enrolled in that course
    if (filters.courseId && !filters.studentName && !filters.programId) {
      studentIds = await db
        .select({ id: enrollments.studentId })
        .from(enrollments)
        .where(eq(enrollments.courseId, filters.courseId))
        .then(rows => rows.map(row => row.id));
    }

    // Build where condition for student query
    let studentWhereCondition = undefined;
    if (studentIds.length > 0) {
      studentWhereCondition = inArray(students.id, studentIds);
    } else if (filters.studentName) {
      // If we had a student name filter but found no matches, return empty
      studentWhereCondition = sql`1 = 0`;
    }

    // Fetch student data with academic records
    const studentData = await db
      .select({
        student: students,
        program: programs,
        department: departments,
      })
      .from(students)
      .innerJoin(programs, eq(students.programId, programs.id))
      .innerJoin(departments, eq(students.departmentId, departments.id))
      .where(studentWhereCondition)
      .orderBy(students.lastName, students.firstName);

    if (studentData.length === 0) {
      throw new Error("No students found matching the criteria");
    }

    // For each student, fetch their academic records
    const transcripts = [];
    for (const data of studentData) {
      const academicRecords = await db
        .select({
          enrollment: enrollments,
          course: courses,
          grade: grades,
          semester: semesters,
        })
        .from(enrollments)
        .where(eq(enrollments.studentId, data.student.id))
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .innerJoin(semesters, eq(enrollments.semesterId, semesters.id))
        .leftJoin(grades, eq(enrollments.id, grades.enrollmentId))
        .orderBy(desc(semesters.startDate), courses.name);

      // Calculate GPA if grades exist
      let cumulativeGPA = 0;
      if (academicRecords.length > 0 && academicRecords[0].grade) {
        const totalGPA = academicRecords.reduce((sum, record) => {
          return sum + Number(record.grade?.gpa || 0);
        }, 0);
        cumulativeGPA = totalGPA / academicRecords.length;
      }

      // Group records by semester
      const recordsBySemester: Record<number, typeof academicRecords> = {};
      academicRecords.forEach(record => {
        const semesterId = record.semester.id;
        if (!recordsBySemester[semesterId]) {
          recordsBySemester[semesterId] = [];
        }
        recordsBySemester[semesterId].push(record);
      });

      transcripts.push({
        student: data.student,
        program: data.program,
        department: data.department,
        recordsBySemester,
        cumulativeGPA
      });
    }

    // Generate filter description text
    let filterDescription = "All Students";
    if (filters.programId) {
      const program = await db.select().from(programs).where(eq(programs.id, filters.programId)).then(rows => rows[0]);
      filterDescription = `Program: ${program?.name || 'Unknown'}`;
    }
    if (filters.courseId) {
      const course = await db.select().from(courses).where(eq(courses.id, filters.courseId)).then(rows => rows[0]);
      filterDescription += filterDescription !== "All Students" ? `, Course: ${course?.name || 'Unknown'}` : `Course: ${course?.name || 'Unknown'}`;
    }
    if (filters.studentName) {
      filterDescription += filterDescription !== "All Students" ? 
        `, Student: ${filters.studentName}` : 
        `Student: ${filters.studentName}`;
    }

    // Generate HTML for the transcripts
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Academic Transcripts</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 15px; color: #333; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .school-name { font-size: 20px; font-weight: bold; }
          .report-title { font-size: 18px; margin: 12px 0; text-align: center; }
          .filter-info { margin: 10px 0; text-align: center; font-style: italic; }
          .student-info { margin: 20px 0; }
          .info-row { display: flex; margin-bottom: 8px; }
          .info-label { width: 150px; font-weight: bold; }
          .info-value { flex: 1; }
          .semester-section { margin: 25px 0; }
          .semester-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .summary { margin-top: 30px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          .page-break { page-break-after: always; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">SCHOOL NAME</div>
          <div>School Address, City, Country</div>
          <div>Phone: (123) 456-7890 | Email: info@school.edu</div>
        </div>
        
        <div class="report-title">ACADEMIC TRANSCRIPTS</div>
        
        <div class="filter-info">${filterDescription}</div>
    `;

    // Add each student's transcript
    transcripts.forEach((transcript, index) => {
      html += `
        <div class="student-section ${index > 0 ? 'page-break' : ''}">
          <div class="student-info">
            <div class="info-row">
              <div class="info-label">Student Name:</div>
              <div class="info-value">${transcript.student.firstName} ${transcript.student.lastName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Student ID:</div>
              <div class="info-value">${transcript.student.studentNumber}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Program:</div>
              <div class="info-value">${transcript.program.name}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Department:</div>
              <div class="info-value">${transcript.department.name}</div>
            </div>
          </div>
      `;

      // Add semester sections
      Object.entries(transcript.recordsBySemester).forEach(([semesterId, records]) => {
        console.log(semesterId)
        const semester = records[0].semester;
        html += `
          <div class="semester-section">
            <div class="semester-title">${semester.name} (${new Date(semester.startDate).getFullYear()})</div>
            <table>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Credits</th>
                  <th>Grade</th>
                  <th>GPA</th>
                </tr>
              </thead>
              <tbody>
                ${records.map(record => `
                  <tr>
                    <td>${record.course.code}</td>
                    <td>${record.course.name}</td>
                    <td>${record.course.credits}</td>
                    <td>${record.grade?.letterGrade || 'Incomplete'}</td>
                    <td>${record.grade?.gpa || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      });

      // Add summary
      html += `
          <div class="summary">
            <div class="info-row">
              <div class="info-label">Cumulative GPA:</div>
              <div class="info-value">${transcript.cumulativeGPA.toFixed(2)}</div>
            </div>
          </div>
        </div>
      `;
    });

    // Add footer
    html += `
        <div class="footer">
          This is an official transcript from School Name.
          <br>Generated on: ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await generatePdfFromHtml(html);
    
    await logDocumentGeneration(
      userId, 
      "transcript", 
      0,
      ipAddress,
      userAgent
    );
    
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating transcript PDF:", error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Failed to generate transcript PDF"
    );
  }
}