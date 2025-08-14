// components/admin/admin.payments.client.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getAllPayments,
  getPaymentsByStudent,
  getPaymentsByInvoice,
  getPaymentById,
  recordPayment,
  deletePayment,
  getPaymentSummary,
  type PaymentWithDetails,
  type PaymentData,
  type PaymentSummary
} from '@/lib/actions/admin/payments.actions';

import {
  FiDollarSign, FiPlus, FiEdit2, FiTrash2, 
  FiLoader, FiX, FiSearch, FiInfo, 
  FiCheck, FiUser
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Bank Transfer', 'Mobile Money', 'Other'];

export default function AdminPaymentsClient() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);
  const [loading, setLoading] = useState({
    payments: true,
    summary: true,
    details: false,
    create: false,
    update: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'student' | 'invoice'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);

  const [formData, setFormData] = useState<PaymentData>({
    invoiceId: 0,
    studentId: 0,
    amount: '',
    paymentMethod: 'Cash',
    referenceNumber: null
  });

  // Fetch payments and summary on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(prev => ({ ...prev, payments: true, summary: true }));
        setError(null);
        
        const [paymentsData, summaryData] = await Promise.all([
          getAllPayments(),
          getPaymentSummary()
        ]);
        
        setPayments(paymentsData);
        setSummary(summaryData);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load payments');
      } finally {
        setLoading(prev => ({ ...prev, payments: false, summary: false }));
      }
    };

    loadData();
  }, []);

  // Fetch payments based on current view mode
  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(prev => ({ ...prev, payments: true }));
        setError(null);
        
        let paymentsData: PaymentWithDetails[];
        switch (viewMode) {
          case 'student':
            if (!selectedStudent) return;
            paymentsData = await getPaymentsByStudent(selectedStudent);
            break;
          case 'invoice':
            if (!selectedInvoice) return;
            paymentsData = await getPaymentsByInvoice(selectedInvoice);
            break;
          default:
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
  }, [viewMode, selectedStudent, selectedInvoice]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      try {
        setLoading(prev => ({ ...prev, payments: true }));
        const allPayments = await getAllPayments();
        const filteredPayments = allPayments.filter(payment => 
          payment.student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.student.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.amount.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setPayments(filteredPayments);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Search failed');
      } finally {
        setLoading(prev => ({ ...prev, payments: false }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load payment details when selected
  const handleSelectPayment = async (paymentId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      setError(null);
      
      const paymentDetails = await getPaymentById(paymentId);
      if (!paymentDetails) {
        throw new ActionError('Payment not found');
      }
      
      setSelectedPayment(paymentDetails);
      setFormData({
        invoiceId: paymentDetails.invoice.id,
        studentId: paymentDetails.student.id,
        amount: paymentDetails.amount,
        paymentMethod: paymentDetails.paymentMethod,
        referenceNumber: paymentDetails.referenceNumber
      });
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load payment details');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Record new payment
  const handleRecordPayment = async () => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      const newPayment = await recordPayment(formData);
      
      // Update local state with the new payment
      const paymentDetails = await getPaymentById(newPayment.id);
      if (paymentDetails) {
        setPayments(prev => [paymentDetails, ...prev]);
        
        // Update summary stats
        const summaryData = await getPaymentSummary();
        setSummary(summaryData);
      }
      
      setIsCreateModalOpen(false);
      setFormData({
        invoiceId: 0,
        studentId: 0,
        amount: '',
        paymentMethod: 'Cash',
        referenceNumber: null
      });
      setSuccess('Payment recorded successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to record payment');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update payment
  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);

      // const updatedPayment = await updatePayment(selectedPayment.id, formData);
      
      // Update local state with the updated payment
      const paymentDetails = await getPaymentById(selectedPayment.id);
      if (paymentDetails) {
        setPayments(prev => prev.map(p => 
          p.id === selectedPayment.id ? paymentDetails : p
        ));
        setSelectedPayment(paymentDetails);
        
        // Update summary stats
        const summaryData = await getPaymentSummary();
        setSummary(summaryData);
      }
      
      setIsEditModalOpen(false);
      setSuccess('Payment updated successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to update payment');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Delete payment
  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    if (!confirm('Are you sure you want to delete this payment record?')) return;

    try {
      setError(null);
      await deletePayment(selectedPayment.id);
      
      setPayments(prev => prev.filter(p => p.id !== selectedPayment.id));
      setSelectedPayment(null);
      
      // Update summary stats
      const summaryData = await getPaymentSummary();
      setSummary(summaryData);
      
      setSuccess('Payment deleted successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to delete payment');
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

  // Format currency for display
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
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
          <FiPlus size={16} /> Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      {loading.summary ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="animate-pulse space-y-2">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Total Payments</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{summary.totalPayments}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Total Revenue</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">
              {formatCurrency(summary.totalRevenue.toString())}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Payment Methods</div>
            <div className="text-sm text-gray-600 mt-1">
              {summary.paymentMethods.map(method => (
                <div key={method.method} className="flex justify-between">
                  <span>{method.method}:</span>
                  <span>{formatCurrency(method.total.toString())}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setViewMode('all')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'all'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Payments
          </button>
          <button
            onClick={() => setViewMode('student')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'student'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            By Student
          </button>
          <button
            onClick={() => setViewMode('invoice')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'invoice'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            By Invoice
          </button>
        </nav>
      </div>

      {/* Filter Controls */}
      {viewMode === 'student' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
          <select
            value={selectedStudent || ''}
            onChange={(e) => setSelectedStudent(Number(e.target.value))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
          >
            <option value="">Select a student</option>
            {/* In a real app, you would map through students from your data */}
            <option value="1">John Doe (REG12345)</option>
            <option value="2">Jane Smith (REG67890)</option>
          </select>
        </div>
      )}

      {viewMode === 'invoice' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Invoice</label>
          <select
            value={selectedInvoice || ''}
            onChange={(e) => setSelectedInvoice(Number(e.target.value))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md text-black"
          >
            <option value="">Select an invoice</option>
            {/* In a real app, you would map through invoices from your data */}
            <option value="1">INV-2023-001</option>
            <option value="2">INV-2023-002</option>
          </select>
        </div>
      )}

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

      <div className="grid grid-cols-1 gap-8">
        {/* Search and Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
              <p className="text-gray-500">No payments found</p>
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
                      Payment Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
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
                        <div className="text-sm text-gray-900">
                          INV-{payment.invoice.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.invoice.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
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
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
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
      </div>

      {/* Create Payment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> Record Payment
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
                  onChange={(e) => setFormData({...formData, invoiceId: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="12345"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID
                </label>
                <input
                  type="number"
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="12345"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="0.00"
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
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.referenceNumber || ''}
                  onChange={(e) => setFormData({...formData, referenceNumber: e.target.value || null})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="Transaction ID or Receipt Number"
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
                onClick={handleRecordPayment}
                disabled={!formData.invoiceId || !formData.studentId || !formData.amount || loading.create}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 ${
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
                    <FiDollarSign size={16} />
                    Record Payment
                  </>
                )}
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
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700">Student</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedPayment.student.firstName} {selectedPayment.student.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedPayment.student.registrationNumber}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700">Invoice</h3>
                <p className="mt-1 text-sm text-gray-900">
                  INV-{selectedPayment.invoice.id}
                </p>
                <p className="text-sm text-gray-500">
                  Status: {selectedPayment.invoice.status}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
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
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.referenceNumber || ''}
                  onChange={(e) => setFormData({...formData, referenceNumber: e.target.value || null})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
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
                className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 ${
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