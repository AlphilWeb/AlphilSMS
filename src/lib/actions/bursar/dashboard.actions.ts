// src/actions/bursar/dashboard.actions.ts
'use server';

import { db, testConnection } from '@/lib/db';
import { 
  staff,
  students,
  invoices, 
  payments, 
  programs,
  semesters,
  staffSalaries,
  userLogs
} from '@/lib/db/schema';
import { and, eq, sql, desc, gte, lte, sum, count, gt } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export type FinancialSummary = {
  paymentCount: number;
  totalRevenue: number;
  totalOutstanding: number;
  totalSalaries: number;
  netRevenue: number;
  salaryPaymentCount: number;
};

export type RecentPayment = {
  id: number;
  studentName: string;
  amount: number;
  date: Date;
  method: string;
};

export type OutstandingInvoice = {
  id: number;
  studentName: string;
  programName: string;
  semesterName: string;
  amountDue: number;
  dueDate: Date;
  status: 'overdue' | 'pending';
};

export type SalaryPayment = {
  id: number;
  staffName: string;
  amount: number;
  status: string;
  paymentDate: Date;
};

export type DashboardStatistics = {
  totalStudents: number;
  totalStaff: number;
  totalActiveInvoices: number;
  revenueChange: number;
  netRevenueChange: number;
};

export type FinancialTrend = {
  months: string[];
  revenue: number[];
};

export type BursarData = {
  id: number;
  name: string;
  email: string | null;
  department: string;
  position: string | null;
};

export type Notification = {
  id: number;
  action: string;
  description: string | null;
  timestamp: Date | null;
};

export type BursarDashboardData = {
  bursar: BursarData;
  financialSummary: FinancialSummary;
  financialTrend: FinancialTrend;
  recentPayments: RecentPayment[];
  outstandingInvoices: OutstandingInvoice[];
  recentSalaryPayments: SalaryPayment[];
  statistics: DashboardStatistics;
  notifications: Notification[];
};

export type FinancialPayment = {
  id: number;
  date: Date |string | null;
  studentName: string;
  registrationNumber: string | null | undefined;
  program: string | null | undefined;
  semester: string | null | undefined;
  amount: number;
  method: string | null;
  reference: string | null;
};

export type FinancialSalary = {
  id: number;
  date: string | null;
  staffName: string;
  staffId: string | null | undefined;
  amount: number;
  status: string | null;
  description: string | null;
};

export type FinancialReportData = {
  summary: FinancialSummary;
  payments: FinancialPayment[];
  salaries: FinancialSalary[];
};

