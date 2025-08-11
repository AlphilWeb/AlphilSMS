// components/dashboard/quick-actions.tsx
import Link from 'next/link';
import { 
  FiBook, 
  FiPieChart, 
  FiClock, 
  FiDollarSign, 
  FiFileText 
} from 'react-icons/fi';

export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link 
          href="/dashboard/student/courses"
          className="text-blue-500 flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-emerald-50 transition-colors"
        >
          <FiBook className="w-6 h-6 text-emerald-600 mb-2" />
          <span className="text-sm text-center">View Courses</span>
        </Link>
        <Link 
          href="/dashboard/student/grades"
          className="text-blue-500 flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-emerald-50 transition-colors"
        >
          <FiPieChart className="w-6 h-6 text-emerald-600 mb-2" />
          <span className="text-blue-500 text-sm text-center">Check Grades</span>
        </Link>
        <Link 
          href="/dashboard/student/timetable"
          className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-emerald-50 transition-colors"
        >
          <FiClock className="w-6 h-6 text-emerald-600 mb-2" />
          <span className="text-blue-500 text-sm text-center">View Timetable</span>
        </Link>
        <Link 
          href="/dashboard/student/finance/payments"
          className="text-blue-500 flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-emerald-50 transition-colors"
        >
          <FiDollarSign className="w-6 h-6 text-emerald-600 mb-2" />
          <span className="text-blue-500 text-sm text-center">Make Payment</span>
        </Link>
        <Link 
          href="/dashboard/student/transcript"
          className="text-blue-500 flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-emerald-50 transition-colors"
        >
          <FiFileText className="w-6 h-6 text-emerald-600 mb-2" />
          <span className="text-blue-500 text-sm text-center">Download Transcript</span>
        </Link>
      </div>
    </div>
  );
}