// app/dashboard/programs/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import { getPrograms } from "@/lib/actions/program.action";
import { getDepartments } from "@/lib/actions/department.action"; // To get departments for dropdown
import { FiBookOpen } from "react-icons/fi"; // Icon for programs
import ProgramsNav from "@/components/programsNav";
import ProgramsClientComponent from "@/components/programs/program-client-component";

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export default async function ProgramsPage() {
  // Fetch all required data in parallel
  const [programsFromDb, departmentsFromDb] = await Promise.all([
    getPrograms(),
    getDepartments(),
  ]);

  // Prepare initial data for client component
  const initialPrograms = programsFromDb.map(program => ({
    ...program,
  }));

  // Prepare reference data for dropdowns (e.g., for departmentId)
  const referenceData = {
    departments: departmentsFromDb.map(d => ({ id: d.id, name: d.name })),
  };

  return (
    <>
      <AdminDashboardHeader />

      <main className="pl-[220px] h-screen bg-gradient-to-b from-emerald-950 to-emerald-900 text-white">
        {/* Sticky header section with stats */}
        <div className="sticky top-[58px] z-30 bg-emerald-800 px-12 py-4 flex flex-wrap justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 px-4 py-3 rounded-lg shadow">
              <FiBookOpen className="w-6 h-6" />
              <span className="font-bold">Total Programs: {initialPrograms.length}</span>
            </div>
            {/* Add more program-specific stats here if needed */}
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <ProgramsNav />
          </div>
        </div>

        {/* Pass initial data and reference data to the Client Component */}
        <ProgramsClientComponent 
          initialPrograms={initialPrograms}
          referenceData={referenceData}
        />

        <Footer />
      </main>
    </>
  );
}