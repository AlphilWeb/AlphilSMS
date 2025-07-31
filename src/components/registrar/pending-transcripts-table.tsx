// components/registrar/transcripts/pending-transcripts-table.tsx
'use client';

import Link from 'next/link';
import { FiFileText, FiCheck, FiX } from 'react-icons/fi';

export default function PendingTranscriptsTable({ transcripts }: { transcripts: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">Student</th>
            <th scope="col" className="px-6 py-3">Reg Number</th>
            <th scope="col" className="px-6 py-3">Request Date</th>
            <th scope="col" className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transcripts.map((transcript) => (
            <tr key={transcript.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">
                {transcript.student.firstName} {transcript.student.lastName}
              </td>
              <td className="px-6 py-4">
                {transcript.student.registrationNumber}
              </td>
              <td className="px-6 py-4">
                {new Date(transcript.generatedDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 flex space-x-2">
                <Link 
                  href={`/dashboard/registrar/transcripts/${transcript.id}/generate`}
                  className="p-2 text-emerald-600 hover:text-emerald-800"
                  title="Generate Transcript"
                >
                  <FiFileText className="w-5 h-5" />
                </Link>
                <button 
                  className="p-2 text-green-600 hover:text-green-800"
                  title="Mark as Completed"
                >
                  <FiCheck className="w-5 h-5" />
                </button>
                <button 
                  className="p-2 text-red-600 hover:text-red-800"
                  title="Reject Request"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {transcripts.length === 0 && (
        <div className="bg-white p-6 text-center text-gray-500">
          No pending transcript requests
        </div>
      )}
    </div>
  );
}