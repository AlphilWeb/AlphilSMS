// 'use client';

// import { useEffect, useState } from 'react';
// import { getQuizSubmissionsByQuiz } from '@/lib/actions/lecturer.quiz.submissions.action';
// import { toast } from 'sonner';


// export type Submission = {
//   id: number;
//   quizId: number;
//   studentId: number;
//   submittedAt: Date;
//   grade: number | null;
//   score: string | null;
//   fileUrl: string;
//   feedback: string | null;
//   student: {
//     id: number;
//     firstName: string;
//     lastName: string;
//     registrationNumber: string;
//   };
// };

// export default function LecturerQuizSubmissionsPage({ quizId }: { quizId: number }) {
//   const [submissions, setSubmissions] = useState<Submission[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     getQuizSubmissionsByQuiz(quizId)
//       .then((data) => {
//         setSubmissions(data);
//         setLoading(false);
//       })
//       .catch(() => {
//         toast.error('Failed to fetch submissions');
//         setLoading(false);
//       });
//   }, [quizId]);

//   if (loading) return <p className="p-6">Loading...</p>;

//   return (
//     <div className="p-6">
//       <h1 className="text-xl font-bold mb-4">Quiz Submissions</h1>
//       {submissions.length === 0 ? (
//         <p>No submissions found for this quiz.</p>
//       ) : (
//         <table className="min-w-full text-sm">
//           <thead>
//             <tr className="border-b">
//               <th className="text-left p-2">Student</th>
//               <th className="text-left p-2">Registration No.</th>
//               <th className="text-left p-2">Submitted At</th>
//               <th className="text-left p-2">Grade</th>
//               <th className="text-left p-2">File</th>
//             </tr>
//           </thead>
//           <tbody>
//             {submissions.map((s) => (
//               <tr key={s.id} className="border-b">
//                 <td className="p-2">
//                   {s.student.firstName} {s.student.lastName}
//                 </td>
//                 <td className="p-2">{s.student.registrationNumber}</td>
//                 <td className="p-2">{new Date(s.submittedAt).toLocaleString()}</td>
//                 <td className="p-2">{s.grade || 'Pending'}</td>
//                 <td className="p-2">
//                   <a
//                     href={s.fileUrl}
//                     className="text-blue-500 underline"
//                     target="_blank"
//                     rel="noopener noreferrer"
//                   >
//                     View File
//                   </a>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }
