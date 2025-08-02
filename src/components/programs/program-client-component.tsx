// components/programs/program-client-component.tsx
'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck } from "react-icons/fi";
import { createProgram, updateProgram, deleteProgram, getPrograms } from "@/lib/actions/program.action";

// Define the interface for a Program based on your EXACT Drizzle schema
interface Program {
  id: number;
  name: string;
  departmentId: number;
  code: string;
  durationSemesters: number;
}

// Define the interface for reference data (for departmentId dropdown)
interface ReferenceData {
  departments: { id: number; name: string }[];
}

interface ProgramsClientComponentProps {
  initialPrograms: Program[];
  referenceData: ReferenceData;
}

type FilterableProgramKeys = keyof Pick<Program, "id" | "name" | "departmentId" | "code">;

export default function ProgramsClientComponent({ initialPrograms, referenceData }: ProgramsClientComponentProps) {
  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState<FilterableProgramKeys>("name");
  // const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editedProgram, setEditedProgram] = useState<Partial<Program>>({});
  const [showDetails, setShowDetails] = useState<Program | null>(null);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [newProgram, setNewProgram] = useState({
    name: "",
    departmentId: "",
    code: "",
    durationSemesters: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const filteredPrograms = programs.filter((program) => {
    const value = String(program[filterBy]).toLowerCase();
    return value.includes(search.toLowerCase());
  });

  const handleEdit = (program: Program) => {
    setEditId(program.id);
    setEditedProgram(program);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSave = async (id: number, formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await updateProgram(id, formData);
      if (result?.error) {
        setFormError(result.error ?? null);
        return;
      }
      setFormSuccess('Program updated successfully!');
      setEditId(null);
      const updatedPrograms = await getPrograms();
      setPrograms(updatedPrograms);
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Failed to update program.");
      }
    }
  };

  const handleAddProgram = async (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createProgram(formData);
      if ('error' in result) {
        setFormError(result.error ?? "Failed to create program.");
        return;
      }
      setFormSuccess('Program created successfully!');
      setShowAddProgram(false);
      setNewProgram({ name: "", departmentId: "", code: "", durationSemesters: "" });
      const updatedPrograms = await getPrograms();
      setPrograms(updatedPrograms);
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Failed to create program.");
      }
    }
  };

  const handleDeleteProgram = async (programId: number) => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm("Are you sure you want to delete this program?")) return;
    try {
      const result = await deleteProgram(programId);
      if ('error' in result) {
        setFormError(result.error ? "Failed to delete program." : null);
        return;
      }
      setFormSuccess('Program deleted successfully!');
      setPrograms(programs.filter((program) => program.id !== programId));
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Failed to delete program.");
      }
    }
  };

  return (
    <>
      {/* Search and filter bar */}
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search programs..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
<select
  className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600"
  value={filterBy}
  onChange={(e) => setFilterBy(e.target.value as 'id' | 'name' | 'departmentId' | 'code')}
>
  <option value="id">ID</option>
  <option value="name">Name</option>
  <option value="departmentId">Department</option>
  <option value="code">Code</option>
</select>
        </div>
        <button
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddProgram(true)}
        >
          <FiPlus /> Add Program
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
                      <th className="p-4 text-left">Code</th>
                      <th className="p-4 text-left">Duration (Semesters)</th>
                      <th className="p-4 text-left">Department (ID)</th>
                      {/* Removed description header */}
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredPrograms.map((program: Program) => (
                      <tr key={program.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-800">{program.id}</td>
                        <td className="p-4">
                          {editId === program.id ? (
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedProgram.name || ''}
                              onChange={(e) => setEditedProgram({ ...editedProgram, name: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{program.name}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === program.id ? (
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedProgram.code || ''}
                              onChange={(e) => setEditedProgram({ ...editedProgram, code: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{program.code}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === program.id ? (
                            <input
                              type="number"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedProgram.durationSemesters || ''}
                              onChange={(e) => setEditedProgram({ ...editedProgram, durationSemesters: Number(e.target.value) })}
                            />
                          ) : (
                            <span className="text-gray-800">{program.durationSemesters}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === program.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedProgram.departmentId || ''}
                              onChange={(e) => setEditedProgram({ ...editedProgram, departmentId: Number(e.target.value) })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select Department</option>
                              {referenceData.departments.map((dept) => (
                                <option className="bg-emerald-800 text-white" key={dept.id} value={dept.id}>
                                  {dept.name} (ID: {dept.id})
                                </option>
                              ))}
                            </select>
                          ) : (
                            program.departmentId ? (
                              <span className="text-gray-800">
                                {referenceData.departments.find(d => d.id === program.departmentId)?.name +
                                ` (ID: ${program.departmentId})`}
                              </span>
                            ) : (
                              <span className="text-gray-800">N/A</span>
                            )
                          )}
                        </td>
                        {/* Removed description cell */}
                        <td className="p-4 flex gap-3 items-center">
                          {editId === program.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  const formData = new FormData();
                                  if (editedProgram.name) formData.append('name', editedProgram.name);
                                  if (editedProgram.departmentId !== undefined) formData.append('departmentId', String(editedProgram.departmentId));
                                  if (editedProgram.code) formData.append('code', editedProgram.code);
                                  if (editedProgram.durationSemesters !== undefined) formData.append('durationSemesters', String(editedProgram.durationSemesters));
                                  handleSave(program.id, formData);
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
                                onClick={() => handleEdit(program)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeleteProgram(program.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                                onClick={() => setShowDetails(program)}
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

      {/* Add Program Modal */}
      {showAddProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Program</h2>
              <button
                onClick={() => setShowAddProgram(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form action={handleAddProgram}>
              <div className="grid grid-cols-1 gap-6 p-6">
                <div>
                  <label htmlFor="programName" className="block mb-2 text-sm font-medium text-gray-700">Program Name</label>
                  <input
                    type="text"
                    id="programName"
                    name="name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newProgram.name}
                    onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="programCode" className="block mb-2 text-sm font-medium text-gray-700">Program Code</label>
                  <input
                    type="text"
                    id="programCode"
                    name="code"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newProgram.code}
                    onChange={(e) => setNewProgram({ ...newProgram, code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="programDurationSemesters" className="block mb-2 text-sm font-medium text-gray-700">Duration (Semesters)</label>
                  <input
                    type="number"
                    id="programDurationSemesters"
                    name="durationSemesters"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newProgram.durationSemesters}
                    onChange={(e) => setNewProgram({ ...newProgram, durationSemesters: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="programDepartmentId" className="block mb-2 text-sm font-medium text-gray-700">Department</label>
                  <select
                    id="programDepartmentId"
                    name="departmentId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newProgram.departmentId}
                    onChange={(e) => setNewProgram({ ...newProgram, departmentId: e.target.value })}
                    required
                  >
                    <option className="bg-emerald-800 text-white" value="">Select Department</option>
                    {referenceData.departments.map((dept) => (
                      <option className="bg-emerald-800 text-white" key={dept.id} value={dept.id}>
                        {dept.name} (ID: {dept.id})
                      </option>
                    ))}
                  </select>
                </div>
                {/* Removed description input */}
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddProgram(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-700 hover:to-pink-600 transition-all shadow-md"
                >
                  Create Program
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
              <h2 className="text-2xl font-bold text-gray-800">Program Details</h2>
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
                <div>
                  <p className="text-sm text-gray-500">Code</p>
                  <p className="font-medium text-gray-800">{showDetails.code}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-800">{showDetails.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium text-gray-800">
                    {showDetails.departmentId ? (
                      referenceData.departments.find(d => d.id === showDetails.departmentId)?.name +
                      ` (ID: ${showDetails.departmentId})`
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration (Semesters)</p>
                  <p className="font-medium text-gray-800">{showDetails.durationSemesters}</p>
                </div>
                {/* Removed description display */}
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