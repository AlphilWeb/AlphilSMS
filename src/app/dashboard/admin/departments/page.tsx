// app/dashboard/departments/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import { getDepartments } from "@/lib/actions/department.action";
import { getStaff } from "@/lib/actions/staff.action"; // To get staff for headOfDepartment dropdown
import { BsBuildingFill } from "react-icons/bs"; // Icon for departments
import DepartmentsNav from "@/components/departmentsNav"; // The new nav component
import DepartmentsClientComponent from "@/components/departments/department-client-component";

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export default async function DepartmentsPage() {
  // Fetch all required data in parallel
  const [departmentsFromDb, staffFromDb] = await Promise.all([
    getDepartments(),
    getStaff(),
  ]);

  // Prepare initial data for client component
  const initialDepartments = departmentsFromDb.map(dept => ({
    ...dept,
    // No date fields to convert for departments table directly
  }));

  // Prepare reference data for dropdowns (e.g., for headOfDepartmentId)
  const referenceData = {
    staff: staffFromDb.map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName })),
  };

  return (
    <>
      <AdminDashboardHeader />

      <main className="pl-[220px] h-screen bg-gradient-to-b from-emerald-950 to-emerald-900 text-white">
        {/* Sticky header section with stats */}
        <div className="sticky top-[58px] z-30 bg-emerald-800 px-12 py-4 flex flex-wrap justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 px-4 py-3 rounded-lg shadow">
              <BsBuildingFill className="w-6 h-6" />
              <span className="font-bold">Total Departments: {initialDepartments.length}</span>
            </div>
            {/* Add more department-specific stats here if needed */}
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <DepartmentsNav />
          </div>
        </div>

        {/* Pass initial data and reference data to the Client Component */}
        <DepartmentsClientComponent 
          initialDepartments={initialDepartments}
          referenceData={referenceData}
        />

        <Footer />
      </main>
    </>
  );
}