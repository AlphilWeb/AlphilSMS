// // components/student/courses/course-enrollment-form.tsx
// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { getAvailableCoursesForEnrollment } from '@/lib/actions/student.course.actions';
// import { toast } from 'sonner';

// interface Course {
//   id: number;
//   name: string;
//   code: string;
//   credits: string;
//   description: string | null;
// }

// interface CourseEnrollmentFormProps {
//   availableCourses: Course[];
// }

// export default function CourseEnrollmentForm({ availableCourses }: CourseEnrollmentFormProps) {
//   const router = useRouter();
//   const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedCourseId) return;

//     setIsSubmitting(true);
//     try {
//       const result = await getAvailableCoursesForEnrollment(selectedCourseId);
//       toast.success(result.success);
//       router.push('/dashboard/student/courses');
//       router.refresh();
//     } catch (error) {
//       toast.error(error instanceof Error ? error.message : 'Failed to enroll in course');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div>
//       {availableCourses.length === 0 ? (
//         <div className="text-center py-8 text-gray-500">
//           No courses available for enrollment in your current program and semester.
//         </div>
//       ) : (
//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="space-y-4">
//             <h2 className="text-lg font-medium text-gray-800">Available Courses</h2>
            
//             <div className="space-y-3">
//               {availableCourses.map((course) => (
//                 <div 
//                   key={course.id}
//                   className={`p-4 border rounded-lg cursor-pointer transition-colors ${
//                     selectedCourseId === course.id 
//                       ? 'border-emerald-500 bg-emerald-50' 
//                       : 'border-gray-200 hover:border-gray-300'
//                   }`}
//                   onClick={() => setSelectedCourseId(course.id)}
//                 >
//                   <div className="flex items-start justify-between">
//                     <div>
//                       <h3 className="font-medium text-gray-800">{course.name}</h3>
//                       <p className="text-sm text-gray-500">{course.code} • {course.credits} credits</p>
//                     </div>
//                     <input
//                       type="radio"
//                       checked={selectedCourseId === course.id}
//                       onChange={() => setSelectedCourseId(course.id)}
//                       className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
//                     />
//                   </div>
//                   {course.description && (
//                     <p className="mt-2 text-sm text-gray-600 line-clamp-2">
//                       {course.description}
//                     </p>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="flex justify-end">
//             <button
//               type="submit"
//               disabled={!selectedCourseId || isSubmitting}
//               className={`px-4 py-2 rounded-lg text-white ${
//                 !selectedCourseId || isSubmitting
//                   ? 'bg-gray-400 cursor-not-allowed'
//                   : 'bg-emerald-600 hover:bg-emerald-700'
//               } transition-colors`}
//             >
//               {isSubmitting ? 'Enrolling...' : 'Enroll in Course'}
//             </button>
//           </div>
//         </form>
//       )}
//     </div>
//   );
// }