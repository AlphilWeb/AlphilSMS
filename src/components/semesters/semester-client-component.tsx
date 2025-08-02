// components/semesters/semester-client-component.tsx
'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck } from "react-icons/fi";
import { createSemester, updateSemester, deleteSemester, getSemesters } from "@/lib/actions/semester.action";

interface Semester {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

interface SemestersClientComponentProps {
  initialSemesters: Semester[];
}

export default function SemestersClientComponent({ initialSemesters }: SemestersClientComponentProps) {
  const [semesters, setSemesters] = useState<Semester[]>(initialSemesters);
  const [search, setSearch] = useState<string>("");
  const [filterBy] = useState<keyof Semester>("name");
  const [editId, setEditId] = useState<number | null>(null);
  const [editedSemester, setEditedSemester] = useState<Partial<Semester>>({});
  const [showDetails, setShowDetails] = useState<Semester | null>(null);
  const [showAddSemester, setShowAddSemester] = useState<boolean>(false);
  const [newSemester, setNewSemester] = useState<Omit<Semester, "id">>({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const filteredSemesters = semesters.filter((semester) => {
    const value = semester[filterBy]?.toString().toLowerCase();
    return value.includes(search.toLowerCase());
  });

  const handleEdit = (semester: Semester) => {
    setEditId(semester.id);
    setEditedSemester(semester);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSave = async (id: number, formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await updateSemester(id, formData);
      if ('error' in result) {
        setFormError("Failed to update semester.");
        return;
      }
      setFormSuccess("Semester updated successfully!");
      setEditId(null);
      const updatedSemesters = await getSemesters();
      setSemesters(updatedSemesters);
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Unknown error occurred.");
      }
    }
  };

  const handleAddSemester = async (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createSemester(formData);
      if ('error' in result) {
        setFormError("Failed to create semester.");
        return;
      }
      setFormSuccess("Semester created successfully!");
      setShowAddSemester(false);
      setNewSemester({ name: "", startDate: "", endDate: "" });
      const updatedSemesters = await getSemesters();
      setSemesters(updatedSemesters);
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Unknown error occurred.");
      }
    }
  };

  const handleDeleteSemester = async (semesterId: number) => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm("Are you sure you want to delete this semester? This action cannot be undone.")) return;
    try {
      const result = await deleteSemester(semesterId);
      if ('error' in result) {
        setFormError("Failed to delete semester.");
        return;
      }
      setFormSuccess("Semester deleted successfully!");
      setSemesters((prev) => prev.filter((s) => s.id !== semesterId));
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Unknown error occurred.");
      }
    }
  };

  // const handleNewSemesterChange = (e: ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;
  //   setNewSemester((prev) => ({ ...prev, [name]: value }));
  // };

  // const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value);

  // const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
  //   setFilterBy(e.target.value as keyof Semester);
  // };

  return (
    <>
      {/* Search and filter bar */}
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search semesters..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {/* <select
            className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option className="bg-emerald-800" value="name">Name</option>
            <option className="bg-emerald-800" value="id">ID</option>
            <option className="bg-emerald-800" value="startDate">Start Date</option>
            <option className="bg-emerald-800" value="endDate">End Date</option>
          </select> */}
        </div>
        <button
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddSemester(true)}
        >
          <FiPlus /> Add Semester
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
                      <th className="p-4 text-left">Start Date</th>
                      <th className="p-4 text-left">End Date</th>
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredSemesters.map((semester: Semester) => (
                      <tr key={semester.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-800">{semester.id}</td>
                        <td className="p-4">
                          {editId === semester.id ? (
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedSemester.name || ''}
                              onChange={(e) => setEditedSemester({ ...editedSemester, name: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{semester.name}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === semester.id ? (
                            <input
                              type="date"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedSemester.startDate || ''}
                              onChange={(e) => setEditedSemester({ ...editedSemester, startDate: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{semester.startDate}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === semester.id ? (
                            <input
                              type="date"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedSemester.endDate || ''}
                              onChange={(e) => setEditedSemester({ ...editedSemester, endDate: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{semester.endDate}</span>
                          )}
                        </td>
                        <td className="p-4 flex gap-3 items-center">
                          {editId === semester.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  const formData = new FormData();
                                  if (editedSemester.name) formData.append('name', editedSemester.name);
                                  if (editedSemester.startDate) formData.append('startDate', editedSemester.startDate);
                                  if (editedSemester.endDate) formData.append('endDate', editedSemester.endDate);
                                  handleSave(semester.id, formData);
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
                                onClick={() => handleEdit(semester)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeleteSemester(semester.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                                onClick={() => setShowDetails(semester)}
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

      {/* Add Semester Modal */}
      {showAddSemester && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Semester</h2>
              <button
                onClick={() => setShowAddSemester(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form action={handleAddSemester}>
              <div className="grid grid-cols-1 gap-6 p-6">
                <div>
                  <label htmlFor="semesterName" className="block mb-2 text-sm font-medium text-gray-700">Semester Name</label>
                  <input
                    type="text"
                    id="semesterName"
                    name="name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newSemester.name}
                    onChange={(e) => setNewSemester({ ...newSemester, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="startDate" className="block mb-2 text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newSemester.startDate}
                    onChange={(e) => setNewSemester({ ...newSemester, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newSemester.endDate}
                    onChange={(e) => setNewSemester({ ...newSemester, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddSemester(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-700 hover:to-pink-600 transition-all shadow-md"
                >
                  Create Semester
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
              <h2 className="text-2xl font-bold text-gray-800">Semester Details</h2>
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
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium text-gray-800">{showDetails.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium text-gray-800">{showDetails.endDate}</p>
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