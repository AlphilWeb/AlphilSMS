'use client';

import { FiDollarSign, FiCreditCard, FiFileText } from 'react-icons/fi';

export default function FinancialOverview({ 
  invoices, 
  payments,
  programName 
}: {
  invoices: {
    amountDue: string;
    amountPaid: string;
    balance: string;
    status: string;
  }[];
  payments: {
    amount: string;
  }[];
  programName: string;
}) {
  // const totalDue = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.amountDue), 0);
  const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const outstandingBalance = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.balance), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Program</p>
              <p className="font-medium text-gray-800">{programName}</p>
            </div>
            <FiFileText className="text-emerald-600 w-6 h-6" />
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="font-medium text-gray-800">${totalPaid.toFixed(2)}</p>
            </div>
            <FiCreditCard className="text-emerald-600 w-6 h-6" />
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Outstanding Balance</p>
              <p className={`font-medium ${
                outstandingBalance > 0 ? 'text-red-600' : 'text-gray-800'
              }`}>
                ${outstandingBalance.toFixed(2)}
              </p>
            </div>
            <FiDollarSign className="text-emerald-600 w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}