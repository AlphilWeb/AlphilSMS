// components/registrar/pending-transcripts-card.tsx
import { FiFileText, FiCheck, FiX, FiClock } from 'react-icons/fi';
import Link from 'next/link';

type PendingTranscript = {
  studentName: string;
  regNumber: string;
  requestedDate: string | Date;
  status: 'pending' | 'processing' | 'ready';
};

type PendingTranscriptsCardProps = {
  transcripts: PendingTranscript[];
};

export default function PendingTranscriptsCard({ transcripts }: PendingTranscriptsCardProps) {
  // Update the type of the status parameter to be more specific
  const getStatusColor = (status: PendingTranscript['status']) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      default: // This will now only match 'pending'
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Pending Transcripts</h3>
        <Link
          href="/dashboard/registrar/transcripts"
          className="text-sm text-emerald-600 hover:text-emerald-800"
        >
          View All
        </Link>
      </div>

      {transcripts.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {transcripts.map((transcript, index) => (
            <li key={index} className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <FiFileText className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transcript.studentName}</p>
                    <p className="text-sm text-gray-500">{transcript.regNumber}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transcript.status)}`}>
                    {transcript.status}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <FiClock className="mr-1 h-3 w-3" />
                    {formatDate(transcript.requestedDate)}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex justify-end space-x-2">
                <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                  <FiCheck className="-ml-0.5 mr-1.5 h-4 w-4 text-green-600" />
                  Approve
                </button>
                <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                  <FiX className="-ml-0.5 mr-1.5 h-4 w-4 text-red-600" />
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-6">
          <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
          <h4 className="mt-2 text-sm font-medium text-gray-900">No pending transcripts</h4>
          <p className="mt-1 text-sm text-gray-500">All transcript requests have been processed.</p>
        </div>
      )}
    </div>
  );
}