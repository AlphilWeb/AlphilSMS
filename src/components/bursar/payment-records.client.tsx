// components/admin/admin.payments.client.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getAllPayments,
  getPaymentDetails,
  createPayment,
  updatePayment,
  deletePayment,

  searchPayments,
  type PaymentWithDetails,
  type PaymentDetails,
//   type PaymentCreateData,
//   type PaymentUpdateData,
} from '@/lib/actions/bursar/payment-records.actions';

import {
  FiDollarSign, FiUser, FiPlus, 
  FiEdit2, FiTrash2, FiLoader, FiX, FiSearch, 
  FiInfo, FiCheck, FiCreditCard
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';

export default function AdminPaymentsClient() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    payments: true,
    details: false,
    create: false,
    update: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    invoiceId: 1,
    studentId: 1,
    amount: 0,
    paymentMethod: 'cash',
    referenceNumber: ''
  });

  // Fetch all payments on component mount and when search changes
  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(prev => ({ ...prev, payments: true }));
        setError(null);
        
        let paymentsData;
        if (searchQuery.trim()) {
          paymentsData = await searchPayments(searchQuery.trim());
        } else {
          paymentsData = await getAllPayments();
        }
        
        setPayments(paymentsData);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load payments');
      } finally {
        setLoading(prev => ({ ...prev, payments: false }));
      }
    };

    loadPayments();
  }, [searchQuery]);

  // Load payment details when selected
  const handleSelectPayment = async (paymentId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      setError(null);
      
      const details = await getPaymentDetails(paymentId);
      setSelectedPayment(details);
      setFormData({
        invoiceId: details.invoice.id,
        studentId: details.student.id,
        amount: details.amount,
        paymentMethod: details.paymentMethod,
        referenceNumber: details.referenceNumber || ''
      });
      setIsViewModalOpen(true);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load payment details');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Create new payment record
  const handleCreatePayment = async () => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      const newPayment = await createPayment({
        invoiceId: formData.invoiceId,
        studentId: formData.studentId,
        amount: formData.amount,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || undefined
      });
      
      setPayments(prev => [...prev, {
        id: newPayment.id,
        amount: Number(newPayment.amount),
        paymentMethod: newPayment.paymentMethod,
        transactionDate: newPayment.transactionDate,
        referenceNumber: newPayment.referenceNumber,
        invoice: {
          id: formData.invoiceId,
          amountDue: 0, // Will be updated when selected
          amountPaid: 0,
          balance: 0,
          status: ''
        },
        student: {
          id: formData.studentId,
          firstName: '', // Will be updated when selected
          lastName: '',
          registrationNumber: ''
        }
      }]);
      
      setIsCreateModalOpen(false);
      setFormData({
        invoiceId: 1,
        studentId: 1,
        amount: 0,
        paymentMethod: 'cash',
        referenceNumber: ''
      });
      setSuccess('Payment record created successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to create payment record');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update payment record
  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);

      await updatePayment(selectedPayment.id, {
        amount: formData.amount,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || null
      });
      
      // Refresh the payment details
      const updatedDetails = await getPaymentDetails(selectedPayment.id);
      setSelectedPayment(updatedDetails);
      
      // Update the payments list
      setPayments(prev => 
        prev.map(payment => 
          payment.id === selectedPayment.id 
            ? { 
                ...payment, 
                amount: updatedDetails.amount,
                paymentMethod: updatedDetails.paymentMethod,
                referenceNumber: updatedDetails.referenceNumber
              } 
            : payment
        )
      );
      
      setIsEditModalOpen(false);
      setSuccess('Payment record updated successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to update payment record');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Delete payment record
  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    if (!confirm('Are you sure you want to delete this payment record?')) return;

    try {
      setError(null);
      await deletePayment(selectedPayment.id);
      
      setPayments(prev => prev.filter(p => p.id !== selectedPayment.id));
      setSelectedPayment(null);
      setIsViewModalOpen(false);
      setSuccess('Payment record deleted successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to delete payment record');
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Payment Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 flex items-center gap-2"
        >
          <FiPlus size={16} /> New Payment
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
          <FiX className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2">
          <FiCheck className="flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Search and Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <div className="text-emerald-500 absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-black pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading.payments ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-6 text-center">
            <FiDollarSign className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No payment records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr 
                    key={payment.id} 
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <FiUser className="text-emerald-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.student.firstName} {payment.student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.student.registrationNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">INV-{payment.invoice.id}</div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(payment.invoice.balance)} remaining
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {payment.paymentMethod}
                      </div>
                      {payment.referenceNumber && (
                        <div className="text-sm text-gray-500">
                          Ref: {payment.referenceNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(payment.transactionDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleSelectPayment(payment.id)}
                        className="text-emerald-600 hover:text-emerald-900 mr-4"
                        title="View Details"
                      >
                        <FiInfo />
                      </button>
                      <button
                        onClick={() => {
                          handleSelectPayment(payment.id);
                          setIsViewModalOpen(false);
                          setIsEditModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={async () => {
                          const fullDetails = await getPaymentDetails(payment.id);
                          setSelectedPayment(fullDetails);
                          handleDeletePayment();
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Payment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> New Payment
              </h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice ID
                </label>
                <input
                  type="number"
                  value={formData.invoiceId}
                  onChange={(e) => setFormData({...formData, invoiceId: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID
                </label>
                <input
                  type="number"
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="Transaction ID, Check #, etc."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePayment}
                disabled={!formData.invoiceId || !formData.studentId || formData.amount <= 0 || !formData.paymentMethod || loading.create}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 KSH{
                  loading.create ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
                } transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed`}
              >
                {loading.create ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    Processing...
                  </>
                ) : (
                  <>
                    <FiCreditCard size={16} />
                    Record Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Payment Details Modal */}
      {isViewModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800">Payment Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <FiDollarSign className="text-emerald-600 text-2xl" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {formatCurrency(selectedPayment.amount)}
                      </h2>
                      <div className="mt-1 text-sm text-gray-500 capitalize">
                        {selectedPayment.paymentMethod} payment
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Transaction Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(selectedPayment.transactionDate)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Invoice</h3>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        INV-{selectedPayment.invoice.id}
                      </p>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <p className="text-xs text-gray-500">Due</p>
                          <p className="text-sm text-gray-900">
                            {formatCurrency(selectedPayment.invoice.amountDue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Paid</p>
                          <p className="text-sm text-gray-900">
                            {formatCurrency(selectedPayment.invoice.amountPaid)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Balance</p>
                          <p className="text-sm text-gray-900">
                            {formatCurrency(selectedPayment.invoice.balance)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-1 text-xs capitalize">
                        Status: <span className={`font-medium KSH{
                          selectedPayment.invoice.status === 'paid' ? 'text-green-600' : 
                          selectedPayment.invoice.status === 'partially_paid' ? 'text-amber-600' : 
                          'text-red-600'
                        }`}>
                          {selectedPayment.invoice.status.replace('_', ' ')}
                        </span>
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Student</h3>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {selectedPayment.student.firstName} {selectedPayment.student.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedPayment.student.registrationNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedPayment.student.email}
                      </p>
                    </div>
                    {selectedPayment.referenceNumber && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Reference Number</h3>
                        <p className="mt-1 text-sm font-mono text-gray-900">
                          {selectedPayment.referenceNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
              >
                <FiEdit2 size={16} />
                Edit Payment
              </button>
              <button
                onClick={handleDeletePayment}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center gap-2"
              >
                <FiTrash2 size={16} />
                Delete Payment
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {isEditModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiEdit2 size={18} /> Edit Payment
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="Transaction ID, Check #, etc."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePayment}
                disabled={loading.update}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 KSH{
                  loading.update ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
                } transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed`}
              >
                {loading.update ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}