'use client';

import { FiDownload } from 'react-icons/fi';
import Link from 'next/link';

export default function InvoicesList({ invoices }: {
  invoices: {
    id: number;
    semesterName: string;
    amountDue: string;
    amountPaid: string;
    balance: string;
    dueDate: string;
    status: string;
  }[]
}) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No invoices found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => {
            const dueDate = new Date(invoice.dueDate);
            const isOverdue = invoice.status === 'OVERDUE';
            
            return (
              <tr key={invoice.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {invoice.semesterName}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {dueDate.toLocaleDateString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${parseFloat(invoice.amountDue).toFixed(2)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${parseFloat(invoice.amountPaid).toFixed(2)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <span className={invoice.balance > '0' ? 'text-red-600' : 'text-emerald-600'}>
                    ${parseFloat(invoice.balance).toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    isOverdue ? 'bg-red-100 text-red-800' :
                    invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Link 
                    href={`/api/invoices/${invoice.id}/download`} 
                    className="text-emerald-600 hover:text-emerald-800 flex items-center"
                  >
                    <FiDownload className="mr-1" /> Download
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}