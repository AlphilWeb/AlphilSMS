// app/dashboard/staffSalaries/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import { getStaffSalaries } from "@/lib/actions/staffSalary.action"; // This action needs to be generated next
import { getStaff } from "@/lib/actions/staff.action"; // Assuming this action exists
import { FiDollarSign } from "react-icons/fi"; // Icon for staff salaries
import StaffSalariesNav from "@/components/staffSalariesNav"; // The new nav component
import StaffSalariesClientComponent from "@/components/staffSalaries/staffSalary-client-component";

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export default async function StaffSalariesPage() {
  // Fetch all required data in parallel
  const [staffSalariesFromDb, staffFromDb] = await Promise.all([
    getStaffSalaries(),
    getStaff(),
  ]);

  // Prepare initial data for client component
  const initialStaffSalaries = staffSalariesFromDb.map(salary => ({
    ...salary,
    // amount and paymentDate are already string due to Drizzle's numeric/date mode: 'string'
  }));

  // Prepare reference data for dropdowns and display names (CORRECTED: removed staffId from staff mapping)
  const referenceData = {
    staff: staffFromDb.map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName })), // CORRECTED
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
              <span className="font-bold">Total Staff Salaries: {initialStaffSalaries.length}</span>
            </div>
            {/* Add more staff salary-specific stats here if needed */}
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <StaffSalariesNav />
          </div>
        </div>

        {/* Pass initial data and reference data to the Client Component */}
        <StaffSalariesClientComponent 
          initialStaffSalaries={initialStaffSalaries}
          referenceData={referenceData}
        />

        <Footer />
      </main>
    </>
  );
}