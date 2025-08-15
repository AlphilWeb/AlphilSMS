import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';

interface FinancialSummaryCardProps {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  outstandingAmount: number;
}

export default function FinancialSummaryCard({
  totalRevenue,
  totalExpenses,
  netProfit,
  outstandingAmount
}: FinancialSummaryCardProps) {
  const profitColor = netProfit >= 0 ? 'text-green-600' : 'text-red-600';
  const profitIcon = netProfit >= 0 ? (
    <ArrowUpIcon className="h-5 w-5 text-green-500" />
  ) : (
    <ArrowDownIcon className="h-5 w-5 text-red-500" />
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-xl font-bold text-pink-400">${totalRevenue.toLocaleString()}</p>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-xl font-bold text-red-500">${totalExpenses.toLocaleString()}</p>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-500">Outstanding Fees</p>
          <p className="text-xl font-bold text-yellow-600">${outstandingAmount.toLocaleString()}</p>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-500">Net Profit</p>
          <div className="flex items-center">
            {profitIcon}
            <p className={`text-xl font-bold ml-1 ${profitColor}`}>
              ${Math.abs(netProfit).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}