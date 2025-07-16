// app/dashboard/staff/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import { getStaff } from "@/lib/actions/staff.action";
import { getDepartments } from "@/lib/actions/department.action";
import { BsPeopleFill } from "react-icons/bs"; // Using a generic icon, you might want a specific one for staff
import StaffNav from "@/components/staffNav"; // Assuming you have or will create a StaffNav component
import StaffClientComponent from "@/components/staff/staff-client-component"; // Your client component

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export default async function StaffPage() {
  // Fetch all required data in parallel
  const [staffFromDb, departments] = await Promise.all([
    getStaff(),
    getDepartments(),
  ]);

  // Prepare initial data for client component
  // Ensure dates are stringified if they come as Date objects from Drizzle,
  // as Client Components can't directly serialize Date objects from Server Components.
  const initialStaff = staffFromDb.map(member => ({
    ...member,

  }));

  // Prepare reference data for dropdowns (e.g., for departments)
    const referenceData = {
        departments: departments.map(d => ({ id: d.id, name: d.name })),
        // Add other reference data as needed
    };

  return (
    <>
      <AdminDashboardHeader />

      <main className="pl-[220px] h-screen bg-gradient-to-b from-emerald-950 to-emerald-900 text-white">
        {/* Sticky header section with stats */}
        <div className="sticky top-[58px] z-30 bg-emerald-800 px-12 py-4 flex flex-wrap justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 px-4 py-3 rounded-lg shadow">
              <BsPeopleFill className="w-6 h-6" /> {/* Placeholder icon */}
              <span className="font-bold">Total Staff: {initialStaff.length}</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-emerald-700/50 px-3 py-2 rounded-lg">
                <span className="text-sm">Departments: {departments.length}</span>
              </div>
              {/* Add more staff-specific stats here if needed */}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <StaffNav /> {/* Your staff-specific navigation */}
          </div>
        </div>

        {/* Pass initial data and reference data to the Client Component */}
        <StaffClientComponent 
          initialStaff={initialStaff}
          referenceData={referenceData}
        />

        <Footer />
      </main>
    </>
  );
}