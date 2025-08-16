// app/dashboard/registrar/transcripts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import RegistrarDashboardHeader from '@/components/registrar-dashboard-header';
import PendingTranscriptsTable from '@/components/registrar/pending-transcripts-table';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';
import { getPendingTranscripts } from '@/lib/actions/registrar.transcripts.action';

export default function RegistrarTranscriptsPage() {
  const [transcripts, setTranscripts] = useState<PendingTranscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTranscripts() {
      try {
        const rawTranscripts = await getPendingTranscripts();
        
        // Map raw results into the PendingTranscript[] shape expected by the component
        const mappedTranscripts: PendingTranscript[] = rawTranscripts.map(t => ({
          id: t.id,
          studentName: t.studentName, // adjust based on your actual data structure
          regNumber: t.regNumber, // adjust based on your actual data structure
          semesterName: t.semesterName,
          generatedDate: t.generatedDate,
        }));
        
        setTranscripts(mappedTranscripts);
      } catch (err) {
        console.error('Error loading transcripts:', err);
        setError('Failed to load transcript data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchTranscripts();
  }, []);

  return (
    <>
      <RegistrarDashboardHeader />
      <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Pending Transcript Requests</h1>
              <hr />
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
              </div>
            ) : error ? (
              <ErrorMessage
                title="Error loading transcripts"
                message={error}
              />
            ) : (
              <PendingTranscriptsTable transcripts={transcripts} />
            )}
          </div>

          <Footer />
        </div>
      </main>
    </>
  );
}

// Define the PendingTranscript interface here if not already defined in your types
interface PendingTranscript {
  id: number;
  studentName: string;
  regNumber: string;
  semesterName: string;
  generatedDate: string | Date;
}