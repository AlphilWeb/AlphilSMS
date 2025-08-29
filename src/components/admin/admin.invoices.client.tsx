// components/admin/admin.invoices.client.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  getAllPayments,
  getFinancialSummary,
  getOverdueInvoices,
  type InvoiceWithDetails,
  type PaymentWithDetails,
  type InvoiceData,
  type PaymentData,
  recordPayment
} from '@/lib/actions/admin/invoices.actions';

// Add these imports for fetching students, semesters, and fee structures
import { getAllStudents } from '@/lib/actions/admin/students.action';
import { getAllSemesters } from '@/lib/actions/admin/semesters.action';
import { getAllFeeStructures } from '@/lib/actions/admin/fee-structures.actions';

// Add PDF generation imports
import { generateReceiptPdf, generateInvoiceListPdf, generatePaymentListPdf } from '@/lib/actions/pdf-generataion/pdf-generation.actions';
import { ActionError } from '@/lib/utils';

import {
  FiDollarSign, FiUser, FiPlus, 
  FiEdit2, FiLoader, FiX,
  FiSearch, FiInfo, FiCheck, FiCreditCard,
  FiAlertTriangle, FiTrendingUp, FiTrendingDown,
  FiFileText // Added document icons
} from 'react-icons/fi';
import { format } from 'date-fns';

interface StudentType {
  id: number;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  email: string;
}

interface SemesterType {
  id: number;
  name: string;
}

interface FeeStructureType {
  id: number;
  totalAmount?: number;
  description?: string | null;
  program?: {
    id: number;
    name: string;
  };
  semester?: {
    id: number;
    name: string;
  };
}

