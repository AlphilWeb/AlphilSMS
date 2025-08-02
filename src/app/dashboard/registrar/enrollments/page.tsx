// // app/dashboard/registrar/enrollments/page.tsx
// import { getCurrentSemesterCourses } from '@/lib/actions/registrar.academic.action';
// import RegistrarDashboardHeader from '@/components/registrar-dashboard-header';
// import EnrollmentCoursesList from '@/components/registrar/enrollment-courses-list';
// import ErrorMessage from '@/components/ui/error-message';
// import Footer from '@/components/footer';

// export default async function RegistrarEnrollmentsPage() {
//   try {
//     const courses = await getCurrentSemesterCourses();

//     return (
//       <>
//         <RegistrarDashboardHeader />
        
//         <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
//           <div className="p-6 space-y-6 max-w-7xl mx-auto">
//             <div className="bg-white rounded-lg shadow p-6">
//               <h1 className="text-2xl font-bold text-gray-800 mb-6">Enrollment Management</h1>
              
//               <EnrollmentCoursesList courses={courses} />
//             </div>
            
//             <Footer />
//           </div>
//         </main>
//       </>
//     );
//   } catch (error) {
//     console.error('Error loading enrollments:', error);
//     return (
//       <>
//         <RegistrarDashboardHeader />
//         <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
//           <div className="p-6 max-w-7xl mx-auto">
//             <ErrorMessage
//               title="Failed to load enrollments"
//               message="There was an error loading enrollment data. Please try again later."
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