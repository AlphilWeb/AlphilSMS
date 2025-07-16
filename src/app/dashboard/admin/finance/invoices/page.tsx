// app/dashboard/invoices/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import { getInvoices } from "@/lib/actions/invoice.action";
import { getStudents } from "@/lib/actions/student.action";
import { getSemesters } from "@/lib/actions/semester.action";
import { getFeeStructures } from "@/lib/actions/feeStructure.action"; // Assuming this action exists
import { getPrograms } from "@/lib/actions/program.action"; // Needed for fee structure display
import { FiFileText } from "react-icons/fi"; // Icon for invoices
import InvoicesNav from "@/components/invoicesNav"; // The new nav component
import InvoicesClientComponent from "@/components/invoices/invoice-client-component";

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export default async function InvoicesPage() {
  // Fetch all required data in parallel
  const [invoicesFromDb, studentsFromDb, semestersFromDb, feeStructuresFromDb, programsFromDb] = await Promise.all([
    getInvoices(),
    getStudents(),
    getSemesters(),
    getFeeStructures(),
    getPrograms(), // Fetch programs for fee structure display
  ]);

  // Prepare initial data for client component
  const initialInvoices = invoicesFromDb.map(invoice => ({
    ...invoice,
    // issuedDate is a Date object from DB, convert to ISO string for client
    issuedDate: invoice.issuedDate instanceof Date ? invoice.issuedDate.toISOString() : invoice.issuedDate,
  }));

  // Prepare reference data for dropdowns and display names
  const referenceData = {
    students: studentsFromDb.map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, registrationNumber: s.registrationNumber })),
    semesters: semestersFromDb.map(s => ({ id: s.id, name: s.name })),
    feeStructures: feeStructuresFromDb.map(fs => ({
      id: fs.id,
      programId: fs.programId,
      semesterId: fs.semesterId,
      totalAmount: fs.totalAmount,
      description: fs.description,
    })),
    programs: programsFromDb.map(p => ({ id: p.id, name: p.name, code: p.code })),
  };

  return (
    <>
      <AdminDashboardHeader />

      <main className="pl-[220px] h-screen bg-gradient-to-b from-emerald-950 to-emerald-900 text-white">
        {/* Sticky header section with stats */}
        <div className="sticky top-[58px] z-30 bg-emerald-800 px-12 py-4 flex flex-wrap justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 px-4 py-3 rounded-lg shadow">
              <FiFileText className="w-6 h-6" />
              <span className="font-bold">Total Invoices: {initialInvoices.length}</span>
            </div>
            {/* Add more invoice-specific stats here if needed */}
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <InvoicesNav />
          </div>
        </div>

        {/* Pass initial data and reference data to the Client Component */}
        <InvoicesClientComponent 
          initialInvoices={initialInvoices}
          referenceData={referenceData}
        />

        <Footer />
      </main>
    </>
  );
}