// components/feeStructures/feeStructure-client-component.tsx
'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck } from "react-icons/fi";
import { createFeeStructure, updateFeeStructure, deleteFeeStructure, getFeeStructures } from "@/lib/actions/feeStructure.action";

// Define the interface for a FeeStructure based on the CORRECTED assumed Drizzle schema
interface FeeStructure {
  id: number;
  programId: number;
  semesterId: number;
  totalAmount: string; // Corrected from 'amount' to 'totalAmount'
  // Removed dueDate as it's not present in the error's data type
  description: string | null; // Optional text field
}

// Define the interface for reference data
interface ReferenceData {
  programs: { id: number; name: string; code: string }[];
  semesters: { id: number; name: string }[];
}

interface FeeStructuresClientComponentProps {
  initialFeeStructures: FeeStructure[];
  referenceData: ReferenceData;
}

export default function FeeStructuresClientComponent({ initialFeeStructures, referenceData }: FeeStructuresClientComponentProps) {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(initialFeeStructures);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("programId"); // Default filter
  const [selectedFeeStructureId, setSelectedFeeStructureId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editedFeeStructure, setEditedFeeStructure] = useState<Partial<FeeStructure>>({});
  const [showDetails, setShowDetails] = useState<FeeStructure | null>(null);
  const [showAddFeeStructure, setShowAddFeeStructure] = useState(false);
  const [newFeeStructure, setNewFeeStructure] = useState({
    programId: "", // Keep as string for select value
    semesterId: "", // Keep as string for select value
    totalAmount: "", // Corrected from 'amount'
    // Removed dueDate
    description: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Helper to get program display name
  const getProgramDisplayName = (programId: number) => {
    const program = referenceData.programs.find(p => p.id === programId);
    return program ? `${program.name} (${program.code})` : `Program ID: ${programId}`;
  };

  // Helper to get semester display name
  const getSemesterDisplayName = (semesterId: number) => {
    const semester = referenceData.semesters.find(s => s.id === semesterId);
    return semester ? semester.name : `Semester ID: ${semesterId}`;
  };

  // Filter fee structures based on search and filterBy criteria
  const filteredFeeStructures = feeStructures.filter((feeStructure: FeeStructure) => {
    let value = '';
    if (filterBy === 'programId') {
      value = getProgramDisplayName(feeStructure.programId).toLowerCase();
    } else if (filterBy === 'semesterId') {
      value = getSemesterDisplayName(feeStructure.semesterId).toLowerCase();
    } else {
      value = (feeStructure as any)[filterBy]?.toString().toLowerCase() || '';
    }
    return value.includes(search.toLowerCase());
  });

  // Handle edit button click
  const handleEdit = (feeStructure: FeeStructure) => {
    setEditId(feeStructure.id);
    setEditedFeeStructure({
      ...feeStructure,
      totalAmount: feeStructure.totalAmount || '', // Corrected from 'amount'
      description: feeStructure.description || '',
    });
    setFormError(null);
    setFormSuccess(null);
  };

  // Handle save (update) action
  const handleSave = async (id: number, formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await updateFeeStructure(id, formData);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to update fee structure.") : null);
        return;
      }
      setFormSuccess('Fee structure updated successfully!');
      setEditId(null);
      // Re-fetch all fee structures to ensure the local state is fully synchronized
      const updatedFeeStructures = await getFeeStructures();
      setFeeStructures(updatedFeeStructures);
    } catch (error: any) {
      setFormError(error.message || "Failed to update fee structure.");
    }
  };

  // Handle add new fee structure action
  const handleAddFeeStructure = async (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createFeeStructure(formData);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to create fee structure.") : null);
        return;
      }
      setFormSuccess('Fee structure created successfully!');
      setShowAddFeeStructure(false);
      setNewFeeStructure({ // Reset form fields
        programId: "", semesterId: "", totalAmount: "", description: "" // Corrected from 'amount', removed dueDate
      });
      // Re-fetch all fee structures to ensure the local state is fully synchronized
      const updatedFeeStructures = await getFeeStructures();
      setFeeStructures(updatedFeeStructures);
    } catch (error: any) {
      setFormError(error.message || "Failed to create fee structure.");
    }
  };

  // Handle delete fee structure action
  const handleDeleteFeeStructure = async (feeStructureId: number) => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm("Are you sure you want to delete this fee structure? This action cannot be undone.")) return;
    try {
      const result = await deleteFeeStructure(feeStructureId);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to delete fee structure.") : null);
        return;
      }
      setFormSuccess('Fee structure deleted successfully!');
      setFeeStructures(feeStructures.filter((feeStructure) => feeStructure.id !== feeStructureId));
    } catch (error: any) {
      setFormError(error.message || "Failed to delete fee structure.");
    }
  };

  return (
    <>
      {/* Search and filter bar */}
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search fee structures..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option className="bg-emerald-800" value="programId">Program</option>
            <option className="bg-emerald-800" value="semesterId">Semester</option>
            <option className="bg-emerald-800" value="totalAmount">Amount</option> {/* Corrected */}
            <option className="bg-emerald-800" value="id">ID</option>
          </select>
        </div>
        <button
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddFeeStructure(true)}
        >
          <FiPlus /> Add Fee Structure
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
                      <th className="p-4 text-left">Program</th>
                      <th className="p-4 text-left">Semester</th>
                      <th className="p-4 text-left">Total Amount</th> {/* Corrected */}
                      {/* Removed Due Date header */}
                      <th className="p-4 text-left">Description</th>
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredFeeStructures.map((feeStructure: FeeStructure) => (
                      <tr key={feeStructure.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-800">{feeStructure.id}</td>
                        <td className="p-4">
                          {editId === feeStructure.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedFeeStructure.programId || ''}
                              onChange={(e) => setEditedFeeStructure({ ...editedFeeStructure, programId: Number(e.target.value) })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Program</option>
                              {referenceData.programs.map((program) => (
                                <option className="bg-emerald-800 text-white" key={program.id} value={program.id}>
                                  {program.name} ({program.code})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-800">{getProgramDisplayName(feeStructure.programId)}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === feeStructure.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedFeeStructure.semesterId || ''}
                              onChange={(e) => setEditedFeeStructure({ ...editedFeeStructure, semesterId: Number(e.target.value) })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Semester</option>
                              {referenceData.semesters.map((semester) => (
                                <option className="bg-emerald-800 text-white" key={semester.id} value={semester.id}>
                                  {semester.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-800">{getSemesterDisplayName(feeStructure.semesterId)}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === feeStructure.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedFeeStructure.totalAmount || ''} // Corrected
                              onChange={(e) => setEditedFeeStructure({ ...editedFeeStructure, totalAmount: e.target.value })} // Corrected
                            />
                          ) : (
                            <span className="text-gray-800">{feeStructure.totalAmount}</span> 
                          )}
                        </td>
                        {/* Removed Due Date cell */}
                        <td className="p-4">
                          {editId === feeStructure.id ? (
                            <textarea
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedFeeStructure.description || ''}
                              onChange={(e) => setEditedFeeStructure({ ...editedFeeStructure, description: e.target.value })}
                              rows={2}
                            />
                          ) : (
                            <span className="text-gray-800">{feeStructure.description || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-4 flex gap-3 items-center">
                          {editId === feeStructure.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  const formData = new FormData();
                                  if (editedFeeStructure.programId !== undefined) formData.append('programId', String(editedFeeStructure.programId));
                                  if (editedFeeStructure.semesterId !== undefined) formData.append('semesterId', String(editedFeeStructure.semesterId));
                                  if (editedFeeStructure.totalAmount) formData.append('totalAmount', editedFeeStructure.totalAmount); // Corrected
                                  if (editedFeeStructure.description) formData.append('description', editedFeeStructure.description);
                                  handleSave(feeStructure.id, formData);
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
                                onClick={() => handleEdit(feeStructure)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeleteFeeStructure(feeStructure.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                                onClick={() => setShowDetails(feeStructure)}
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

      {/* Add Fee Structure Modal */}
      {showAddFeeStructure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Fee Structure</h2>
              <button
                onClick={() => setShowAddFeeStructure(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form action={handleAddFeeStructure}>
              <div className="grid grid-cols-1 gap-6 p-6">
                <div>
                  <label htmlFor="feeProgramId" className="block mb-2 text-sm font-medium text-gray-700">Program</label>
                  <select
                    id="feeProgramId"
                    name="programId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newFeeStructure.programId}
                    onChange={(e) => setNewFeeStructure({ ...newFeeStructure, programId: e.target.value })}
                    required
                  >
                    <option className="bg-emerald-800 text-white" value="">Select Program</option>
                    {referenceData.programs.map((program) => (
                      <option className="bg-emerald-800 text-white" key={program.id} value={program.id}>
                        {program.name} ({program.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="feeSemesterId" className="block mb-2 text-sm font-medium text-gray-700">Semester</label>
                  <select
                    id="feeSemesterId"
                    name="semesterId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newFeeStructure.semesterId}
                    onChange={(e) => setNewFeeStructure({ ...newFeeStructure, semesterId: e.target.value })}
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
                  <label htmlFor="feeTotalAmount" className="block mb-2 text-sm font-medium text-gray-700">Total Amount</label> {/* Corrected */}
                  <input
                    type="number"
                    step="0.01"
                    id="feeTotalAmount"
                    name="totalAmount" // Corrected
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newFeeStructure.totalAmount} // Corrected
                    onChange={(e) => setNewFeeStructure({ ...newFeeStructure, totalAmount: e.target.value })} // Corrected
                    required
                  />
                </div>
                {/* Removed Due Date input */}
                <div>
                  <label htmlFor="feeDescription" className="block mb-2 text-sm font-medium text-gray-700">Description (Optional)</label>
                  <textarea
                    id="feeDescription"
                    name="description"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newFeeStructure.description}
                    onChange={(e) => setNewFeeStructure({ ...newFeeStructure, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddFeeStructure(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-700 hover:to-pink-600 transition-all shadow-md"
                >
                  Create Fee Structure
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
              <h2 className="text-2xl font-bold text-gray-800">Fee Structure Details</h2>
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
                  <p className="text-sm text-gray-500">Program</p>
                  <p className="font-medium text-gray-800">{getProgramDisplayName(showDetails.programId)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Semester</p>
                  <p className="font-medium text-gray-800">{getSemesterDisplayName(showDetails.semesterId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p> {/* Corrected */}
                  <p className="font-medium text-gray-800">{showDetails.totalAmount}</p> {/* Corrected */}
                </div>
                {/* Removed Due Date display */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium text-gray-800">{showDetails.description || 'N/A'}</p>
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