// // app/dashboard/registrar/timetables/page.tsx
// import { getAllTimetables } from '@/lib/actions/registrar.timetable.action';
// import RegistrarDashboardHeader from '@/components/registrar-dashboard-header';
// import TimetablesList from '@/components/registrar/timetable-list';
// import ErrorMessage from '@/components/ui/error-message';
// import Footer from '@/components/footer';

// export default async function RegistrarTimetablesPage() {
//   try {
//     const timetables = await getAllTimetables();

//     return (
//       <>
//         <RegistrarDashboardHeader />
        
//         <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
//           <div className="p-6 space-y-6 max-w-7xl mx-auto">
//             <div className="bg-white rounded-lg shadow p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h1 className="text-2xl font-bold text-gray-800">Timetable Management</h1>
//                 <hr />
//               </div>
              
//               <TimetablesList timetables={timetables} />
//             </div>
            
//             <Footer />
//           </div>
//         </main>
//       </>
//     );
//   } catch (error) {
//     console.error('Error loading timetables:', error);
//     return (
//       <>
//         <RegistrarDashboardHeader />
//         <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
//           <div className="p-6 max-w-7xl mx-auto">
//             <ErrorMessage
//               title="Failed to load timetables"
//               message="There was an error loading timetable data. Please try again later."
//             />
//             <Footer />
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