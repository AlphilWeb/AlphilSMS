// components/dashboard/financial-summary-card.tsx
import { FiDollarSign } from 'react-icons/fi';
import Link from 'next/link';

interface FinancialSummaryCardProps {
  totalBalance: number;
  nextPaymentDue: string | null;
  latestPayment: {
    amount: number;
    date: Date;
    method: string;
  } | null;
}

export default function FinancialSummaryCard({
  totalBalance,
  nextPaymentDue,
  latestPayment
}: FinancialSummaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full min-h-[300px]">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-black">Financial Summary</h3>
        </div>
        <Link 
          href="/dashboard/student/finance"
          className="text-sm text-emerald-600 hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Outstanding Balance</p>
            <div className="flex items-center gap-2">
              <FiDollarSign className="text-gray-400" />
              <span className="font-bold text-lg text-pink-600">
                {totalBalance.toLocaleString('en-US', { style: 'currency', currency: 'KES' })}
              </span>
            </div>
          </div>
          {nextPaymentDue && (
            <p className="text-sm text-gray-500 mt-1">
              Due by: {new Date(nextPaymentDue).toLocaleDateString()}
            </p>
          )}
          <Link 
            href="/dashboard/student/finance/payments"
            className="mt-2 inline-block text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Make a Payment
          </Link>
        </div>

        {latestPayment && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500">Last Payment</p>
            <div className="flex justify-between items-center mt-1">
              <span className="font-medium text-pink-600">
                {latestPayment.amount.toLocaleString('en-US', { style: 'currency', currency: 'KES' })}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(latestPayment.date).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Method: {latestPayment.method}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}