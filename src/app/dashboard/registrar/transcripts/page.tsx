// // app/dashboard/registrar/transcripts/page.tsx
// import { getPendingTranscripts } from '@/lib/actions/registrar.transcripts.action';
// import RegistrarDashboardHeader from '@/components/registrar-dashboard-header';
// import PendingTranscriptsTable from '@/components/registrar/pending-transcripts-table';
// import ErrorMessage from '@/components/ui/error-message';
// import Footer from '@/components/footer';
// import Link from 'next/link';

// export default async function RegistrarTranscriptsPage() {
//   try {
//     const pendingTranscripts = await getPendingTranscripts();

//     return (
//       <>
//         <RegistrarDashboardHeader />
        
//         <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
//           <div className="p-6 space-y-6 max-w-7xl mx-auto">
//             <div className="bg-white rounded-lg shadow p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h1 className="text-2xl font-bold text-gray-800">Transcript Management</h1>
//                 <Link
//                   href="/dashboard/registrar/transcripts/generate"
//                   className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm"
//                 >
//                   Generate New Transcript
//                 </Link>
//               </div>
              
//               <h2 className="text-lg font-semibold text-gray-700 mb-4">Pending Transcript Requests</h2>
//               <PendingTranscriptsTable transcripts={pendingTranscripts} />
//             </div>
            
//             <Footer />
//           </div>
//         </main>
//       </>
//     );
//   } catch (error) {
//     console.error('Error loading transcripts:', error);
//     return (
//       <>
//         <RegistrarDashboardHeader />
//         <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
//           <div className="p-6 max-w-7xl mx-auto">
//             <ErrorMessage
//               title="Failed to load transcripts"
//               message="There was an error loading transcript data. Please try again later."
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