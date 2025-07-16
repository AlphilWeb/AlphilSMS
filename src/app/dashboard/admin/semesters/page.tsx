// app/dashboard/semesters/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import { getSemesters } from "@/lib/actions/semester.action";
import { FiCalendar } from "react-icons/fi"; // Icon for semesters
import SemestersNav from "@/components/semestersNav"; // The new nav component
import SemestersClientComponent from "@/components/semesters/semester-client-component";

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export default async function SemestersPage() {
  // Fetch all semesters
  const semestersFromDb = await getSemesters();

  // Prepare initial data for client component
  const initialSemesters = semestersFromDb.map(semester => ({
    ...semester,
    // startDate and endDate are already strings due to Drizzle's mode: 'string'
  }));

  // No referenceData needed for semesters as per schema (no foreign keys to other tables for dropdowns)
  const referenceData = {}; // Empty object for consistency, or omit if not passed

  return (
    <>
      <AdminDashboardHeader />

      <main className="pl-[220px] h-screen bg-gradient-to-b from-emerald-950 to-emerald-900 text-white">
        {/* Sticky header section with stats */}
        <div className="sticky top-[58px] z-30 bg-emerald-800 px-12 py-4 flex flex-wrap justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 px-4 py-3 rounded-lg shadow">
              <FiCalendar className="w-6 h-6" />
              <span className="font-bold">Total Semesters: {initialSemesters.length}</span>
            </div>
            {/* Add more semester-specific stats here if needed */}
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <SemestersNav />
          </div>
        </div>

        {/* Pass initial data to the Client Component */}
        <SemestersClientComponent 
          initialSemesters={initialSemesters}
          // referenceData={referenceData} // Can be omitted if truly empty and not used
        />

        <Footer />
      </main>
    </>
  );
}