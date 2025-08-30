// app/dashboard/bursar/page.tsx
import { getBursarDashboardData } from '@/lib/actions/bursar/dashboard.actions';
import { FiDollarSign, FiCreditCard, FiUsers, FiPieChart, FiFileText } from 'react-icons/fi';
import Card from '@/components/bursar/card';
import RecentPaymentsCard from '@/components/bursar/recent-payments-card';
import OutstandingInvoicesCard from '@/components/bursar/outstanding-invoices-card';
import FinancialSummaryCard from '@/components/bursar/financial-summary-card';
import QuickActions from '@/components/bursar/quick-actions';
import WelcomeBanner from '@/components/bursar/wlecome-banner';
import ErrorMessage from '@/components/ui/error-message';

export default async function BursarDashboard() {
  try {
    const data = await getBursarDashboardData();

    // Defensive helpers
    const firstName =
      typeof data.bursar.name === 'string' && data.bursar.name.length > 0
        ? data.bursar.name.split(' ')[0]
        : 'Bursar';

    const netRevenueChange = data.statistics?.netRevenueChange ?? 0;

    const formattedPayments = data.recentPayments.map(payment => ({
      ...payment,
      id: String(payment.id)
    }));

    return (
      <>
        <WelcomeBanner
          firstName={firstName}
          position={data.bursar.position}
          department={data.bursar.department}
          avatarUrl={'/default-avatar.jpg'}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card
              title="Total Revenue (This Month)"
              value={`$${data.financialSummary.totalRevenue.toLocaleString()}`}
              icon={<FiDollarSign className="w-5 h-5" />}
              link="/dashboard/finacne"
              linkText="View Details"
            />

            <Card
              title="Staff Salaries (This Month)"
              value={`$${data.financialSummary.totalSalaries.toLocaleString()}`}
              icon={<FiUsers className="w-5 h-5" />}
              link="/dashboard/finance"
              linkText="Manage Payroll"
            />
          </div>

          <div className="md:col-span-2">
            <RecentPaymentsCard
              payments={formattedPayments}
              totalCount={data.recentPayments.length}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <OutstandingInvoicesCard
              invoices={data.outstandingInvoices}
              totalAmount={data.financialSummary.totalOutstanding}
            />
          </div>

          <div className="space-y-6">
            <Card
              title="Outstanding Amount"
              value={`$${data.financialSummary.totalOutstanding.toLocaleString()}`}
              icon={<FiCreditCard className="w-5 h-5" />}
              link="/dashboard/finance/invoices"
              linkText="View Invoices"
            />

            <Card
              title="Active Invoices"
              value={data.statistics.totalActiveInvoices.toString()}
              icon={<FiFileText className="w-5 h-5" />}
              link="/dashboard/finance/invoices"
              linkText="Manage"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FinancialSummaryCard
            totalRevenue={data.financialSummary.totalRevenue}
            totalExpenses={data.financialSummary.totalSalaries}
            netProfit={data.financialSummary.netRevenue}
            outstandingAmount={data.financialSummary.totalOutstanding}
          />

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <FiPieChart className="text-blue-600" /> Quick Stats
              </h3>
              <a
                href="/dashboard/finance"
                className="text-sm text-blue-600 hover:underline"
              >
                View All
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500">Students</p>
                <p className="text-xl font-bold text-gray-900">{data.statistics.totalStudents}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500">Staff</p>
                <p className="text-xl font-bold text-gray-900">{data.statistics.totalStaff}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500">Active Invoices</p>
                <p className="text-xl font-bold text-gray-900">{data.statistics.totalActiveInvoices}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500">Net Revenue Δ</p>
                <p className="text-xl font-bold text-gray-900">
                  {`${netRevenueChange.toFixed(1)}%`}
                </p>
              </div>
            </div>
          </div>
        </div>
        <QuickActions />
      </>
    );
  } catch (error) {
    console.error('Error rendering BursarDashboard:', error);
    return (
      <ErrorMessage
        title="Failed to load dashboard"
        message="There was an error loading the bursar dashboard data. Please try again later. If the problem persists, please contact support."
      />
    );
  }
}