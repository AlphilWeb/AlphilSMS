'use client';

import { FiBarChart } from 'react-icons/fi';

type Statistic = {
  programId: number;
  programName: string;
  departmentName: string;
  totalEnrollments: number;
};

export default function EnrollmentStatsList({
  stats,
}: {
  stats: Statistic[];
}) {
  const mappedStats = stats.map((stat) => ({
    program: stat.programName,
    semester: 'N/A', // Replace with actual semester info if needed
    total: stat.totalEnrollments,
  }));

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Enrollment Statistics</h2>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {mappedStats.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                    <FiBarChart className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">{row.program}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.semester}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
