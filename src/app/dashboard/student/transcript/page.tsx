// app/dashboard/student/transcripts/page.tsx
import { getStudentTranscripts } from '@/lib/actions/studentTranscripts.action';
import TranscriptsList from '@/components/transcripts-student/transcripts-list'
import ErrorMessage from '@/components/ui/error-message';

export default async function TranscriptsPage() {
  try {
    const transcripts = await getStudentTranscripts();

    return (
      // <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 max-w-7xl mx-auto bg-emerald-800">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">My Transcripts</h1>
            <TranscriptsList transcripts={transcripts} />
          </div>
        </div>
      // {/* </main> */}
    );
  } catch (error) {
    console.error('Error rendering TranscriptsPage:', error);
    return (
      // <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 max-w-7xl mx-auto bg-emerald-800">
          <ErrorMessage
            title="Failed to load transcripts"
            message={error instanceof Error ? error.message : 'There was an error loading your transcripts.'}
          />
        </div>
      // </main>
    );
  }
}