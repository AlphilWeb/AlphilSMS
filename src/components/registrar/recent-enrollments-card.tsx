// components/registrar/recent-enrollments-card.tsx
import { FiUser, FiBook } from 'react-icons/fi';
import Link from 'next/link';

type EnrollmentItem = {
  studentName: string;
  regNumber: string;
  course: string;
  date: string | Date;
};

type RecentEnrollmentsCardProps = {
  enrollments: EnrollmentItem[];
};

export default function RecentEnrollmentsCard({ enrollments }: RecentEnrollmentsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Enrollments</h3>
        <Link 
          href="/dashboard/registrar/enrollments" 
          className="text-sm text-emerald-600 hover:text-emerald-800"
        >
          View All
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {enrollments.length > 0 ? (
              enrollments.map((enrollment, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center mr-2">
                        <FiUser className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{enrollment.studentName}</div>
                        <div className="text-sm text-gray-500">{enrollment.regNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                        <FiBook className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-sm text-gray-900">{enrollment.course}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(enrollment.date).toLocaleDateString() || 'N/A'} 
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                  No recent enrollments
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}