// components/departments/department-client-component.tsx
'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck } from "react-icons/fi";
import { createDepartment, updateDepartment, deleteDepartment, getDepartments } from "@/lib/actions/department.action";

// Define the interface for a Department based on your schema's SelectDepartment
interface Department {
  id: number;
  name: string;
  headOfDepartmentId: number | null;
}

// Define the interface for reference data (for headOfDepartmentId dropdown)
interface ReferenceData {
  staff: { id: number; firstName: string; lastName: string }[];
}

interface DepartmentsClientComponentProps {
  initialDepartments: Department[];
  referenceData: ReferenceData;
}

export default function DepartmentsClientComponent({ initialDepartments, referenceData }: DepartmentsClientComponentProps) {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("name"); // Default filter
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editedDepartment, setEditedDepartment] = useState<Partial<Department>>({});
  const [showDetails, setShowDetails] = useState<Department | null>(null);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    headOfDepartmentId: "", // Keep as string for select value
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filter departments based on search and filterBy criteria
  const filteredDepartments = departments.filter((department: Department) => {
    const value = (department as any)[filterBy]?.toString().toLowerCase();
    return value ? value.includes(search.toLowerCase()) : false;
  });

  // Handle edit button click
  const handleEdit = (department: Department) => {
    setEditId(department.id);
    setEditedDepartment(department);
    setFormError(null);
    setFormSuccess(null);
  };

  // Handle save (update) action
  const handleSave = async (id: number, formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await updateDepartment(id, formData);
      if (result?.error) {
        setFormError(result.error ? String(result.error) : null);
        return;
      }
      setFormSuccess('Department updated successfully!');
      setEditId(null);
      // Re-fetch all departments to ensure the local state is fully synchronized
      const updatedDepartments = await getDepartments();
      setDepartments(updatedDepartments);
    } catch (error: any) {
      setFormError(error.message || "Failed to update department.");
    }
  };

  // Handle add new department action
  const handleAddDepartment = async (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createDepartment(formData);
      if ('error' in result) {
        setFormError(result.error ?? "Failed to create department.");
        return;
      }
      setFormSuccess('Department created successfully!');
      setShowAddDepartment(false);
      setNewDepartment({ // Reset form fields
        name: "", headOfDepartmentId: ""
      });
      // Re-fetch all departments to ensure the local state is fully synchronized
      const updatedDepartments = await getDepartments();
      setDepartments(updatedDepartments);
    } catch (error: any) {
      setFormError(error.message || "Failed to create department.");
    }
  };

  // Handle delete department action
  const handleDeleteDepartment = async (departmentId: number) => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm("Are you sure you want to delete this department? This action cannot be undone.")) return;
    try {
      const result = await deleteDepartment(departmentId);
      if ('error' in result) {
        setFormError(result.error ? String(result.error) : null);
        return;
      }
      setFormSuccess('Department deleted successfully!');
      setDepartments(departments.filter((department) => department.id !== departmentId));
    } catch (error: any) {
      setFormError(error.message || "Failed to delete department.");
    }
  };

  return (
    <>
      {/* Search and filter bar */}
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search departments..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option className="bg-emerald-800" value="name">Name</option>
            <option className="bg-emerald-800" value="id">ID</option>
            <option className="bg-emerald-800" value="headOfDepartmentId">Head ID</option>
          </select>
        </div>
        <button
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddDepartment(true)}
        >
          <FiPlus /> Add Department
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
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Head of Department (ID)</th>
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredDepartments.map((department: Department) => (
                      <tr key={department.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="p-4 font-medium">{department.id}</td>
                        <td className="p-4">
                          {editId === department.id ? (
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedDepartment.name || ''}
                              onChange={(e) => setEditedDepartment({ ...editedDepartment, name: e.target.value })}
                            />
                          ) : (
                            department.name
                          )}
                        </td>
                        <td className="p-4">
                          {editId === department.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedDepartment.headOfDepartmentId || ''}
                              onChange={(e) => setEditedDepartment({ ...editedDepartment, headOfDepartmentId: Number(e.target.value) || null })}
                            >
                              <option className="bg-emerald-800 text-white" value="">None</option>
                              {referenceData.staff.map((staffMember) => (
                                <option className="bg-emerald-800 text-white" key={staffMember.id} value={staffMember.id}>
                                  {staffMember.firstName} {staffMember.lastName} (ID: {staffMember.id})
                                </option>
                              ))}
                            </select>
                          ) : (
                            department.headOfDepartmentId ? (
                              // Find the staff member's name for display
                              referenceData.staff.find(s => s.id === department.headOfDepartmentId)?.firstName + ' ' +
                              referenceData.staff.find(s => s.id === department.headOfDepartmentId)?.lastName +
                              ` (ID: ${department.headOfDepartmentId})`
                            ) : (
                              'N/A'
                            )
                          )}
                        </td>
                        <td className="p-4 flex gap-3 items-center">
                          {editId === department.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  const formData = new FormData();
                                  if (editedDepartment.name) formData.append('name', editedDepartment.name);
                                  // Append headOfDepartmentId as string, handling null explicitly
                                  formData.append('headOfDepartmentId', editedDepartment.headOfDepartmentId !== null && editedDepartment.headOfDepartmentId !== undefined ? String(editedDepartment.headOfDepartmentId) : '');
                                  handleSave(department.id, formData);
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
                                onClick={() => handleEdit(department)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeleteDepartment(department.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                                onClick={() => setShowDetails(department)}
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

      {/* Add Department Modal */}
      {showAddDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Department</h2>
              <button
                onClick={() => setShowAddDepartment(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form action={handleAddDepartment}>
              <div className="grid grid-cols-1 gap-6 p-6"> {/* Changed to 1 column for simplicity */}
                <div>
                  <label htmlFor="departmentName" className="block mb-2 text-sm font-medium text-gray-700">Department Name</label>
                  <input
                    type="text"
                    id="departmentName"
                    name="name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="headOfDepartmentId" className="block mb-2 text-sm font-medium text-gray-700">Head of Department (Optional)</label>
                  <select
                    id="headOfDepartmentId"
                    name="headOfDepartmentId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newDepartment.headOfDepartmentId}
                    onChange={(e) => setNewDepartment({ ...newDepartment, headOfDepartmentId: e.target.value })}
                  >
                    <option className="bg-emerald-800 text-white" value="">None</option>
                    {referenceData.staff.map((staffMember) => (
                      <option className="bg-emerald-800 text-white" key={staffMember.id} value={staffMember.id}>
                        {staffMember.firstName} {staffMember.lastName} (ID: {staffMember.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddDepartment(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-700 hover:to-pink-600 transition-all shadow-md"
                >
                  Create Department
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
              <h2 className="text-2xl font-bold text-gray-800">Department Details</h2>
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
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-800">{showDetails.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Head of Department</p>
                  <p className="font-medium text-gray-800">
                    {showDetails.headOfDepartmentId ? (
                      referenceData.staff.find(s => s.id === showDetails.headOfDepartmentId)?.firstName + ' ' +
                      referenceData.staff.find(s => s.id === showDetails.headOfDepartmentId)?.lastName +
                      ` (ID: ${showDetails.headOfDepartmentId})`
                    ) : (
                      'N/A'
                    )}
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