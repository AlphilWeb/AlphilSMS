// // app/dashboard/students/page.tsx
// import AdminDashboardHeader from "@/components/adminDashboardHeader";
// import Footer from "@/components/footer";
// import { getStudents } from "@/lib/actions/student.action";
// import { getPrograms } from "@/lib/actions/program.action";
// import { getDepartments } from "@/lib/actions/department.action";
// import { getSemesters } from "@/lib/actions/semester.action";
// import { BsPeopleFill } from "react-icons/bs";
// import StudentsNav from "@/components/studentsNav";
// import StudentsClientComponent from "@/components/students/student-client-component";

// export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

// export default async function StudentsPage() {
//   // Fetch all required data in parallel
//   const [studentsFromDb, programs, departments, semesters] = await Promise.all([
//     getStudents(),
//     getPrograms(),
//     getDepartments(),
//     getSemesters()
//   ]);

//   // Prepare initial data for client component
//   const initialStudents = studentsFromDb.map(student => ({
//     ...student,
//   }));

//   // Prepare reference data for dropdowns
//   const referenceData = {
//     programs: programs.map(p => ({ id: p.id, name: p.name })),
//     departments: departments.map(d => ({ id: d.id, name: d.name })),
//     semesters: semesters.map(s => ({ id: s.id, name: s.name }))
//   };

//   return (
//     <>
//       <AdminDashboardHeader />

//       <main className="pl-[220px] h-screen bg-gradient-to-b from-emerald-950 to-emerald-900 text-white">
//         {/* Sticky header section with stats */}
//         <div className="sticky top-[58px] z-30 bg-emerald-800 px-12 py-4 flex flex-wrap justify-between items-center shadow-md">
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 px-4 py-3 rounded-lg shadow">
//               <BsPeopleFill className="w-6 h-6" />
//               <span className="font-bold">Total Students: {initialStudents.length}</span>
//             </div>
//             <div className="hidden md:flex items-center gap-4">
//               <div className="bg-emerald-700/50 px-3 py-2 rounded-lg">
//                 <span className="text-sm">Programs: {programs.length}</span>
//               </div>
//               <div className="bg-emerald-700/50 px-3 py-2 rounded-lg">
//                 <span className="text-sm">Departments: {departments.length}</span>
//               </div>
//               <div className="bg-emerald-700/50 px-3 py-2 rounded-lg">
//                 <span className="text-sm">Active Semesters: {semesters.length}</span>
//               </div>
//             </div>
//           </div>
          
//           <div className="flex flex-wrap gap-4 items-center">
//             <StudentsNav />
//           </div>
//         </div>

//         {/* Pass initial data and reference data to the Client Component */}
//         <StudentsClientComponent 
//           initialStudents={initialStudents}
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