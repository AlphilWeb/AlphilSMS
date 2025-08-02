// import { getDepartmentOverview } from '@/lib/actions/hod.dashboard.action';
// import HodDashboardHeader from '@/components/hodDashboardHeader';
// import HodDashboard from '@/components/hod/hod.dashboard';
// import ErrorMessage from '@/components/ui/error-message';

// export default async function HodDashboardPage() {
//   try {
//     const data = await getDepartmentOverview();

//     return (
//       <>
//         <HodDashboardHeader />
        
//         <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-blue-800 text-white">
//           <div className="p-6 space-y-6 max-w-7xl mx-auto">
//             {/* Welcome Banner - Removed duplicate since it's in the dashboard component */}
            
//             {/* Main Dashboard Content */}
//             <div className="space-y-6">
//               <HodDashboard data={data} />
//             </div>
//           </div>
//         </main>
//       </>
//     );
//   } catch (error) {
//     console.error('Error rendering HodDashboard:', error);
//     return (
//       <>
//         <HodDashboardHeader />
//         <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-blue-800 text-white">
//           <div className="p-6 max-w-7xl mx-auto">
//             <ErrorMessage
//               title="Failed to load dashboard"
//               message="There was an error loading HOD dashboard data. Please try again later."
//             />
//           </div>
//         </main>
//       </>
//     );
//   }
// }

export default function DashHome() {
  return (
    <>
      <p>&apos;/&apos; path page</p>
    </>  
  );
}