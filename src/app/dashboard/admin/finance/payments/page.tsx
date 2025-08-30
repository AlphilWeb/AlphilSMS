// app/dashboard/admin/payments/page.tsx
import AdminPaymentsClient from '@/components/admin/admin.payments.client';
import ErrorMessage from '@/components/ui/error-message';

export default async function AdminPaymentsPage() {
  try {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">Payment Management</h1>
          <p className="text-gray-600">View and manage all payment transactions</p>
        </div>

        {/* Main Payments Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <AdminPaymentsClient />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering AdminPaymentsPage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load payments"
          message="There was an error loading payment data. Please try again later."
        />
      </div>
    );
  }
}