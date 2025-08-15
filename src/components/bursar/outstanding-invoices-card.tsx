import Link from 'next/link';

interface OutstandingInvoice {
  id: number;
  studentName: string;
  programName: string;
  semesterName: string;
  amountDue: number; // Matches amountDue from the action file
  dueDate: Date;     // Matches the Date object from the action file
  status: 'overdue' | 'pending';
}

interface OutstandingInvoicesCardProps {
  invoices: OutstandingInvoice[]; // Use the new interface here
  totalAmount: number;
}

export default function OutstandingInvoicesCard({ 
  invoices, 
  totalAmount 
}: OutstandingInvoicesCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-pink-500">
          Outstanding Invoices
          <span className="ml-2 text-red-600">${totalAmount.toLocaleString()}</span>
        </h3>
        <Link href="/dashboard/bursar/invoices" className="text-sm text-blue-600 hover:underline">
          View All
        </Link>
      </div>
      
      <div className="space-y-3">
        {invoices.length > 0 ? (
          invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium">{invoice.studentName}</p>
                <p className="text-sm text-gray-500">Due: {invoice.dueDate.toDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">${invoice.amountDue.toLocaleString()}</p>
                <p className={`text-sm ${
                  invoice.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {invoice.status === 'overdue' ? 'Overdue' : 'Pending'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No outstanding invoices</p>
        )}
      </div>
    </div>
  );
}