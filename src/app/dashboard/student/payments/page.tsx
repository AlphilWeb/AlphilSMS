import { getStudentFinancialData } from '@/lib/actions/studentPayments.actions';
import StudentDashboardHeader from '@/components/studentDashboardHeader';
import FinancialOverview from '@/components/students/financial-overview';
import InvoicesList from '@/components/students/invoices-list';
import PaymentHistory from '@/components/students/payment-history';
import ErrorMessage from '@/components/ui/error-message';
import Footer from '@/components/footer';

export default async function PaymentsPage() {
  try {
    const financialData = await getStudentFinancialData();

    return (
      <>
        <StudentDashboardHeader />
        
        <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Financial Center</h1>
              <FinancialOverview 
                invoices={financialData.invoices} 
                payments={financialData.payments} 
                programName={financialData.student.programName} 
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Invoices</h2>
                <InvoicesList invoices={financialData.invoices} />
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment History</h2>
                <PaymentHistory payments={financialData.payments} />
              </div>
            </div>
            <Footer />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error('Error rendering PaymentsPage:', error);
    return (
      <>
        <StudentDashboardHeader />
        <main className="md:pl-64 pt-16 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
          <div className="p-6 max-w-7xl mx-auto">
            <ErrorMessage
              title="Failed to load financial data"
              message={error instanceof Error ? error.message : 'There was an error loading your financial information.'}
            />
            <Footer />
          </div>
        </main>
      </>
    );
  }
}