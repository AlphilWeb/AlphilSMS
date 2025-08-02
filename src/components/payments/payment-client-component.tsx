'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck } from "react-icons/fi";
import { createPayment, updatePayment, deletePayment, getPayments } from "@/lib/actions/payment.action";

interface Payment {
  id: number;
  invoiceId: number;
  studentId: number;
  amount: string;
  paymentMethod: string;
  transactionDate: string;
  referenceNumber: string | null;
}

interface Invoice {
  id: number;
  studentId: number;
  semesterId: number;
  amountDue: string;
  amountPaid: string;
  balance: string;
  dueDate: string;
  issuedDate: string;
  status: string;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  registrationNumber: string;
}

interface Semester {
  id: number;
  name: string;
}

interface ReferenceData {
  invoices: Invoice[];
  students: Student[];
  semesters: Semester[];
}

interface PaymentsClientComponentProps {
  initialPayments: Payment[];
  referenceData: ReferenceData;
}

export default function PaymentsClientComponent({ initialPayments, referenceData }: PaymentsClientComponentProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState<keyof Payment | 'invoiceId' | 'studentId'>("invoiceId");
  const [editId, setEditId] = useState<number | null>(null);
  const [editedPayment, setEditedPayment] = useState<Partial<Payment>>({});
  const [showDetails, setShowDetails] = useState<Payment | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    invoiceId: "",
    studentId: "",
    amount: "",
    paymentMethod: "",
    transactionDate: "",
    referenceNumber: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const getStudentDisplayName = (studentId: number): string => {
    const student = referenceData.students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName} (Reg: ${student.registrationNumber})` : `Student ID: ${studentId}`;
  };

  const getInvoiceDisplayName = (invoiceId: number): string => {
    const invoice = referenceData.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return `Invoice ID: ${invoiceId}`;

    const studentName = getStudentDisplayName(invoice.studentId);
    const semester = referenceData.semesters.find(s => s.id === invoice.semesterId);
    const semesterName = semester ? semester.name : `Semester ID: ${invoice.semesterId}`;

    return `Inv ${invoice.id} (${studentName}, ${semesterName}) - Due: ${invoice.amountDue}`;
  };

  const filteredPayments = payments.filter((payment: Payment) => {
    const filterableProperties: Record<string, string> = {
      id: payment.id.toString(),
      invoiceId: getInvoiceDisplayName(payment.invoiceId),
      studentId: getStudentDisplayName(payment.studentId),
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      transactionDate: payment.transactionDate,
      referenceNumber: payment.referenceNumber || ''
    };

    const value = filterableProperties[filterBy].toLowerCase();
    return value.includes(search.toLowerCase());
  });

  const handleEdit = (payment: Payment) => {
    setEditId(payment.id);
    setEditedPayment({
      ...payment,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber || '',
      transactionDate: payment.transactionDate ? new Date(payment.transactionDate).toISOString().split('T')[0] : '',
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSave = async (id: number, formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await updatePayment(id, formData);
      if ('error' in result) {
        setFormError(result.error ?? "Failed to update payment.");
        return;
      }
      setFormSuccess('Payment updated successfully!');
      setEditId(null);
      
      const updatedPayments = await getPayments();
      setPayments(updatedPayments.map(p => ({
        ...p,
        transactionDate: p.transactionDate instanceof Date ? p.transactionDate.toISOString() : p.transactionDate,
      })));
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Failed to update payment.");
    }
  };

  const handleAddPayment = async (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createPayment(formData);
      if ('error' in result) {
        setFormError(result.error ?? "Failed to create payment.");
        return;
      }
      setFormSuccess('Payment created successfully!');
      setShowAddPayment(false);
      setNewPayment({
        invoiceId: "", 
        studentId: "", 
        amount: "", 
        paymentMethod: "", 
        transactionDate: "", 
        referenceNumber: ""
      });

      const updatedPayments = await getPayments();
      setPayments(updatedPayments.map(p => ({
        ...p,
        transactionDate: p.transactionDate instanceof Date ? p.transactionDate.toISOString() : p.transactionDate,
      })));
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Failed to create payment.");
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm("Are you sure you want to delete this payment? This action cannot be undone.")) return;
    try {
      const result = await deletePayment(paymentId);
      if ('error' in result) {
        setFormError(result.error ?? "Failed to delete payment.");
        return;
      }
      setFormSuccess('Payment deleted successfully!');
      setPayments(payments.filter(payment => payment.id !== paymentId));
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Failed to delete payment.");
    }
  };

  return (
    <>
      {/* Search and filter bar */}
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search payments..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
<select
  className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600"
  value={filterBy}
  // Tell TypeScript that we know e.target.value is a valid key of Payment
  onChange={(e) => setFilterBy(e.target.value as keyof Payment)}
>
  <option className="bg-emerald-800" value="invoiceId">Invoice</option>
  <option className="bg-emerald-800" value="studentId">Student</option>
  <option className="bg-emerald-800" value="paymentMethod">Payment Method</option>
  <option className="bg-emerald-800" value="id">ID</option>
</select>
        </div>
        <button
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddPayment(true)}
        >
          <FiPlus /> Add Payment
        </button>
      </div>

      {/* Status messages */}
      {formError && (
        <div className="mx-8 mt-4 p-3 bg-red-500/90 text-white rounded-lg shadow flex items-center gap-2">
          <FiX className="flex-shrink-0" />
          {formError}
        </div>
      )}
      {formSuccess && (
        <div className="mx-8 mt-4 p-3 bg-green-500/90 text-white rounded-lg shadow flex items-center gap-2">
          <FiCheck className="flex-shrink-0" />
          {formSuccess}
        </div>
      )}

      {/* Table section */}
      <div className="px-12 py-6 h-[calc(100vh-250px)] overflow-hidden">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col border border-white/20">
          <div className="overflow-x-auto h-full">
            <div className="h-full">
              <div className="overflow-y-auto max-h-full">
                <table className="min-w-full table-fixed text-gray-800">
                  <thead className="sticky top-0 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white z-10">
                    <tr>
                      <th className="p-4 text-left w-20">ID</th>
                      <th className="p-4 text-left">Invoice</th>
                      <th className="p-4 text-left">Student</th>
                      <th className="p-4 text-left">Amount</th>
                      <th className="p-4 text-left">Method</th>
                      <th className="p-4 text-left">Transaction Date</th>
                      <th className="p-4 text-left">Reference #</th>
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredPayments.map((payment: Payment) => (
                      <tr key={payment.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-800">{payment.id}</td>
                        <td className="p-4">
                          {editId === payment.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedPayment.invoiceId !== undefined ? String(editedPayment.invoiceId) : ''}
                              onChange={(e) => setEditedPayment({ ...editedPayment, invoiceId: Number(e.target.value) })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Invoice</option>
                              {referenceData.invoices.map((invoice) => (
                                <option className="bg-emerald-800 text-white" key={invoice.id} value={invoice.id}>
                                  {getInvoiceDisplayName(invoice.id)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-800">{getInvoiceDisplayName(payment.invoiceId)}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === payment.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedPayment.studentId !== undefined ? String(editedPayment.studentId) : ''}
                              onChange={(e) => setEditedPayment({ ...editedPayment, studentId: Number(e.target.value) })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Student</option>
                              {referenceData.students.map((student) => (
                                <option className="bg-emerald-800 text-white" key={student.id} value={student.id}>
                                  {student.firstName} {student.lastName} ({student.registrationNumber})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-800">{getStudentDisplayName(payment.studentId)}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === payment.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedPayment.amount || ''}
                              onChange={(e) => setEditedPayment({ ...editedPayment, amount: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{payment.amount}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === payment.id ? (
                            <input
                              type="text"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedPayment.paymentMethod || ''}
                              onChange={(e) => setEditedPayment({ ...editedPayment, paymentMethod: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{payment.paymentMethod}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === payment.id ? (
                            <input
                              type="date"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={(editedPayment.transactionDate || '').split('T')[0]} // Ensure date part for input
                              onChange={(e) => setEditedPayment({ ...editedPayment, transactionDate: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{new Date(payment.transactionDate).toLocaleDateString()}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === payment.id ? (
                            <input
                              type="text"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedPayment.referenceNumber || ''}
                              onChange={(e) => setEditedPayment({ ...editedPayment, referenceNumber: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{payment.referenceNumber || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-4 flex gap-3 items-center">
                          {editId === payment.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  const formData = new FormData();
                                  if (editedPayment.invoiceId !== undefined) formData.append('invoiceId', String(editedPayment.invoiceId));
                                  if (editedPayment.studentId !== undefined) formData.append('studentId', String(editedPayment.studentId));
                                  if (editedPayment.amount) formData.append('amount', editedPayment.amount);
                                  if (editedPayment.paymentMethod) formData.append('paymentMethod', editedPayment.paymentMethod);
                                  if (editedPayment.transactionDate) formData.append('transactionDate', editedPayment.transactionDate);
                                  if (editedPayment.referenceNumber) formData.append('referenceNumber', editedPayment.referenceNumber);
                                  handleSave(payment.id, formData);
                                }}
                              >
                                <FiSave /> Save
                              </button>
                              <button
                                className="text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-300 text-sm transition-colors"
                                onClick={() => setEditId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                onClick={() => handleEdit(payment)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeletePayment(payment.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                                onClick={() => setShowDetails(payment)}
                                title="View"
                              >
                                <FiEye />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Payment</h2>
              <button
                onClick={() => setShowAddPayment(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form action={handleAddPayment}>
              <div className="grid grid-cols-1 gap-6 p-6">
                <div>
                  <label htmlFor="paymentInvoiceId" className="block mb-2 text-sm font-medium text-gray-700">Invoice</label>
                  <select
                    id="paymentInvoiceId"
                    name="invoiceId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newPayment.invoiceId}
                    onChange={(e) => setNewPayment({ ...newPayment, invoiceId: e.target.value })}
                    required
                  >
                    <option className="bg-emerald-800 text-white" value="">Select Invoice</option>
                    {referenceData.invoices.map((invoice) => (
                      <option className="bg-emerald-800 text-white" key={invoice.id} value={invoice.id}>
                        {getInvoiceDisplayName(invoice.id)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="paymentStudentId" className="block mb-2 text-sm font-medium text-gray-700">Student</label>
                  <select
                    id="paymentStudentId"
                    name="studentId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newPayment.studentId}
                    onChange={(e) => setNewPayment({ ...newPayment, studentId: e.target.value })}
                    required
                  >
                    <option className="bg-emerald-800 text-white" value="">Select Student</option>
                    {referenceData.students.map((student) => (
                      <option className="bg-emerald-800 text-white" key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} ({student.registrationNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="amount" className="block mb-2 text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    id="amount"
                    name="amount"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="paymentMethod" className="block mb-2 text-sm font-medium text-gray-700">Payment Method</label>
                  <input
                    type="text"
                    id="paymentMethod"
                    name="paymentMethod"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newPayment.paymentMethod}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="transactionDate" className="block mb-2 text-sm font-medium text-gray-700">Transaction Date</label>
                  <input
                    type="date"
                    id="transactionDate"
                    name="transactionDate"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newPayment.transactionDate}
                    onChange={(e) => setNewPayment({ ...newPayment, transactionDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="referenceNumber" className="block mb-2 text-sm font-medium text-gray-700">Reference Number (Optional)</label>
                  <input
                    type="text"
                    id="referenceNumber"
                    name="referenceNumber"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newPayment.referenceNumber}
                    onChange={(e) => setNewPayment({ ...newPayment, referenceNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddPayment(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-700 hover:to-pink-600 transition-all shadow-md"
                >
                  Create Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
              <button
                onClick={() => setShowDetails(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ID</p>
                  <p className="font-medium text-gray-800">{showDetails.id}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Invoice</p>
                  <p className="font-medium text-gray-800">{getInvoiceDisplayName(showDetails.invoiceId)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Student</p>
                  <p className="font-medium text-gray-800">{getStudentDisplayName(showDetails.studentId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium text-gray-800">{showDetails.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium text-gray-800">{showDetails.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transaction Date</p>
                  <p className="font-medium text-gray-800">{new Date(showDetails.transactionDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reference Number</p>
                  <p className="font-medium text-gray-800">{showDetails.referenceNumber || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setShowDetails(null)}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}