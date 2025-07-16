// app/dashboard/transcripts/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import { getTranscripts } from "@/lib/actions/transcript.action";
import { getStudents } from "@/lib/actions/student.action";
import { getSemesters } from "@/lib/actions/semester.action";
import { FiFileText } from "react-icons/fi"; // Icon for transcripts
import TranscriptsNav from "@/components/transcriptsNav"; // The new nav component
import TranscriptsClientComponent from "@/components/transcripts/transcript-client-component";

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export default async function TranscriptsPage() {
  // Fetch all required data in parallel
  const [transcriptsFromDb, studentsFromDb, semestersFromDb] = await Promise.all([
    getTranscripts(),
    getStudents(),
    getSemesters(),
  ]);

  // Prepare initial data for client component
  const initialTranscripts = transcriptsFromDb.map(transcript => ({
    ...transcript,
    // Convert Date object to ISO string for client component serialization
    generatedDate: transcript.generatedDate instanceof Date ? transcript.generatedDate.toISOString() : transcript.generatedDate,
  }));

  // Prepare reference data for dropdowns and display names
  const referenceData = {
    students: studentsFromDb.map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, registrationNumber: s.registrationNumber })),
    semesters: semestersFromDb.map(s => ({ id: s.id, name: s.name })),
  };

  return (
    <>
      <AdminDashboardHeader />

      <main className="pl-[220px] h-screen bg-gradient-to-b from-emerald-950 to-emerald-900 text-white">
        {/* Sticky header section with stats */}
        <div className="sticky top-[58px] z-30 bg-emerald-800 px-12 py-4 flex flex-wrap justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 px-4 py-3 rounded-lg shadow">
              <FiFileText className="w-6 h-6" />
              <span className="font-bold">Total Transcripts: {initialTranscripts.length}</span>
            </div>
            {/* Add more transcript-specific stats here if needed */}
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <TranscriptsNav />
          </div>
        </div>

        {/* Pass initial data and reference data to the Client Component */}
        <TranscriptsClientComponent 
          initialTranscripts={initialTranscripts}
          referenceData={referenceData}
        />

        <Footer />
      </main>
    </>
  );
}