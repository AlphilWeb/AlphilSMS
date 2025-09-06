// app/dashboard/admin/invoices/page.tsx
import AdminInvoicesClient from '@/components/admin/admin.invoices.client';
import ErrorMessage from '@/components/ui/error-message';

export default async function AdminInvoicesPage() {
  try {
    return (
      // <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 space-y-6 max-w-7xl mx-auto bg-emerald-800">
          {/* Welcome Banner */}
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-800">Invoice Management</h1>
            <p className="text-gray-600">Manage all financial invoices and payments</p>
          </div>

          {/* Main Invoices Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <AdminInvoicesClient />
          </div>
        </div>
      // </main>
    );
  } catch (error) {
    console.error('Error rendering AdminInvoicesPage:', error);
    return (
      // <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 max-w-7xl mx-auto bg-emerald-800">
          <ErrorMessage
            title="Failed to load invoices"
            message="There was an error loading invoice data. Please try again later."
          />
        </div>
      // </main>
    );
  }
}