export default function AdminInvoicesClient() {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<InvoiceWithDetails[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);
  const [financialSummary, setFinancialSummary] = useState({
    totalRevenue: 0,
    outstandingBalance: 0,
    paidAmount: 0
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    invoices: true,
    payments: false,
    summary: false,
    overdue: false,
    details: false,
    create: false,
    update: false,
    payment: false,
    students: false,
    semesters: false,
    feeStructures: false,
    generating: false // Added for document generation
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'overdue'>('invoices');

  // New state for dropdown data
  const [students, setStudents] = useState<StudentType[]>([]);
  const [semesters, setSemesters] = useState<SemesterType[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructureType[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentType[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const studentDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
        setShowStudentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isCreateModalOpen) {
      setStudentSearch('');
      setSelectedStudentName('');
      setInvoiceFormData({
        studentId: 0,
        semesterId: 0,
        feeStructureId: 0,
        amountDue: '',
        dueDate: '',
        status: 'unpaid'
      });
    }
  }, [isCreateModalOpen]);

  const [invoiceFormData, setInvoiceFormData] = useState<Partial<InvoiceData>>({
    studentId: 0,
    semesterId: 0,
    feeStructureId: 0,
    amountDue: '',
    dueDate: '',
    status: 'unpaid'
  });

  const [paymentFormData, setPaymentFormData] = useState<Partial<PaymentData>>({
    invoiceId: 0,
    studentId: 0,
    amount: '',
    paymentMethod: 'credit_card',
    referenceNumber: ''
  });

  // Fetch initial data including dropdown options
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(prev => ({ 
          ...prev, 
          invoices: true, 
          summary: true, 
          overdue: true,
          students: true,
          semesters: true,
          feeStructures: true
        }));
        setError(null);
        
        const [
          invoicesData, 
          summaryData, 
          overdueData,
          studentsData,
          semestersData,
          feeStructuresData
        ] = await Promise.all([
          getAllInvoices(),
          getFinancialSummary(),
          getOverdueInvoices(),
          getAllStudents(),
          getAllSemesters(),
          getAllFeeStructures()
        ]);
        
        setInvoices(invoicesData);
        setFinancialSummary(summaryData);
        setOverdueInvoices(overdueData);
        setStudents(studentsData);
        setFilteredStudents(studentsData);
        setSemesters(semestersData);
        setFeeStructures(feeStructuresData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(prev => ({ 
          ...prev, 
          invoices: false, 
          summary: false,
          overdue: false,
          students: false,
          semesters: false,
          feeStructures: false
        }));
      }
    };

    loadData();
  }, []);

  // Filter students based on search
  useEffect(() => {
    if (!studentSearch.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => 
      student.firstName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.lastName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.registrationNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.email.toLowerCase().includes(studentSearch.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [studentSearch, students]);

  // Load payments when tab changes
  useEffect(() => {
    if (activeTab === 'payments' && payments.length === 0) {
      const loadPayments = async () => {
        try {
          setLoading(prev => ({ ...prev, payments: true }));
          const paymentsData = await getAllPayments();
          setPayments(paymentsData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load payments');
        } finally {
          setLoading(prev => ({ ...prev, payments: false }));
        }
      };
      
      loadPayments();
    }
  }, [activeTab, payments.length]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      try {
        setLoading(prev => ({ ...prev, invoices: true }));
        const allInvoices = await getAllInvoices();
        const filtered = allInvoices.filter(invoice => 
          invoice.student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          invoice.student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          invoice.student.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          invoice.status.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setInvoices(filtered);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(prev => ({ ...prev, invoices: false }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle fee structure selection to auto-fill amount
  useEffect(() => {
    if (invoiceFormData.feeStructureId && feeStructures.length > 0) {
      const selectedFeeStructure = feeStructures.find(
        fs => fs.id === invoiceFormData.feeStructureId
      );
      if (selectedFeeStructure) {
        setInvoiceFormData(prev => ({
          ...prev,
          amountDue: selectedFeeStructure.totalAmount!.toString()
        }));
      }
    }
  }, [invoiceFormData.feeStructureId, feeStructures]);

  // Load invoice details when selected
  const handleSelectInvoice = async (invoiceId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      setError(null);
      
      const details = await getInvoiceById(invoiceId);
      if (details) {
        setSelectedInvoice(details);
        setInvoiceFormData({
          studentId: details.student.id,
          semesterId: details.semester.id,
          amountDue: details.amountDue,
          amountPaid: details.amountPaid,
          balance: details.balance,
          dueDate: format(new Date(details.dueDate), 'yyyy-MM-dd'),
          status: details.status,
          feeStructureId: details.feeStructure?.id || 0
        });
        setIsViewModalOpen(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice details');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Create new invoice
  const handleCreateInvoice = async () => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      if (!invoiceFormData.studentId || !invoiceFormData.semesterId || 
          !invoiceFormData.amountDue || !invoiceFormData.dueDate) {
        throw new Error('Missing required fields');
      }

      const newInvoice = await createInvoice({
        studentId: invoiceFormData.studentId,
        semesterId: invoiceFormData.semesterId,
        amountDue: invoiceFormData.amountDue,
        dueDate: invoiceFormData.dueDate,
        status: invoiceFormData.status || 'unpaid',
        feeStructureId: invoiceFormData.feeStructureId || null
      });
      
      setInvoices(prev => [
        ...prev,
        {
          ...newInvoice,
          student:
            students.find(s => s.id === invoiceFormData.studentId) || {
              id: invoiceFormData.studentId!,
              firstName: '',
              lastName: '',
              registrationNumber: ''
            },
          semester:
            semesters.find(s => s.id === invoiceFormData.semesterId) || {
              id: invoiceFormData.semesterId!,
              name: ''
            },
          feeStructure: invoiceFormData.feeStructureId
            ? (() => {
                const found = feeStructures.find(
                  fs => fs.id === invoiceFormData.feeStructureId
                );
                if (found) {
                  return {
                    ...found,
                    totalAmount: String(found.totalAmount ?? '0'),
                    program: found.program || { id: 0, name: '' }
                  };
                }
                return {
                  id: invoiceFormData.feeStructureId,
                  totalAmount: String(invoiceFormData.amountDue ?? '0'),
                  description: null,
                  program: {
                    id: 0,
                    name: ''
                  }
                };
              })()
            : null,
          payments: [],
          amountDue: String(invoiceFormData.amountDue ?? '0'),
          amountPaid: '0',
          balance: String(invoiceFormData.amountDue ?? '0'),
          issuedDate: new Date(),
          dueDate: new Date(invoiceFormData.dueDate!)
        }
      ]);
      
      setIsCreateModalOpen(false);
      setInvoiceFormData({
        studentId: 0,
        semesterId: 0,
        feeStructureId: 0,
        amountDue: '',
        dueDate: '',
        status: 'unpaid'
      });
      setStudentSearch('');
      setSuccess('Invoice created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update invoice
  const handleUpdateInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);

      const updatedInvoice = await updateInvoice(selectedInvoice.id, {
        ...invoiceFormData,
        amountDue: invoiceFormData.amountDue || selectedInvoice.amountDue,
        dueDate: invoiceFormData.dueDate || format(selectedInvoice.dueDate, 'yyyy-MM-dd'),
        status: invoiceFormData.status || selectedInvoice.status
      });
      
      setInvoices(prev => prev.map(invoice => 
        invoice.id === selectedInvoice.id 
          ? { 
              ...invoice, 
              ...updatedInvoice,
              amountDue: updatedInvoice.amountDue,
              amountPaid: updatedInvoice.amountPaid,
              balance: updatedInvoice.balance,
              status: updatedInvoice.status,
              dueDate: new Date(updatedInvoice.dueDate)
            } 
          : invoice
      ));
      
      setSelectedInvoice(prev => prev ? { 
        ...prev, 
        ...updatedInvoice,
        amountDue: updatedInvoice.amountDue,
        amountPaid: updatedInvoice.amountPaid,
        balance: updatedInvoice.balance,
        status: updatedInvoice.status,
        dueDate: new Date(updatedInvoice.dueDate)
      } : null);
      
      setIsEditModalOpen(false);
      setSuccess('Invoice updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update invoice');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Record payment
  const handleRecordPayment = async () => {
    if (!paymentFormData.invoiceId || !paymentFormData.amount || !paymentFormData.paymentMethod) {
      setError('Amount and payment method are required');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, payment: true }));
      setError(null);

      const newPayment = await recordPayment({
        invoiceId: paymentFormData.invoiceId!,
        studentId: paymentFormData.studentId!,
        amount: paymentFormData.amount,
        paymentMethod: paymentFormData.paymentMethod,
        referenceNumber: paymentFormData.referenceNumber ?? '',
      });
      
      // Update payments list immediately
      if (newPayment) {
        setPayments(prev => [...prev, newPayment]);
      }

      // Update invoices list
      const updatedInvoices = await getAllInvoices();
      setInvoices(updatedInvoices);

      // Update overdue invoices
      const updatedOverdue = await getOverdueInvoices();
      setOverdueInvoices(updatedOverdue);

      // Update financial summary
      const updatedSummary = await getFinancialSummary();
      setFinancialSummary(updatedSummary);

      setIsPaymentModalOpen(false);
      setPaymentFormData({
        invoiceId: 0,
        studentId: 0,
        amount: '',
        paymentMethod: 'credit_card',
        referenceNumber: ''
      });
      setSuccess('Payment recorded successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setLoading(prev => ({ ...prev, payment: false }));
    }
  };

  // NEW: Generate PDF based on active tab
  const generatePdf = async (type: 'receipt' | 'invoice' | 'payment', id?: number) => {
    try {
      setLoading(prev => ({ ...prev, generating: true }));
      setError(null);
      setSuccess(null);

      let pdfBuffer: Buffer;
      
      switch (type) {
        case 'receipt':
          if (!id) {
            throw new ActionError('Payment ID is required for receipt generation');
          }
          pdfBuffer = await generateReceiptPdf(id);
          break;
          
        case 'invoice':
          if (id) {
            // Generate single invoice
            const invoice = await getInvoiceById(id);
            if (!invoice) {
              throw new ActionError('Invoice not found');
            }
            pdfBuffer = await generateInvoiceListPdf({
              // invoiceId: id,
              studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
            });
          } else {
            // Generate all invoices based on current filters
            pdfBuffer = await generateInvoiceListPdf({
              studentName: searchQuery || undefined,
            });
          }
          break;
          
        case 'payment':
          if (id) {
            // Generate single payment receipt
            pdfBuffer = await generateReceiptPdf(id);
          } else {
            // Generate payment list
            pdfBuffer = await generatePaymentListPdf({
              studentName: searchQuery || undefined,
            });
          }
          break;
          
        default:
          throw new ActionError('Invalid document type');
      }
      
      // Create a blob and download the PDF
      const uint8Array = new Uint8Array(pdfBuffer);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Set appropriate filename
      if (type === 'receipt') {
        a.download = `payment_receipt_${id}.pdf`;
      } else if (type === 'invoice') {
        a.download = id ? `invoice_${id}.pdf` : 'invoices_report.pdf';
      } else if (type === 'payment') {
        a.download = id ? `payment_receipt_${id}.pdf` : 'payments_report.pdf';
      }
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Document generated successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to generate document');
    } finally {
      setLoading(prev => ({ ...prev, generating: false }));
    }
  };

  // Format currency
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const statusClasses = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Financial Management</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 flex items-center gap-2"
          >
            <FiPlus size={16} /> New Invoice
          </button>
          {/* Add Generate Report Button */}
          <button
            onClick={() => generatePdf(activeTab === 'payments' ? 'payment' : 'invoice')}
            disabled={loading.generating}
            className={`px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2 ${
              loading.generating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading.generating ? (
              <>
                <FiLoader className="animate-spin" size={16} />
                Generating...
              </>
            ) : (
              <>
                <FiFileText size={16} />
                Generate {activeTab === 'payments' ? 'Payments' : 'Invoices'} Report
              </>
            )}
          </button>
        </div>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {formatCurrency(financialSummary.totalRevenue.toString())}
              </p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
              <FiTrendingUp size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Outstanding Balance</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {formatCurrency(financialSummary.outstandingBalance.toString())}
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <FiTrendingDown size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue Invoices</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {overdueInvoices.length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <FiAlertTriangle size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'invoices' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Invoices
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'payments' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Payments
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overdue' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Overdue
          </button>
        </nav>
      </div>

      {/* Search and Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <div className="text-black absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-black pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading.invoices || loading.payments || loading.overdue ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : activeTab === 'invoices' && invoices.length === 0 ? (
          <div className="p-6 text-center">
            <FiDollarSign className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No invoices found</p>
          </div>
        ) : activeTab === 'payments' && payments.length === 0 ? (
          <div className="p-6 text-center">
            <FiCreditCard className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No payments found</p>
          </div>
        ) : activeTab === 'overdue' && overdueInvoices.length === 0 ? (
          <div className="p-6 text-center">
            <FiAlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No overdue invoices</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {activeTab === 'invoices' && (
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                )}
                {activeTab === 'payments' && (
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
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
                )}
                {activeTab === 'overdue' && (
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Due
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overdue Since
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeTab === 'invoices' && invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <FiUser className="text-emerald-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.student.firstName} {invoice.student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.student.registrationNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(invoice.amountDue)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Paid: {formatCurrency(invoice.amountPaid)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Due {formatDate(invoice.dueDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Issued {formatDate(invoice.issuedDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => generatePdf('invoice', invoice.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Generate Invoice PDF"
                      >
                        <FiFileText />
                      </button>
                      <button
                        onClick={() => handleSelectInvoice(invoice.id)}
                        className="text-emerald-600 hover:text-emerald-900 mr-4"
                        title="View Details"
                      >
                        <FiInfo />
                      </button>
                      <button
                        onClick={() => {
                          handleSelectInvoice(invoice.id);
                          setIsViewModalOpen(false);
                          setIsEditModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setPaymentFormData({
                            invoiceId: invoice.id,
                            studentId: invoice.student.id,
                            amount: invoice.balance,
                            paymentMethod: 'credit_card',
                            referenceNumber: ''
                          });
                          setIsPaymentModalOpen(true);
                        }}
                        className="text-green-600 hover:text-green-900 mr-4"
                        title="Record Payment"
                      >
                        <FiCreditCard />
                      </button>
                    </td>
                  </tr>
                ))}
                {activeTab === 'payments' && payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
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
                            Invoice #{payment.invoice.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {payment.paymentMethod.replace('_', ' ')}
                      </div>
                      {payment.referenceNumber && (
                        <div className="text-sm text-gray-500">
                          Ref: {payment.referenceNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(new Date(payment.transactionDate))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => generatePdf('receipt', payment.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Generate Receipt"
                      >
                        <FiFileText />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsViewModalOpen(true);
                        }}
                        className="text-emerald-600 hover:text-emerald-900 mr-4"
                        title="View Details"
                      >
                        <FiInfo />
                      </button>
                    </td>
                  </tr>
                ))}
                {activeTab === 'overdue' && overdueInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <FiUser className="text-emerald-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.student.firstName} {invoice.student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.student.registrationNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(invoice.amountDue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(invoice.dueDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.floor((new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))} days overdue
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-red-600">
                        {formatCurrency(invoice.balance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => generatePdf('invoice', invoice.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Generate Invoice PDF"
                      >
                        <FiFileText />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setPaymentFormData({
                            invoiceId: invoice.id,
                            studentId: invoice.student.id,
                            amount: invoice.balance,
                            paymentMethod: 'credit_card',
                            referenceNumber: ''
                          });
                          setIsPaymentModalOpen(true);
                        }}
                        className="text-green-600 hover:text-green-900 mr-4"
                        title="Record Payment"
                      >
                        <FiCreditCard />
                      </button>
                      <button
                        onClick={() => handleSelectInvoice(invoice.id)}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="View Details"
                      >
                        <FiInfo />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-6 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> Create New Invoice
              </h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Student Search and Select */}
  <div className="relative" ref={studentDropdownRef}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Student *
    </label>
    <div className="relative">
      <input
        type="text"
        placeholder={selectedStudentName || "Search students..."}
        value={studentSearch}
        onChange={(e) => {
          setStudentSearch(e.target.value);
          setShowStudentDropdown(true);
        }}
        onFocus={() => setShowStudentDropdown(true)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
      />
      {selectedStudentName && (
        <button
          type="button"
          onClick={() => {
            setStudentSearch('');
            setSelectedStudentName('');
            setInvoiceFormData(prev => ({ ...prev, studentId: 0 }));
          }}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        >
          <FiX size={16} />
        </button>
      )}
    </div>
    
    {/* Student Dropdown */}
    {showStudentDropdown && filteredStudents.length > 0 && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
        {filteredStudents.map(student => (
          <div
            key={student.id}
            className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0"
            onClick={() => {
              setInvoiceFormData(prev => ({ ...prev, studentId: student.id }));
              setSelectedStudentName(`${student.firstName} ${student.lastName} (${student.registrationNumber})`);
              setStudentSearch('');
              setShowStudentDropdown(false);
            }}
          >
            <div className="font-medium">{student.firstName} {student.lastName}</div>
            <div className="text-gray-500 text-xs">{student.registrationNumber} • {student.email}</div>
          </div>
        ))}
      </div>
    )}

    {/* Show selected student */}
    {selectedStudentName && (
      <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-md">
        <div className="text-sm font-medium text-emerald-800">Selected:</div>
        <div className="text-sm text-emerald-600">{selectedStudentName}</div>
      </div>
    )}
  </div>

              {/* Semester Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <select
                  value={invoiceFormData.semesterId || ''}
                  onChange={(e) => setInvoiceFormData({...invoiceFormData, semesterId: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  <option value="">Select a semester</option>
                  {semesters.map(semester => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fee Structure Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fee Structure (Optional)
                </label>
                <select
                  value={invoiceFormData.feeStructureId || ''}
                  onChange={(e) => setInvoiceFormData({...invoiceFormData, feeStructureId: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  <option value="">Select a fee structure</option>
                  {feeStructures.map(feeStructure => (
                    <option key={feeStructure.id} value={feeStructure.id}>
                      {feeStructure.program?.name} - {feeStructure.semester?.name} - {formatCurrency(feeStructure.totalAmount ?? 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Due
                </label>
                <input
                  type="text"
                  value={invoiceFormData.amountDue || ''}
                  onChange={(e) => setInvoiceFormData({...invoiceFormData, amountDue: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="1000.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={invoiceFormData.dueDate || ''}
                  onChange={(e) => setInvoiceFormData({...invoiceFormData, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={invoiceFormData.status || 'unpaid'}
                  onChange={(e) => setInvoiceFormData({...invoiceFormData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white z-10">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={!invoiceFormData.studentId || !invoiceFormData.semesterId || 
                         !invoiceFormData.amountDue || !invoiceFormData.dueDate || loading.create}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 ${
                  loading.create ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
                } transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed`}
              >
                {loading.create ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    Creating...
                  </>
                ) : (
                  <>
                    <FiPlus size={16} />
                    Create Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice/Details Modal */}
      {(isViewModalOpen && selectedInvoice) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedPayment ? 'Payment Details' : 'Invoice Details'}
              </h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {selectedPayment ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                      <FiCreditCard className="text-emerald-600 text-2xl" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-800">
                        Payment #{selectedPayment.id}
                      </h2>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                          <p className="mt-1 text-lg font-semibold text-gray-900">
                            {formatCurrency(selectedPayment.amount)}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
                          <p className="mt-1 text-sm text-gray-900 capitalize">
                            {selectedPayment.paymentMethod.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Transaction Date</h3>
                          <p className="mt-1 text-sm text-gray-900">
                            {formatDate(new Date(selectedPayment.transactionDate))}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Reference Number</h3>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedPayment.referenceNumber || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Student</h3>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedPayment.student.firstName} {selectedPayment.student.lastName}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Invoice</h3>
                          <p className="mt-1 text-sm text-gray-900">
                            #{selectedPayment.invoice.id} (Balance: {formatCurrency(selectedPayment.invoice.balance)})
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <FiDollarSign className="text-emerald-600 text-2xl" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800">
                      Invoice #{selectedInvoice.id}
                    </h2>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Student</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedInvoice.student.firstName} {selectedInvoice.student.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedInvoice.student.registrationNumber}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Semester</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedInvoice.semester.name}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Amount Due</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatCurrency(selectedInvoice.amountDue)}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Amount Paid</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatCurrency(selectedInvoice.amountPaid)}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Balance</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatCurrency(selectedInvoice.balance)}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Status</h3>
                        <p className="mt-1">
                          <StatusBadge status={selectedInvoice.status} />
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Issued Date</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDate(selectedInvoice.issuedDate)}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDate(selectedInvoice.dueDate)}
                        </p>
                      </div>
                      {selectedInvoice.feeStructure && (
                        <>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Fee Structure</h3>
                            <p className="mt-1 text-sm text-gray-900">
                              {selectedInvoice.feeStructure.description || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {selectedInvoice.feeStructure.program.name}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                            <p className="mt-1 text-sm text-gray-900">
                              {formatCurrency(selectedInvoice.feeStructure.totalAmount)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payments Section */}
              {selectedInvoice && !selectedPayment && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FiCreditCard /> Payments
                  </h3>
                  {selectedInvoice.payments.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                      No payments recorded for this invoice
                    </div>
                  ) : (
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Method
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reference
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedInvoice.payments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatCurrency(payment.amount)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 capitalize">
                                  {payment.paymentMethod.replace('_', ' ')}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDate(payment.transactionDate)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {payment.referenceNumber || 'N/A'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              {selectedInvoice && !selectedPayment && (
                <>
                  <button
                    onClick={() => {
                      setPaymentFormData({
                        invoiceId: selectedInvoice.id,
                        studentId: selectedInvoice.student.id,
                        amount: selectedInvoice.balance,
                        paymentMethod: 'credit_card',
                        referenceNumber: ''
                      });
                      setIsViewModalOpen(false);
                      setIsPaymentModalOpen(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md flex items-center gap-2"
                  >
                    <FiCreditCard size={16} />
                    Record Payment
                  </button>
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setIsEditModalOpen(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
                  >
                    <FiEdit2 size={16} />
                    Edit Invoice
                  </button>
                </>
              )}
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

      {/* Edit Invoice Modal */}
      {isEditModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiEdit2 size={18} /> Edit Invoice
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
                  Amount Due
                </label>
                <input
                  type="text"
                  value={invoiceFormData.amountDue || ''}
                  onChange={(e) => setInvoiceFormData({...invoiceFormData, amountDue: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={invoiceFormData.dueDate || ''}
                  onChange={(e) => setInvoiceFormData({...invoiceFormData, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={invoiceFormData.status || 'unpaid'}
                  onChange={(e) => setInvoiceFormData({...invoiceFormData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
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
                onClick={handleUpdateInvoice}
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

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiCreditCard size={18} /> Record Payment
              </h2>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
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
                  type="text"
                  value={paymentFormData.amount || ''}
                  onChange={(e) => setPaymentFormData({...paymentFormData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="100.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentFormData.paymentMethod || 'credit_card'}
                  onChange={(e) => setPaymentFormData({...paymentFormData, paymentMethod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number (optional)
                </label>
                <input
                  type="text"
                  value={paymentFormData.referenceNumber || ''}
                  onChange={(e) => setPaymentFormData({...paymentFormData, referenceNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="TRX-123456"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={!paymentFormData.amount || !paymentFormData.paymentMethod || loading.payment}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 ${
                  loading.payment ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
                } transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed`}
              >
                {loading.payment ? (
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
    </div>
  );
}