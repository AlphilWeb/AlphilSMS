// components/staffSalaries/staffSalary-client-component.tsx
'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck } from "react-icons/fi";
import { createStaffSalary, updateStaffSalary, deleteStaffSalary, getStaffSalaries } from "@/lib/actions/staffSalary.action";

// Define the interface for a StaffSalary based on your Drizzle schema
interface StaffSalary {
  id: number;
  staffId: number;
  amount: string; // Numeric types often come as string from DB
  paymentDate: string; // date({ mode: 'string' })
  description: string | null;
  status: string;
}

// Define the interface for reference data (CORRECTED: removed staffId from staff type)
interface ReferenceData {
  staff: { id: number; firstName: string; lastName: string; }[]; // Assuming 'id' is the unique identifier
}

interface StaffSalariesClientComponentProps {
  initialStaffSalaries: StaffSalary[];
  referenceData: ReferenceData;
}

export default function StaffSalariesClientComponent({ initialStaffSalaries, referenceData }: StaffSalariesClientComponentProps) {
  const [staffSalaries, setStaffSalaries] = useState<StaffSalary[]>(initialStaffSalaries);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("staffId"); // Default filter
  const [selectedStaffSalaryId, setSelectedStaffSalaryId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editedStaffSalary, setEditedStaffSalary] = useState<Partial<StaffSalary>>({});
  const [showDetails, setShowDetails] = useState<StaffSalary | null>(null);
  const [showAddStaffSalary, setShowAddStaffSalary] = useState(false);
  const [newStaffSalary, setNewStaffSalary] = useState({
    staffId: "", // Keep as string for select value
    amount: "",
    paymentDate: "",
    description: "",
    status: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Helper to get staff display name (CORRECTED: using staffMember.id)
  const getStaffDisplayName = (staffId: number) => {
    const staffMember = referenceData.staff.find(s => s.id === staffId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName} (ID: ${staffMember.id})` : `Staff ID: ${staffId}`;
  };

  // Filter staff salaries based on search and filterBy criteria
  const filteredStaffSalaries = staffSalaries.filter((staffSalary: StaffSalary) => {
    let value = '';
    if (filterBy === 'staffId') {
      value = getStaffDisplayName(staffSalary.staffId).toLowerCase();
    } else {
      value = (staffSalary as any)[filterBy]?.toString().toLowerCase() || '';
    }
    return value.includes(search.toLowerCase());
  });

  // Handle edit button click
  const handleEdit = (staffSalary: StaffSalary) => {
    setEditId(staffSalary.id);
    setEditedStaffSalary({
      ...staffSalary,
      amount: staffSalary.amount || '',
      paymentDate: staffSalary.paymentDate || '',
      description: staffSalary.description || '',
      status: staffSalary.status || '',
    });
    setFormError(null);
    setFormSuccess(null);
  };

  // Handle save (update) action
  const handleSave = async (id: number, formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await updateStaffSalary(id, formData);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to update staff salary.") : null);
        return;
      }
      setFormSuccess('Staff salary updated successfully!');
      setEditId(null);
      // Re-fetch all staff salaries to ensure the local state is fully synchronized
      const updatedStaffSalaries = await getStaffSalaries();
      setStaffSalaries(updatedStaffSalaries);
    } catch (error: any) {
      setFormError(error.message || "Failed to update staff salary.");
    }
  };

  // Handle add new staff salary action
  const handleAddStaffSalary = async (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createStaffSalary(formData);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to create staff salary.") : null);
        return;
      }
      setFormSuccess('Staff salary created successfully!');
      setShowAddStaffSalary(false);
      setNewStaffSalary({ // Reset form fields
        staffId: "", amount: "", paymentDate: "", description: "", status: ""
      });
      // Re-fetch all staff salaries to ensure the local state is fully synchronized
      const updatedStaffSalaries = await getStaffSalaries();
      setStaffSalaries(updatedStaffSalaries);
    } catch (error: any) {
      setFormError(error.message || "Failed to create staff salary.");
    }
  };

  // Handle delete staff salary action
  const handleDeleteStaffSalary = async (staffSalaryId: number) => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm("Are you sure you want to delete this staff salary record? This action cannot be undone.")) return;
    try {
      const result = await deleteStaffSalary(staffSalaryId);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to delete staff salary.") : null);
        return;
      }
      setFormSuccess('Staff salary deleted successfully!');
      setStaffSalaries(staffSalaries.filter((staffSalary) => staffSalary.id !== staffSalaryId));
    } catch (error: any) {
      setFormError(error.message || "Failed to delete staff salary.");
    }
  };

  return (
    <>
      {/* Search and filter bar */}
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search staff salaries..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option className="bg-emerald-800" value="staffId">Staff</option>
            <option className="bg-emerald-800" value="status">Status</option>
            <option className="bg-emerald-800" value="paymentDate">Payment Date</option>
            <option className="bg-emerald-800" value="id">ID</option>
          </select>
        </div>
        <button
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddStaffSalary(true)}
        >
          <FiPlus /> Add Staff Salary
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
                      <th className="p-4 text-left">Staff Member</th>
                      <th className="p-4 text-left">Amount</th>
                      <th className="p-4 text-left">Payment Date</th>
                      <th className="p-4 text-left">Description</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredStaffSalaries.map((staffSalary: StaffSalary) => (
                      <tr key={staffSalary.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-800">{staffSalary.id}</td>
                        <td className="p-4">
                          {editId === staffSalary.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedStaffSalary.staffId !== undefined ? String(editedStaffSalary.staffId) : ''}
                              onChange={(e) => setEditedStaffSalary({ ...editedStaffSalary, staffId: Number(e.target.value) })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Staff</option>
                              {referenceData.staff.map((staffMember) => (
                                <option className="bg-emerald-800 text-white" key={staffMember.id} value={staffMember.id}>
                                  {staffMember.firstName} {staffMember.lastName} (ID: {staffMember.id}) {/* CORRECTED */}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-800">{getStaffDisplayName(staffSalary.staffId)}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === staffSalary.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedStaffSalary.amount || ''}
                              onChange={(e) => setEditedStaffSalary({ ...editedStaffSalary, amount: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{staffSalary.amount}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === staffSalary.id ? (
                            <input
                              type="date"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedStaffSalary.paymentDate || ''}
                              onChange={(e) => setEditedStaffSalary({ ...editedStaffSalary, paymentDate: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{staffSalary.paymentDate}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === staffSalary.id ? (
                            <textarea
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedStaffSalary.description || ''}
                              onChange={(e) => setEditedStaffSalary({ ...editedStaffSalary, description: e.target.value })}
                              rows={2}
                            />
                          ) : (
                            <span className="text-gray-800">{staffSalary.description || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === staffSalary.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedStaffSalary.status || ''}
                              onChange={(e) => setEditedStaffSalary({ ...editedStaffSalary, status: e.target.value })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Status</option>
                              <option className="bg-emerald-800 text-white" value="Paid">Paid</option>
                              <option className="bg-emerald-800 text-white" value="Pending">Pending</option>
                              <option className="bg-emerald-800 text-white" value="Processing">Processing</option>
                              <option className="bg-emerald-800 text-white" value="Failed">Failed</option>
                            </select>
                          ) : (
                            <span className={`font-medium ${staffSalary.status === 'Paid' ? 'text-green-600' : staffSalary.status === 'Failed' ? 'text-red-600' : 'text-gray-800'}`}>
                              {staffSalary.status}
                            </span>
                          )}
                        </td>
                        <td className="p-4 flex gap-3 items-center">
                          {editId === staffSalary.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  const formData = new FormData();
                                  if (editedStaffSalary.staffId !== undefined) formData.append('staffId', String(editedStaffSalary.staffId));
                                  if (editedStaffSalary.amount) formData.append('amount', editedStaffSalary.amount);
                                  if (editedStaffSalary.paymentDate) formData.append('paymentDate', editedStaffSalary.paymentDate);
                                  if (editedStaffSalary.description) formData.append('description', editedStaffSalary.description);
                                  if (editedStaffSalary.status) formData.append('status', editedStaffSalary.status);
                                  handleSave(staffSalary.id, formData);
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
                                onClick={() => handleEdit(staffSalary)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeleteStaffSalary(staffSalary.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                                onClick={() => setShowDetails(staffSalary)}
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

      {/* Add Staff Salary Modal */}
      {showAddStaffSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Staff Salary Record</h2>
              <button
                onClick={() => setShowAddStaffSalary(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form action={handleAddStaffSalary}>
              <div className="grid grid-cols-1 gap-6 p-6">
                <div>
                  <label htmlFor="salaryStaffId" className="block mb-2 text-sm font-medium text-gray-700">Staff Member</label>
                  <select
                    id="salaryStaffId"
                    name="staffId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newStaffSalary.staffId}
                    onChange={(e) => setNewStaffSalary({ ...newStaffSalary, staffId: e.target.value })}
                    required
                  >
                    <option className="bg-emerald-800 text-white" value="">Select Staff Member</option>
                    {referenceData.staff.map((staffMember) => (
                      <option className="bg-emerald-800 text-white" key={staffMember.id} value={staffMember.id}>
                        {staffMember.firstName} {staffMember.lastName} (ID: {staffMember.id}) {/* CORRECTED */}
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
                    value={newStaffSalary.amount}
                    onChange={(e) => setNewStaffSalary({ ...newStaffSalary, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="paymentDate" className="block mb-2 text-sm font-medium text-gray-700">Payment Date</label>
                  <input
                    type="date"
                    id="paymentDate"
                    name="paymentDate"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newStaffSalary.paymentDate}
                    onChange={(e) => setNewStaffSalary({ ...newStaffSalary, paymentDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">Description (Optional)</label>
                  <textarea
                    id="description"
                    name="description"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newStaffSalary.description}
                    onChange={(e) => setNewStaffSalary({ ...newStaffSalary, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="status"
                    name="status"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newStaffSalary.status}
                    onChange={(e) => setNewStaffSalary({ ...newStaffSalary, status: e.target.value })}
                    required
                  >
                    <option className="bg-emerald-800 text-white" value="">Select Status</option>
                    <option className="bg-emerald-800 text-white" value="Paid">Paid</option>
                    <option className="bg-emerald-800 text-white" value="Pending">Pending</option>
                    <option className="bg-emerald-800 text-white" value="Processing">Processing</option>
                    <option className="bg-emerald-800 text-white" value="Failed">Failed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddStaffSalary(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-700 hover:to-pink-600 transition-all shadow-md"
                >
                  Create Staff Salary
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
              <h2 className="text-2xl font-bold text-gray-800">Staff Salary Details</h2>
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
                  <p className="text-sm text-gray-500">Staff Member</p>
                  <p className="font-medium text-gray-800">{getStaffDisplayName(showDetails.staffId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium text-gray-800">{showDetails.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Date</p>
                  <p className="font-medium text-gray-800">{showDetails.paymentDate}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium text-gray-800">{showDetails.description || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium ${showDetails.status === 'Paid' ? 'text-green-600' : showDetails.status === 'Failed' ? 'text-red-600' : 'text-gray-800'}`}>
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