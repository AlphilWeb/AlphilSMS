'use client';

import { FiCreditCard, FiCheckCircle } from 'react-icons/fi';

export default function PaymentHistory({ payments }: {
  payments: {
    id: number;
    amount: string;
    paymentMethod: string;
    transactionDate: string;
    referenceNumber: string;
  }[]
}) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No payment history found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => {
        const transactionDate = new Date(payment.transactionDate);
        
        return (
          <div key={payment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
                  {payment.paymentMethod === 'CREDIT_CARD' ? (
                    <FiCreditCard className="w-5 h-5" />
                  ) : (
                    <FiCheckCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">
                    ${parseFloat(payment.amount).toFixed(2)} Payment
                  </h3>
                  <p className="text-sm text-gray-500">
                    {payment.paymentMethod.replace('_', ' ')} • {payment.referenceNumber}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {transactionDate.toLocaleDateString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}