// app/dashboard/payments/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import { getPayments } from "@/lib/actions/payment.action"; // This action needs to be generated next
import { getInvoices } from "@/lib/actions/invoice.action";
import { getStudents } from "@/lib/actions/student.action";
import { getSemesters } from "@/lib/actions/semester.action"; // Needed for invoice display
import { FiCreditCard } from "react-icons/fi"; // Icon for payments
import PaymentsNav from "@/components/paymentsNav"; // The new nav component
import PaymentsClientComponent from "@/components/payments/payment-client-component";

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export default async function PaymentsPage() {
  // Fetch all required data in parallel
  const [paymentsFromDb, invoicesFromDb, studentsFromDb, semestersFromDb] = await Promise.all([
    getPayments(),
    getInvoices(),
    getStudents(),
    getSemesters(),
  ]);

  // Prepare initial data for client component
  const initialPayments = paymentsFromDb.map(payment => ({
    ...payment,
    // transactionDate is a Date object from DB, convert to ISO string for client
    transactionDate: payment.transactionDate instanceof Date ? payment.transactionDate.toISOString() : payment.transactionDate,
  }));

  // Prepare reference data for dropdowns and display names
  const referenceData = {
    invoices: invoicesFromDb.map(inv => ({
      id: inv.id,
      studentId: inv.studentId,
      semesterId: inv.semesterId,
      amountDue: inv.amountDue,
      amountPaid: inv.amountPaid,
      balance: inv.balance,
      dueDate: inv.dueDate,
      issuedDate: inv.issuedDate instanceof Date ? inv.issuedDate.toISOString() : inv.issuedDate,
      status: inv.status,
    })),
    students: studentsFromDb.map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, registrationNumber: s.registrationNumber })),
    semesters: semestersFromDb.map(s => ({ id: s.id, name: s.name })),
  };

  return (
    <>
      <AdminDashboardHeader />

      <main className="pl-[220px] h-screen bg-gradient-to-b from-emerald-950 to-emerald-900 text-white">
        {/* Sticky header section with stats */}
        <div className="sticky top-[58px] z-30 bg-emerald-800 px-12 py-4 flex flex-wrap justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 px-4 py-3 rounded-lg shadow">
              <FiCreditCard className="w-6 h-6" />
              <span className="font-bold">Total Payments: {initialPayments.length}</span>
            </div>
            {/* Add more payment-specific stats here if needed */}
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <PaymentsNav />
          </div>
        </div>

        {/* Pass initial data and reference data to the Client Component */}
        <PaymentsClientComponent 
          initialPayments={initialPayments}
          referenceData={referenceData}
        />

        <Footer />
      </main>
    </>
  );
}