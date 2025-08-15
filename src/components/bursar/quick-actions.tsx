import Link from 'next/link';
import { FiPlus, FiUpload, FiDownload, FiPrinter } from 'react-icons/fi';

export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-pink-500">
        <Link 
          href="/dashboard/bursar/invoices/create" 
          className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <FiPlus className="w-6 h-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium">Create Invoice</span>
        </Link>
        
        <Link 
          href="/dashboard/bursar/payments/record" 
          className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <FiUpload className="w-6 h-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium">Record Payment</span>
        </Link>
        
        <Link 
          href="/dashboard/bursar/reports/generate" 
          className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <FiDownload className="w-6 h-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium">Generate Report</span>
        </Link>
        
        <Link 
          href="/dashboard/bursar/statements/print" 
          className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <FiPrinter className="w-6 h-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium">Print Statements</span>
        </Link>
      </div>
    </div>
  );
}