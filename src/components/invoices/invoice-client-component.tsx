// components/invoices/invoice-client-component.tsx
'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck } from "react-icons/fi";
import { createInvoice, updateInvoice, deleteInvoice, getInvoices } from "@/lib/actions/invoice.action";

// Define the interface for an Invoice based on your Drizzle schema
interface Invoice {
  id: number;
  studentId: number;
  semesterId: number;
  feeStructureId: number | null;
  amountDue: string;
  amountPaid: string;
  balance: string; // Calculated field, read-only
  dueDate: string;
  issuedDate: string; // Date object from DB, converted to ISO string for client
  status: string;
}

// Define the interface for reference data
interface ReferenceData {
  students: { id: number; firstName: string; lastName: string; registrationNumber: string }[];
  semesters: { id: number; name: string }[];
  feeStructures: { id: number; programId: number; semesterId: number; totalAmount: string; description: string | null }[];
  programs: { id: number; name: string; code: string }[]; // Needed for fee structure display
}

interface InvoicesClientComponentProps {
  initialInvoices: Invoice[];
  referenceData: ReferenceData;
}

export default function InvoicesClientComponent({ initialInvoices, referenceData }: InvoicesClientComponentProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("studentId"); // Default filter
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editedInvoice, setEditedInvoice] = useState<Partial<Invoice>>({});
  const [showDetails, setShowDetails] = useState<Invoice | null>(null);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    studentId: "", // Keep as string for select value
    semesterId: "", // Keep as string for select value
    feeStructureId: "", // Keep as string for select value (for initial empty state)
    amountDue: "",
    amountPaid: "0.00", // Default as per schema
    dueDate: "",
    status: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Helper to get student display name
  const getStudentDisplayName = (studentId: number) => {
    const student = referenceData.students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName} (Reg: ${student.registrationNumber})` : `Student ID: ${studentId}`;
  };

  // Helper to get semester display name
  const getSemesterDisplayName = (semesterId: number) => {
    const semester = referenceData.semesters.find(s => s.id === semesterId);
    return semester ? semester.name : `Semester ID: ${semesterId}`;
  };

  // Helper to get fee structure display name
  const getFeeStructureDisplayName = (feeStructureId: number | null) => {
    if (feeStructureId === null) return 'N/A';
    const fs = referenceData.feeStructures.find(f => f.id === feeStructureId);
    if (!fs) return `Fee Structure ID: ${feeStructureId}`;
    const program = referenceData.programs.find(p => p.id === fs.programId);
    const semester = referenceData.semesters.find(s => s.id === fs.semesterId);
    return `${program?.name || 'Unknown Program'} (${semester?.name || 'Unknown Semester'}) - ${fs.totalAmount}`;
  };

  // Filter invoices based on search and filterBy criteria
  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    let value = '';
    if (filterBy === 'studentId') {
      value = getStudentDisplayName(invoice.studentId).toLowerCase();
    } else if (filterBy === 'semesterId') {
      value = getSemesterDisplayName(invoice.semesterId).toLowerCase();
    } else if (filterBy === 'feeStructureId') {
      value = getFeeStructureDisplayName(invoice.feeStructureId).toLowerCase();
    } else {
      value = (invoice as any)[filterBy]?.toString().toLowerCase() || '';
    }
    return value.includes(search.toLowerCase());
  });

  // Handle edit button click
  const handleEdit = (invoice: Invoice) => {
    setEditId(invoice.id);
    setEditedInvoice({
      ...invoice,
      amountDue: invoice.amountDue || '',
      amountPaid: invoice.amountPaid || '',
      dueDate: invoice.dueDate || '',
      status: invoice.status || '',
      // Ensure issuedDate is formatted for date input, handling potential null/undefined
      issuedDate: invoice.issuedDate ? new Date(invoice.issuedDate).toISOString().split('T')[0] : '',
      // feeStructureId is number | null, assign directly. Select's value will handle string conversion.
      feeStructureId: invoice.feeStructureId,
    });
    setFormError(null);
    setFormSuccess(null);
  };

  // Handle save (update) action
  const handleSave = async (id: number, formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await updateInvoice(id, formData);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to update invoice.") : null);
        return;
      }
      setFormSuccess('Invoice updated successfully!');
      setEditId(null);
      // Re-fetch all invoices to ensure the local state is fully synchronized
      const updatedInvoices = await getInvoices();
      setInvoices(updatedInvoices.map(inv => ({
        ...inv,
        issuedDate: inv.issuedDate instanceof Date ? inv.issuedDate.toISOString() : inv.issuedDate,
      })));
    } catch (error: any) {
      setFormError(error.message || "Failed to update invoice.");
    }
  };

  // Handle add new invoice action
  const handleAddInvoice = async (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createInvoice(formData);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to create invoice.") : null);
        return;
      }
      setFormSuccess('Invoice created successfully!');
      setShowAddInvoice(false);
      setNewInvoice({ // Reset form fields
        studentId: "", semesterId: "", feeStructureId: "", amountDue: "", amountPaid: "0.00", dueDate: "", status: ""
      });
      // Re-fetch all invoices to ensure the local state is fully synchronized
      const updatedInvoices = await getInvoices();
      setInvoices(updatedInvoices.map(inv => ({
        ...inv,
        issuedDate: inv.issuedDate instanceof Date ? inv.issuedDate.toISOString() : inv.issuedDate,
      })));
    } catch (error: any) {
      setFormError(error.message || "Failed to create invoice.");
    }
  };

  // Handle delete invoice action
  const handleDeleteInvoice = async (invoiceId: number) => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) return;
    try {
      const result = await deleteInvoice(invoiceId);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to delete invoice.") : null);
        return;
      }
      setFormSuccess('Invoice deleted successfully!');
      setInvoices(invoices.filter((invoice) => invoice.id !== invoiceId));
    } catch (error: any) {
      setFormError(error.message || "Failed to delete invoice.");
    }
  };

  return (
    <>
      {/* Search and filter bar */}
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search invoices..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option className="bg-emerald-800" value="studentId">Student</option>
            <option className="bg-emerald-800" value="semesterId">Semester</option>
            <option className="bg-emerald-800" value="status">Status</option>
            <option className="bg-emerald-800" value="id">ID</option>
          </select>
        </div>
        <button
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddInvoice(true)}
        >
          <FiPlus /> Add Invoice
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
                      <th className="p-4 text-left">Student</th>
                      <th className="p-4 text-left">Semester</th>
                      <th className="p-4 text-left">Fee Structure</th>
                      <th className="p-4 text-left">Amount Due</th>
                      <th className="p-4 text-left">Amount Paid</th>
                      <th className="p-4 text-left">Balance</th>
                      <th className="p-4 text-left">Due Date</th>
                      <th className="p-4 text-left">Issued Date</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredInvoices.map((invoice: Invoice) => (
                      <tr key={invoice.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-800">{invoice.id}</td>
                        <td className="p-4">
                          {editId === invoice.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedInvoice.studentId !== undefined ? String(editedInvoice.studentId) : ''}
                              onChange={(e) => setEditedInvoice({ ...editedInvoice, studentId: Number(e.target.value) })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Student</option>
                              {referenceData.students.map((student) => (
                                <option className="bg-emerald-800 text-white" key={student.id} value={student.id}>
                                  {student.firstName} {student.lastName} ({student.registrationNumber})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-800">{getStudentDisplayName(invoice.studentId)}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === invoice.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedInvoice.semesterId !== undefined ? String(editedInvoice.semesterId) : ''}
                              onChange={(e) => setEditedInvoice({ ...editedInvoice, semesterId: Number(e.target.value) })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Semester</option>
                              {referenceData.semesters.map((semester) => (
                                <option className="bg-emerald-800 text-white" key={semester.id} value={semester.id}>
                                  {semester.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-800">{getSemesterDisplayName(invoice.semesterId)}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === invoice.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedInvoice.feeStructureId !== undefined && editedInvoice.feeStructureId !== null ? String(editedInvoice.feeStructureId) : ''}
                              onChange={(e) => setEditedInvoice({ ...editedInvoice, feeStructureId: Number(e.target.value) || null })}
                            >
                              <option className="bg-emerald-800 text-white" value="">None</option>
                              {referenceData.feeStructures.map((fs) => (
                                <option className="bg-emerald-800 text-white" key={fs.id} value={fs.id}>
                                  {getFeeStructureDisplayName(fs.id)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-800">{getFeeStructureDisplayName(invoice.feeStructureId)}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === invoice.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedInvoice.amountDue || ''}
                              onChange={(e) => setEditedInvoice({ ...editedInvoice, amountDue: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{invoice.amountDue}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === invoice.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedInvoice.amountPaid || ''}
                              onChange={(e) => setEditedInvoice({ ...editedInvoice, amountPaid: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{invoice.amountPaid}</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-gray-800">{invoice.balance}</span> {/* Balance is read-only */}
                        </td>
                        <td className="p-4">
                          {editId === invoice.id ? (
                            <input
                              type="date"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedInvoice.dueDate || ''}
                              onChange={(e) => setEditedInvoice({ ...editedInvoice, dueDate: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{invoice.dueDate}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === invoice.id ? (
                            <input
                              type="date"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={(editedInvoice.issuedDate || '').split('T')[0]} // Ensure date part for input
                              onChange={(e) => setEditedInvoice({ ...editedInvoice, issuedDate: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{new Date(invoice.issuedDate).toLocaleDateString()}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === invoice.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedInvoice.status || ''}
                              onChange={(e) => setEditedInvoice({ ...editedInvoice, status: e.target.value })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Status</option>
                              <option className="bg-emerald-800 text-white" value="Pending">Pending</option>
                              <option className="bg-emerald-800 text-white" value="Paid">Paid</option>
                              <option className="bg-emerald-800 text-white" value="Overdue">Overdue</option>
                              <option className="bg-emerald-800 text-white" value="Partial">Partial</option>
                            </select>
                          ) : (
                            <span className={`font-medium ${invoice.status === 'Paid' ? 'text-green-600' : invoice.status === 'Overdue' ? 'text-red-600' : 'text-gray-800'}`}>
                              {invoice.status}
                            </span>
                          )}
                        </td>
                        <td className="p-4 flex gap-3 items-center">
                          {editId === invoice.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  const formData = new FormData();
                                  if (editedInvoice.studentId !== undefined) formData.append('studentId', String(editedInvoice.studentId));
                                  if (editedInvoice.semesterId !== undefined) formData.append('semesterId', String(editedInvoice.semesterId));
                                  // Only append feeStructureId if it's not null/undefined
                                  if (editedInvoice.feeStructureId !== undefined && editedInvoice.feeStructureId !== null) {
                                    formData.append('feeStructureId', String(editedInvoice.feeStructureId));
                                  } else if (editedInvoice.feeStructureId === null) {
                                    // If explicitly set to null (e.g., by selecting "None" option)
                                    formData.append('feeStructureId', ''); // Send empty string for null to action
                                  }
                                  if (editedInvoice.amountDue) formData.append('amountDue', editedInvoice.amountDue);
                                  if (editedInvoice.amountPaid) formData.append('amountPaid', editedInvoice.amountPaid);
                                  if (editedInvoice.dueDate) formData.append('dueDate', editedInvoice.dueDate);
                                  if (editedInvoice.issuedDate) formData.append('issuedDate', editedInvoice.issuedDate);
                                  if (editedInvoice.status) formData.append('status', editedInvoice.status);
                                  handleSave(invoice.id, formData);
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
                                onClick={() => handleEdit(invoice)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeleteInvoice(invoice.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                                onClick={() => setShowDetails(invoice)}
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

      {/* Add Invoice Modal */}
      {showAddInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Invoice</h2>
              <button
                onClick={() => setShowAddInvoice(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form action={handleAddInvoice}>
              <div className="grid grid-cols-1 gap-6 p-6">
                <div>
                  <label htmlFor="invoiceStudentId" className="block mb-2 text-sm font-medium text-gray-700">Student</label>
                  <select
                    id="invoiceStudentId"
                    name="studentId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newInvoice.studentId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, studentId: e.target.value })}
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
                  <label htmlFor="invoiceSemesterId" className="block mb-2 text-sm font-medium text-gray-700">Semester</label>
                  <select
                    id="invoiceSemesterId"
                    name="semesterId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newInvoice.semesterId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, semesterId: e.target.value })}
                    required
                  >
                    <option className="bg-emerald-800 text-white" value="">Select Semester</option>
                    {referenceData.semesters.map((semester) => (
                      <option className="bg-emerald-800 text-white" key={semester.id} value={semester.id}>
                        {semester.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="invoiceFeeStructureId" className="block mb-2 text-sm font-medium text-gray-700">Fee Structure (Optional)</label>
                  <select
                    id="invoiceFeeStructureId"
                    name="feeStructureId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newInvoice.feeStructureId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, feeStructureId: e.target.value })}
                  >
                    <option className="bg-emerald-800 text-white" value="">None</option>
                    {referenceData.feeStructures.map((fs) => (
                      <option className="bg-emerald-800 text-white" key={fs.id} value={fs.id}>
                        {getFeeStructureDisplayName(fs.id)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="amountDue" className="block mb-2 text-sm font-medium text-gray-700">Amount Due</label>
                  <input
                    type="number"
                    step="0.01"
                    id="amountDue"
                    name="amountDue"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newInvoice.amountDue}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amountDue: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="amountPaid" className="block mb-2 text-sm font-medium text-gray-700">Amount Paid</label>
                  <input
                    type="number"
                    step="0.01"
                    id="amountPaid"
                    name="amountPaid"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newInvoice.amountPaid}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amountPaid: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="dueDate" className="block mb-2 text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="status"
                    name="status"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newInvoice.status}
                    onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value })}
                    required
                  >
                    <option className="bg-emerald-800 text-white" value="">Select Status</option>
                    <option className="bg-emerald-800 text-white" value="Pending">Pending</option>
                    <option className="bg-emerald-800 text-white" value="Paid">Paid</option>
                    <option className="bg-emerald-800 text-white" value="Overdue">Overdue</option>
                    <option className="bg-emerald-800 text-white" value="Partial">Partial</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddInvoice(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-700 hover:to-pink-600 transition-all shadow-md"
                >
                  Create Invoice
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
              <h2 className="text-2xl font-bold text-gray-800">Invoice Details</h2>
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
                  <p className="text-sm text-gray-500">Student</p>
                  <p className="font-medium text-gray-800">{getStudentDisplayName(showDetails.studentId)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Semester</p>
                  <p className="font-medium text-gray-800">{getSemesterDisplayName(showDetails.semesterId)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Fee Structure</p>
                  <p className="font-medium text-gray-800">{getFeeStructureDisplayName(showDetails.feeStructureId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount Due</p>
                  <p className="font-medium text-gray-800">{showDetails.amountDue}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount Paid</p>
                  <p className="font-medium text-gray-800">{showDetails.amountPaid}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className="font-medium text-gray-800">{showDetails.balance}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium text-gray-800">{showDetails.dueDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Issued Date</p>
                  <p className="font-medium text-gray-800">{new Date(showDetails.issuedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium ${showDetails.status === 'Paid' ? 'text-green-600' : showDetails.status === 'Overdue' ? 'text-red-600' : 'text-gray-800'}`}>
                    {showDetails.status}
                  </p>
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