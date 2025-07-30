'use client';

import { FiDownload, FiCalendar, FiAward } from 'react-icons/fi';
import Link from 'next/link';

export default function TranscriptsList({ transcripts }: {
  transcripts: {
    id: number;
    semesterId: number;
    semesterName: string;
    semesterStartDate: string;
    semesterEndDate: string;
    gpa: string | null;
    cgpa: string | null;
    generatedDate: string;
    fileUrl: string | null;
  }[]
}) {
  if (transcripts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transcripts available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transcripts.map((transcript) => {
        const startDate = new Date(transcript.semesterStartDate);
        const endDate = new Date(transcript.semesterEndDate);
        const generatedDate = new Date(transcript.generatedDate);

        return (
          <div key={transcript.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-800">{transcript.semesterName}</h3>
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <FiCalendar className="mr-1" />
                  <span>
                    {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {transcript.gpa && (
                  <div className="flex items-center text-sm text-gray-600">
                    <FiAward className="mr-1" />
                    <span>GPA: {transcript.gpa}</span>
                  </div>
                )}
                {transcript.cgpa && (
                  <div className="flex items-center text-sm text-gray-600">
                    <FiAward className="mr-1" />
                    <span>CGPA: {transcript.cgpa}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Generated: {generatedDate.toLocaleString()}
              </span>
              {transcript.fileUrl && (
                <Link
                  href={transcript.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-emerald-600 hover:text-emerald-800"
                >
                  <FiDownload className="mr-1" />
                  Download Transcript
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}