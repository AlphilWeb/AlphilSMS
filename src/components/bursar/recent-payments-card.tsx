import Link from 'next/link';

interface Payment {
  id: string;
  studentName: string;
  amount: number;
  date: Date; // Use Date object or ISO string
  method: string;
}

interface RecentPaymentsCardProps {
  payments: Payment[];
  totalCount: number;
}

export default function RecentPaymentsCard({ payments, totalCount }: RecentPaymentsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Payments</h3>
        <Link href="/dashboard/bursar/payments" className="text-sm text-blue-600 hover:underline">
          View All ({totalCount})
        </Link>
      </div>
      
      <div className="space-y-4">
        {payments.length > 0 ? (
          payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-3 border-b border-gray-100">
              <div>
                <p className="font-medium">{payment.studentName}</p>
                <p className="text-sm text-gray-500">{payment.date.toString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">${payment.amount.toLocaleString()}</p>
                <p className="text-sm text-gray-500 capitalize">{payment.method}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No recent payments</p>
        )}
      </div>
    </div>
  );
}