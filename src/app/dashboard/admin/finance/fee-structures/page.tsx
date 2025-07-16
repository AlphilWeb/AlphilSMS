// app/dashboard/feeStructures/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import { getFeeStructures } from "@/lib/actions/feeStructure.action";
import { getPrograms } from "@/lib/actions/program.action";
import { getSemesters } from "@/lib/actions/semester.action";
import { FiDollarSign } from "react-icons/fi"; // Icon for fee structures
import FeeStructuresNav from "@/components/feeStructuresNav"; // The new nav component
import FeeStructuresClientComponent from "@/components/feeStructures/feeStructure-client-component";

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export default async function FeeStructuresPage() {
  // Fetch all required data in parallel
  const [feeStructuresFromDb, programsFromDb, semestersFromDb] = await Promise.all([
    getFeeStructures(),
    getPrograms(),
    getSemesters(),
  ]);

  // Prepare initial data for client component
  const initialFeeStructures = feeStructuresFromDb.map(fs => ({
    ...fs,
    // amount and dueDate are already string due to Drizzle's numeric/date mode: 'string'
  }));

  // Prepare reference data for dropdowns
  const referenceData = {
    programs: programsFromDb.map(p => ({ id: p.id, name: p.name, code: p.code })),
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
              <FiDollarSign className="w-6 h-6" />
              <span className="font-bold">Total Fee Structures: {initialFeeStructures.length}</span>
            </div>
            {/* Add more fee structure-specific stats here if needed */}
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <FeeStructuresNav />
          </div>
        </div>

        {/* Pass initial data and reference data to the Client Component */}
        <FeeStructuresClientComponent 
          initialFeeStructures={initialFeeStructures}
          referenceData={referenceData}
        />

        <Footer />
      </main>
    </>
  );
}