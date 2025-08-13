import { FiFileText, FiBarChart2, FiCheckCircle, FiClock, FiAlertTriangle } from 'react-icons/fi';

export default function RecentSubmissionsCard({ submissions, totalCount }: {
  submissions: any[];
  totalCount: number;
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return <FiCheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'late':
        return <FiAlertTriangle className="h-4 w-4 text-pink-500" />;
      default:
        return <FiClock className="h-4 w-4 text-pink-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          <FiFileText className="text-pink-500" /> Recent Submissions
        </h3>
        <a
          href="/dashboard/lecturer/submissions"
          className="text-sm text-pink-500 hover:underline"
        >
          View All ({totalCount})
        </a>
      </div>

      <div className="space-y-4">
        {submissions.slice(0, 3).map((submission) => (
          <div key={submission.id} className="flex items-start p-3 border border-gray-100 rounded-lg">
            <div className={`p-2 rounded-lg mr-3 ${
              submission.type === 'assignment' ? 'bg-pink-100 text-pink-500' : 'bg-purple-100 text-purple-500'
            }`}>
              {submission.type === 'assignment' ? (
                <FiFileText className="h-5 w-5" />
              ) : (
                <FiBarChart2 className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-500">{submission.title}</h4>
              <p className="text-sm text-gray-800">{submission.studentName}</p>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(submission.status)}
                  <span className="text-black ml-1 text-xs capitalize">{submission.status}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}