// // app/dashboard/userLogs/page.tsx
// import AdminDashboardHeader from "@/components/adminDashboardHeader";
// import Footer from "@/components/footer";
// import { getUserLogs } from "@/lib/actions/userLog.action"; // This action needs to be generated next
// import { getUsers } from "@/lib/actions/user.actions"; // Assuming this action exists
// import { FiActivity } from "react-icons/fi"; // Icon for user logs
// import UserLogsNav from "@/components/userLogsNav"; // The new nav component
// import UserLogsClientComponent from "@/components/userLogs/userLog-client-component";

// export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

// export default async function UserLogsPage() {
//   // Fetch all required data in parallel
//   const [userLogsFromDb, usersFromDb] = await Promise.all([
//     getUserLogs(),
//     getUsers(), // Fetch users for display names
//   ]);

//   // Prepare initial data for client component
//   const initialUserLogs = userLogsFromDb.map(log => ({
//     ...log,
//     // timestamp is a Date object from DB, convert to ISO string for client
//     timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
//   }));

//   // Prepare reference data for dropdowns and display names
//   const referenceData = {
//     users: usersFromDb.map(u => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email })),
//   };

//   return (
//     <>
//       <AdminDashboardHeader />

//       <main className="pl-[220px] h-screen bg-gradient-to-b from-emerald-950 to-emerald-900 text-white">
//         {/* Sticky header section with stats */}
//         <div className="sticky top-[58px] z-30 bg-emerald-800 px-12 py-4 flex flex-wrap justify-between items-center shadow-md">
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 px-4 py-3 rounded-lg shadow">
//               <FiActivity className="w-6 h-6" />
//               <span className="font-bold">Total User Logs: {initialUserLogs.length}</span>
//             </div>
//             {/* Add more user log-specific stats here if needed */}
//           </div>
          
//           <div className="flex flex-wrap gap-4 items-center">
//             <UserLogsNav />
//           </div>
//         </div>

//         {/* Pass initial data and reference data to the Client Component */}
//         <UserLogsClientComponent 
//           initialUserLogs={initialUserLogs}
//           referenceData={referenceData}
//         />

//         <Footer />
//       </main>
//     </>
//   );
// }

export default function DashHome() {
  return (
    <>
      <p>&apos;/&apos; path page</p>
    </>  
  );
}