export async function getBursarDashboardData() {
  try {
    // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized');
    }

    // Get bursar info
    const bursar = await db.query.staff.findFirst({
      where: eq(staff.userId, authUser.userId),
      with: {
        department: true,
        user: {
          columns: {
            email: true
          }
        }
      }
    });

    if (!bursar) {
      throw new Error('Bursar profile not found');
    }

    // Current date and month calculations
    const currentDate = new Date();
    const currentMonthStart = startOfMonth(currentDate);
    const currentMonthEnd = endOfMonth(currentDate);
    const lastMonthStart = subMonths(currentMonthStart, 1);
    const lastMonthEnd = subMonths(currentMonthEnd, 1);

    // Get financial summary for current month
    const [currentMonthSummary] = await db
      .select({
        totalRevenue: sum(payments.amount).mapWith(Number),
        totalOutstanding: sum(invoices.balance).mapWith(Number),
        totalSalaries: sum(staffSalaries.amount).mapWith(Number)
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(staffSalaries, sql`1=1`) // Join with all salary payments
      .where(
        and(
          gte(payments.transactionDate, currentMonthStart),
          lte(payments.transactionDate, currentMonthEnd)
        )
      );

    // Get financial summary for last month for comparison
    const [lastMonthSummary] = await db
      .select({
        totalRevenue: sum(payments.amount).mapWith(Number),
        totalOutstanding: sum(invoices.balance).mapWith(Number),
        totalSalaries: sum(staffSalaries.amount).mapWith(Number)
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(staffSalaries, sql`1=1`)
      .where(
        and(
          gte(payments.transactionDate, lastMonthStart),
          lte(payments.transactionDate, lastMonthEnd)
        )
      );

    // Calculate net revenue
    const currentMonthNetRevenue = (currentMonthSummary?.totalRevenue || 0) - (currentMonthSummary?.totalSalaries || 0);
    const lastMonthNetRevenue = (lastMonthSummary?.totalRevenue || 0) - (lastMonthSummary?.totalSalaries || 0);

    const financialSummary: FinancialSummary = {
      totalRevenue: currentMonthSummary?.totalRevenue || 0,
      totalOutstanding: currentMonthSummary?.totalOutstanding || 0,
      totalSalaries: currentMonthSummary?.totalSalaries || 0,
      netRevenue: currentMonthNetRevenue,
      paymentCount: 0,
      salaryPaymentCount: 0
    };

    // Get revenue trend (last 6 months)
    const monthNames = [];
    const revenueTrendData = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = subMonths(currentMonthStart, i);
      const monthEnd = endOfMonth(monthStart);
      const monthName = format(monthStart, 'MMM yyyy');
      
      const [monthData] = await db
        .select({
          totalRevenue: sum(payments.amount).mapWith(Number)
        })
        .from(payments)
        .where(
          and(
            gte(payments.transactionDate, monthStart),
            lte(payments.transactionDate, monthEnd)
          )
        );

      monthNames.push(monthName);
      revenueTrendData.push(monthData?.totalRevenue || 0);
    }

    // Get recent payments (last 10)
    const recentPayments = await db
      .select({
        payment: payments,
        student: {
          firstName: students.firstName,
          lastName: students.lastName
        }
      })
      .from(payments)
      .leftJoin(students, eq(payments.studentId, students.id))
      .orderBy(desc(payments.transactionDate))
      .limit(10);

    const formattedRecentPayments: RecentPayment[] = recentPayments.map(p => ({
      id: p.payment.id,
      studentName: `${p.student?.firstName} ${p.student?.lastName}`,
      amount: Number(p.payment.amount),
      date: p.payment.transactionDate,
      method: p.payment.paymentMethod
    }));

    // Get top outstanding invoices
const outstandingInvoices = await db
  .select({
    invoice: {
      id: invoices.id,
      dueDate: invoices.dueDate,
      balance: invoices.balance
    },
    student: {
      firstName: students.firstName,
      lastName: students.lastName
    },
    program: {
      name: programs.name
    },
    semester: {
      name: semesters.name
    }
  })
  .from(invoices)
  // Use INNER JOIN where a match is always expected (e.g., invoices always belong to a student)
  .innerJoin(students, eq(invoices.studentId, students.id))
  .leftJoin(programs, eq(students.programId, programs.id))
  .leftJoin(semesters, eq(invoices.semesterId, semesters.id))
  // Safe numeric comparison
  
  .where(gt(invoices.balance, "0"))
  // Null-safe ordering (puts NULL dates at the bottom)
  .orderBy(sql`COALESCE(${invoices.dueDate}, '9999-12-31') ASC`)
  .limit(10);


    const formattedOutstandingInvoices: OutstandingInvoice[] = outstandingInvoices.map(i => ({
      id: i.invoice.id,
      studentName: `${i.student?.firstName} ${i.student?.lastName}`,
      programName: i.program?.name || 'N/A',
      semesterName: i.semester?.name || 'N/A',
      amountDue: Number(i.invoice.balance),
      dueDate: new Date(i.invoice.dueDate),
      status: new Date(i.invoice.dueDate) < new Date() ? 'overdue' : 'pending', // A logic to determine the status
    }));

    // Get recent salary payments
    const recentSalaryPayments = await db
      .select({
        salary: staffSalaries,
        staff: {
          firstName: staff.firstName,
          lastName: staff.lastName
        }
      })
      .from(staffSalaries)
      .leftJoin(staff, eq(staffSalaries.staffId, staff.id))
      .orderBy(desc(staffSalaries.paymentDate))
      .limit(5);

    const formattedSalaryPayments: SalaryPayment[] = recentSalaryPayments.map(s => ({
      id: s.salary.id,
      staffName: `${s.staff?.firstName} ${s.staff?.lastName}`,
      amount: Number(s.salary.amount),
      status: s.salary.status,
      paymentDate: new Date(s.salary.paymentDate)
    }));

    // Get recent notifications (using user logs as notifications)
    const recentNotifications = await db.query.userLogs.findMany({
      where: eq(userLogs.userId, authUser.userId),
      orderBy: (userLogs, { desc }) => [desc(userLogs.timestamp)],
      limit: 5
    });

    // Get statistics
    const [totalStudents] = await db.select({ count: count() }).from(students);
    const [totalStaff] = await db.select({ count: count() }).from(staff);
    const [totalActiveInvoices] = await db
      .select({ count: count() })
      .from(invoices)
      .where(sql`${invoices.balance} > 0`);

    return {
      bursar: {
        id: bursar.id,
        name: `${bursar.firstName} ${bursar.lastName}`,
        email: bursar.user?.email,
        department: bursar.department?.name || 'Not assigned',
        position: bursar.position
      },
      financialSummary,
      financialTrend: {
        months: monthNames,
        revenue: revenueTrendData
      },
      recentPayments: formattedRecentPayments,
      outstandingInvoices: formattedOutstandingInvoices,
      recentSalaryPayments: formattedSalaryPayments,
      statistics: {
        totalStudents: totalStudents?.count || 0,
        totalStaff: totalStaff?.count || 0,
        totalActiveInvoices: totalActiveInvoices?.count || 0,
        revenueChange: lastMonthSummary?.totalRevenue 
          ? ((financialSummary.totalRevenue - lastMonthSummary.totalRevenue) / lastMonthSummary.totalRevenue) * 100
          : 0,
        netRevenueChange: lastMonthNetRevenue 
          ? ((currentMonthNetRevenue - lastMonthNetRevenue) / lastMonthNetRevenue) * 100
          : 0
      },
      notifications: recentNotifications.map(notification => ({
        id: notification.id,
        action: notification.action,
        description: notification.description,
        timestamp: notification.timestamp
      }))
    };
  } catch (error) {
    console.error('Error in getBursarDashboardData:', error);
    throw new Error('Failed to fetch bursar dashboard data');
  }
}

// Additional action to get detailed financial report
export async function getFinancialReport(startDate: Date, endDate: Date) {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      throw new Error('Unauthorized');
    }

    // Get all payments in date range
    const paymentsData = await db
      .select({
        payment: payments,
        invoice: invoices,
        student: {
          firstName: students.firstName,
          lastName: students.lastName,
          registrationNumber: students.registrationNumber
        },
        program: {
          name: programs.name
        },
        semester: {
          name: semesters.name
        }
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(students, eq(payments.studentId, students.id))
      .leftJoin(programs, eq(students.programId, programs.id))
      .leftJoin(semesters, eq(invoices.semesterId, semesters.id))
      .where(
        and(
          gte(payments.transactionDate, startDate),
          lte(payments.transactionDate, endDate)
        )
      )
      .orderBy(desc(payments.transactionDate));

    // Get all salary payments in date range
    const salaryPayments = await db
      .select({
        salary: staffSalaries,
        staff: {
          firstName: staff.firstName,
          lastName: staff.lastName,
          idNumber: staff.idNumber
        }
      })
      .from(staffSalaries)
      .leftJoin(staff, eq(staffSalaries.staffId, staff.id))
      .where(
        and(
          gte(staffSalaries.paymentDate, startDate.toISOString()),
          lte(staffSalaries.paymentDate, endDate.toISOString())
        )
      )
      .orderBy(desc(staffSalaries.paymentDate));

    // Calculate totals
    const totalRevenue = paymentsData.reduce((sum, p) => sum + Number(p.payment.amount), 0);
    const totalSalaries = salaryPayments.reduce((sum, s) => sum + Number(s.salary.amount), 0);
    const netRevenue = totalRevenue - totalSalaries;

    const [outstandingSummary] = await db
  .select({
    totalOutstanding: sum(invoices.balance).mapWith(Number),
  })
  .from(invoices)
  .where(gt(invoices.balance, "0"));

    return {
      summary: {
        totalRevenue,
        totalSalaries,
        netRevenue,
        paymentCount: paymentsData.length,
        salaryPaymentCount: salaryPayments.length,
        totalOutstanding: outstandingSummary?.totalOutstanding || 0, // Add the missing property here

      },
      payments: paymentsData.map(p => ({
        id: p.payment.id,
        date: p.payment.transactionDate,
        studentName: `${p.student?.firstName} ${p.student?.lastName}`,
        registrationNumber: p.student?.registrationNumber,
        program: p.program?.name,
        semester: p.semester?.name,
        amount: Number(p.payment.amount),
        method: p.payment.paymentMethod,
        reference: p.payment.referenceNumber
      })),
      salaries: salaryPayments.map(s => ({
        id: s.salary.id,
        date: s.salary.paymentDate,
        staffName: `${s.staff?.firstName} ${s.staff?.lastName}`,
        staffId: s.staff?.idNumber,
        amount: Number(s.salary.amount),
        status: s.salary.status,
        description: s.salary.description
      }))
    };
  } catch (error) {
    console.error('Error in getFinancialReport:', error);
    throw new Error('Failed to generate financial report');
  }
}