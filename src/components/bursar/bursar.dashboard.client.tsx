'use client';

import { useEffect, useState } from 'react';
import { BursarDashboardData, FinancialPayment, FinancialReportData, FinancialSalary, getBursarDashboardData, getFinancialReport, OutstandingInvoice, RecentPayment, SalaryPayment } from '@/lib/actions/bursar/dashboard.actions';
import { format } from 'date-fns';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiClock, FiAlertCircle } from 'react-icons/fi';
import { FaMoneyBillWave, FaReceipt } from 'react-icons/fa';
import { MdOutlineAttachMoney } from 'react-icons/md';
import { toast } from 'sonner';

export default function BursarDashboard() {
  const [data, setData] = useState<BursarDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getBursarDashboardData();

        // Create a new object to transform the 'email' property
        const transformedResult = {
          ...result,
          bursar: {
            ...result.bursar,
            email: result.bursar.email ?? null,
          },
        };

        setData(transformedResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const generateReport = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      setReportLoading(true);
      const result = await getFinancialReport(dateRange.from, dateRange.to);
      setReportData(result);
      toast.success(`Financial report for ${format(dateRange.from, 'MMM d, yyyy')} to ${format(dateRange.to, 'MMM d, yyyy')}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      toast.error('Failed to generate financial report');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <FiAlertCircle className="mx-auto h-12 w-12 text-pink-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Custom Card Component
  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {children}
    </div>
  );

  const CardHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="border-b border-gray-200 px-6 py-4 flex items-center">
      <h3 className="font-semibold text-gray-800">{children}</h3>
    </div>
  );

  const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-6 ${className}`}>{children}</div>
  );

  const CardFooter = ({ children }: { children: React.ReactNode }) => (
    <div className="border-t border-gray-200 px-6 py-4 flex justify-center">
      {children}
    </div>
  );

  // Custom Badge Component
  const Badge = ({ 
    children, 
    variant = 'default',
    className = ''
  }: { 
    children: React.ReactNode; 
    variant?: 'default' | 'destructive' | 'outline';
    className?: string;
  }) => {
    const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    const variantClasses = {
      default: 'bg-gray-100 text-gray-800',
      destructive: 'bg-red-100 text-red-800',
      outline: 'border border-gray-200 bg-transparent'
    };

    return (
      <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
        {children}
      </span>
    );
  };

  // Custom Button Component
  const Button = ({
    children,
    onClick,
    disabled = false,
    variant = 'default',
    className = ''
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'default' | 'ghost' | 'outline';
    className?: string;
  }) => {
    const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500';
    const variantClasses = {
      default: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      ghost: 'bg-transparent hover:bg-gray-100 text-emerald-600',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700'
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        {children}
      </button>
    );
  };

  // Custom Table Components
  const Table = ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">{children}</table>
    </div>
  );

  const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-gray-50">{children}</thead>
  );

  const TableRow = ({ children }: { children: React.ReactNode }) => (
    <tr>{children}</tr>
  );

  const TableHead = ({ children }: { children: React.ReactNode }) => (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  );

  const TableBody = ({ children }: { children: React.ReactNode }) => (
    <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
  );

  const TableCell = ({ 
    children, 
    className = '' 
  }: { 
    children: React.ReactNode; 
    className?: string;
  }) => (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );

  // Date Range Picker (simplified version)
  const DateRangePicker = () => {
    return (
      <div className="flex items-center space-x-2">
        <div className="relative">
          <input
            type="date"
            value={dateRange.from?.toISOString().split('T')[0] || ''}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value ? new Date(e.target.value) : undefined })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          />
        </div>
        <span className="text-gray-500">to</span>
        <div className="relative">
          <input
            type="date"
            value={dateRange.to?.toISOString().split('T')[0] || ''}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value ? new Date(e.target.value) : undefined })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Bursar Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Welcome, <span className="font-semibold text-emerald-600">{data.bursar.name}</span>
          </span>
          <Badge className="bg-pink-100 text-pink-600">{data.bursar.position}</Badge>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">KES {data.financialSummary.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                {data.statistics.revenueChange >= 0 ? (
                  <FiTrendingUp className="text-emerald-500 mr-1" />
                ) : (
                  <FiTrendingDown className="text-pink-500 mr-1" />
                )}
                {Math.abs(data.statistics.revenueChange).toFixed(1)}% from last month
              </p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-500">
              <FiDollarSign className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Outstanding Balances</p>
              <p className="text-2xl font-bold">KES {data.financialSummary.totalOutstanding.toLocaleString()}</p>
              <p className="text-xs text-gray-500">
                {data.statistics.totalActiveInvoices} active invoices
              </p>
            </div>
            <div className="p-3 rounded-full bg-pink-100 text-pink-500">
              <FiAlertCircle className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Salary Payments</p>
              <p className="text-2xl font-bold">KES {data.financialSummary.totalSalaries.toLocaleString()}</p>
              <p className="text-xs text-gray-500">
                {data.statistics.totalStaff} staff members
              </p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-500">
              <FaMoneyBillWave className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Net Revenue</p>
              <p className="text-2xl font-bold">KES {data.financialSummary.netRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                {data.statistics.netRevenueChange >= 0 ? (
                  <FiTrendingUp className="text-emerald-500 mr-1" />
                ) : (
                  <FiTrendingDown className="text-pink-500 mr-1" />
                )}
                {Math.abs(data.statistics.netRevenueChange).toFixed(1)}% from last month
              </p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-500">
              <MdOutlineAttachMoney className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>Revenue Trend (Last 6 Months)</CardHeader>
          <CardContent>
            <div className="h-80">
              <div className="h-full w-full bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-500">Monthly Revenue</h4>
                </div>
                <div className="h-64">
                  {/* Simple chart using divs since we don't have Recharts */}
                  <div className="h-full flex items-end space-x-2">
                    {data.financialTrend.revenue.map((amount: number, index: number) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-emerald-500 rounded-t-sm hover:bg-emerald-600 transition-colors"
                          style={{ height: `${Math.min(100, (amount / Math.max(...data.financialTrend.revenue)) * 100)}%` }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-1">
                          {data.financialTrend.months[index].split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>Recent Payments</CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentPayments.map((payment: RecentPayment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.studentName}</TableCell>
                    <TableCell>KES {payment.amount.toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(payment.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-emerald-100 text-emerald-600">
                        {payment.method}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700">
              View All Payments
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Outstanding Invoices and Salary Payments */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Outstanding Invoices */}
        <Card>
          <CardHeader>Outstanding Invoices</CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.outstandingInvoices.map((invoice: OutstandingInvoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.studentName}</TableCell>
                    <TableCell>{invoice.programName}</TableCell>
                    <TableCell className="text-pink-500 font-medium">
                      KES {invoice.amountDue.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <FiClock className="mr-1 h-3 w-3 text-gray-500" />
                        {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="text-pink-600 hover:text-pink-700">
              View All Outstanding
            </Button>
          </CardFooter>
        </Card>

        {/* Recent Salary Payments */}
        <Card>
          <CardHeader>Recent Salary Payments</CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentSalaryPayments.map((payment: SalaryPayment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.staffName}</TableCell>
                    <TableCell>KES {payment.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={payment.status === 'Paid' ? 'default' : 'destructive'}
                        className={payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : ''}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(payment.paymentDate), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700">
              View All Salaries
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Financial Report Generator */}
      <Card>
        <CardHeader>Generate Financial Report</CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <DateRangePicker />
              <Button 
                onClick={generateReport}
                disabled={reportLoading || !dateRange?.from || !dateRange?.to}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {reportLoading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
            
            {reportData && (
              <div className="mt-4 space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                    <p className="text-sm font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      KES {reportData.summary.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-emerald-500 mt-1">
                      {reportData.summary.paymentCount} payments
                    </p>
                  </div>

                  <div className="bg-pink-50 border border-pink-100 rounded-lg p-4">
                    <p className="text-sm font-medium">Total Salaries</p>
                    <p className="text-2xl font-bold text-pink-600">
                      KES {reportData.summary.totalSalaries.toLocaleString()}
                    </p>
                    <p className="text-xs text-pink-500 mt-1">
                      {reportData.summary.salaryPaymentCount} payments
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium">Net Revenue</p>
                    <p className="text-2xl font-bold text-gray-800">
                      KES {reportData.summary.netRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Revenue - Salaries
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader >
                      <FaReceipt className="mr-2 h-4 w-4 text-emerald-500" />
                      Payment Details
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.payments.map((payment: FinancialPayment) => (
                            <TableRow key={payment.id}>
                              <TableCell>{format(new Date(payment.date || ''), 'MMM d')}</TableCell>
                              <TableCell className="font-medium">{payment.studentName}</TableCell>
                              <TableCell>KES {payment.amount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-emerald-100 text-emerald-600">
                                  {payment.method}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader >
                      <FaMoneyBillWave className="mr-2 h-4 w-4 text-pink-500" />
                      Salary Payments
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Staff</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.salaries.map((salary: FinancialSalary) => (
                            <TableRow key={salary.id}>
                              <TableCell>{format(new Date(salary.date || ''), 'MMM d')}</TableCell>
                              <TableCell className="font-medium">{salary.staffName}</TableCell>
                              <TableCell>KES {salary.amount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={salary.status === 'Paid' ? 'default' : 'destructive'}
                                  className={salary.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : ''}
                                >
                                  {salary.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}