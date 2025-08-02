// // app/dashboard/student/courses/enroll/page.tsx
// import { getAvailableCoursesForEnrollment } from '@/lib/actions/student.course.actions';
// import StudentDashboardHeader from '@/components/studentDashboardHeader';
// import CourseEnrollmentForm from '@/components/courses/course-enrollment-form';
// import ErrorMessage from '@/components/ui/error-message';
// import Footer from '@/components/footer';

// export default async function CourseEnrollmentPage() {
//   try {
//     const availableCourses = await getAvailableCoursesForEnrollment();

//     return (
//       <>
//         <StudentDashboardHeader />
        
//         <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
//           <div className="p-6 max-w-7xl mx-auto">
//             <div className="bg-white rounded-lg shadow p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h1 className="text-2xl font-bold text-gray-800">Course Enrollment</h1>
//                 <a
//                   href="/dashboard/student/courses"
//                   className="text-emerald-600 hover:text-emerald-800 font-medium"
//                 >
//                   View My Courses
//                 </a>
//               </div>
              
//               <CourseEnrollmentForm availableCourses={availableCourses} />
//             </div>
//             <Footer />
//           </div>
//         </main>
//       </>
//     );
//   } catch (error) {
//     console.error('Error rendering CourseEnrollmentPage:', error);
//     return (
//       <>
//         <StudentDashboardHeader />
//         <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
//           <div className="p-6 max-w-7xl mx-auto">
//             <ErrorMessage
//               title="Failed to load enrollment data"
//               message={error instanceof Error ? error.message : 'There was an error loading available courses.'}
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