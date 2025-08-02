// components/staff/staff-client-component.tsx
'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck } from "react-icons/fi";
import { createStaff, updateStaff, deleteStaff, getStaff } from "@/lib/actions/staff.action";

// Define the interface for a Staff member based on your schema's SelectStaff
// --- Type Definitions ---
// Define a more complete Staff interface
interface Staff {
  id: number;
  userId: number;
  departmentId: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  employmentDocumentsUrl: string | null;
  nationalIdPhotoUrl: string | null;
  academicCertificatesUrl: string | null;
  passportPhotoUrl: string | null;
  createdAt?: string | Date; // Optional, as it might not be in the initial data
  updatedAt?: string | Date; // Optional, as it might not be in the initial data
}

// Define the shape of the data returned by API actions
// interface ActionError {
//   error: string | null;
// }

// interface StaffActionSuccess {
//   // Define what a successful response looks like, e.g.,
//   message: string;
// }

// Define the types for your filter keys
// type StaffFilterKey = 'email' | 'firstName' | 'lastName' | 'position' | 'id';

interface ReferenceData {
  departments: { id: number; name: string }[];
}

interface StaffClientComponentProps {
  initialStaff: Staff[];
  referenceData: ReferenceData;
}
// --- End of Type Definitions ---

export default function StaffClientComponent({ initialStaff }: StaffClientComponentProps) {
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [search, setSearch] = useState('');
  const [filterBy, setFilterBy] = useState<StaffFilterKey>('email'); // Use the new type
  const [editId, setEditId] = useState<number | null>(null);
  const [editedStaff, setEditedStaff] = useState<Partial<Staff>>({});
  const [showDetails, setShowDetails] = useState<Staff | null>(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    userId: '',
    departmentId: '',
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    employmentDocumentsUrl: '',
    nationalIdPhotoUrl: '',
    academicCertificatesUrl: '',
    passportPhotoUrl: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filter staff members based on search and filterBy criteria
  const filteredStaff = staff.filter((member) => {
    // Safely access member properties using the `filterBy` key
    const value = member[filterBy as keyof Staff]?.toString().toLowerCase();
    return value ? value.includes(search.toLowerCase()) : false;
  });

  // Handle edit button click
  const handleEdit = (member: Staff) => {
    setEditId(member.id);
    setEditedStaff(member);
    setFormError(null);
    setFormSuccess(null);
  };

  // Handle save (update) action
  const handleSave = async (id: number, formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      // Assuming updateStaff returns a result that matches `ActionError`
      const result = await updateStaff(id, formData);
      if ('error' in result) {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to update staff member.';
        setFormError(errorMessage);
        return;
      }
      setFormSuccess('Staff member updated successfully!');
      setEditId(null);

      // Re-fetch all staff to ensure the local state is fully synchronized
      const updatedStaff = await getStaff();
      setStaff(updatedStaff.map((s: Staff) => ({
        ...s,
        createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
        updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
      })));
    } catch (error: unknown) { // Use unknown for type-safe error handling
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Failed to update staff member.');
      }
    }
  };

  // Handle add new staff action
  const handleAddStaff = async (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createStaff(formData);
      if ('error' in result) {
        setFormError(result.error ?? 'Failed to create staff member.');
        return;
      }
      setFormSuccess('Staff member created successfully!');
      setShowAddStaff(false);
      setNewStaff({
        userId: '',
        departmentId: '',
        firstName: '',
        lastName: '',
        email: '',
        position: '',
        employmentDocumentsUrl: '',
        nationalIdPhotoUrl: '',
        academicCertificatesUrl: '',
        passportPhotoUrl: '',
      });
      const updatedStaff = await getStaff();
      setStaff(updatedStaff.map((s: Staff) => ({
        ...s,
        createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
        updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
      })));
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Failed to create staff member.');
      }
    }
  };

  // Handle delete staff action
  const handleDeleteStaff = async (staffId: number) => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) return;
    try {
      const result = await deleteStaff(staffId);
      if ('error' in result) {
        setFormError(typeof result.error === 'string' ? result.error : 'Failed to delete staff member.');
        return;
      }
      setFormSuccess('Staff member deleted successfully!');
      setStaff(staff.filter((member) => member.id !== staffId));
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Failed to delete staff member.');
      }
    }
  };
  type StaffFilterKey = "email" | "firstName" | "lastName" | "position" | "id";


  return (
    <>
      {/* Search and filter bar */}
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search staff..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
  <select
    className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600"
    value={filterBy}
    onChange={(e) => setFilterBy(e.target.value as StaffFilterKey)}
  >
    <option value="email">Email</option>
    <option value="firstName">First Name</option>
    <option value="lastName">Last Name</option>
    <option value="position">Position</option>
    <option value="id">ID</option>
  </select>
        </div>
        <button
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddStaff(true)}
        >
          <FiPlus /> Add Staff
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
                      {/* <th className="p-4 text-left w-12">Select</th> */}
                      <th className="p-4 text-left w-20">ID</th>
                      <th className="p-4 text-left">First Name</th>
                      <th className="p-4 text-left">Last Name</th>
                      <th className="p-4 text-left">Email</th>
                      <th className="p-4 text-left">Position</th>
                      <th className="p-4 text-left w-24">Dept ID</th>
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredStaff.map((member: Staff) => (
                      <tr key={member.id} className="hover:bg-emerald-50/50 transition-colors">
                        {/* <td className="p-4">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                            checked={selectedStaffId === member.id}
                            onChange={() =>
                              setSelectedStaffId(selectedStaffId === member.id ? null : member.id)
                            }
                          />
                        </td> */}
                        <td className="p-4 font-medium">{member.id}</td>
                        <td className="p-4">
                          {editId === member.id ? (
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedStaff.firstName || ''}
                              onChange={(e) => setEditedStaff({ ...editedStaff, firstName: e.target.value })}
                            />
                          ) : (
                            member.firstName
                          )}
                        </td>
                        <td className="p-4">
                          {editId === member.id ? (
                            <input
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedStaff.lastName || ''}
                              onChange={(e) => setEditedStaff({ ...editedStaff, lastName: e.target.value })}
                            />
                          ) : (
                            member.lastName
                          )}
                        </td>
                        <td className="p-4">
                          {editId === member.id ? (
                            <input
                              type="email"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedStaff.email || ''}
                              onChange={(e) => setEditedStaff({ ...editedStaff, email: e.target.value })}
                            />
                          ) : (
                            member.email
                          )}
                        </td>
                        <td className="p-4">
                          {editId === member.id ? (
                            <input
                              type="text"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedStaff.position || ''}
                              onChange={(e) => setEditedStaff({ ...editedStaff, position: e.target.value })}
                            />
                          ) : (
                            member.position
                          )}
                        </td>
                        <td className="p-4">
                          {editId === member.id ? (
                            <input
                              type="number"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedStaff.departmentId || ''}
                              onChange={(e) => setEditedStaff({ ...editedStaff, departmentId: Number(e.target.value) })}
                            />
                          ) : (
                            member.departmentId
                          )}
                        </td>
                        <td className="p-4 flex gap-3 items-center">
                          {editId === member.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  const formData = new FormData();
                                  if (editedStaff.userId !== undefined) formData.append('userId', String(editedStaff.userId));
                                  if (editedStaff.departmentId !== undefined) formData.append('departmentId', String(editedStaff.departmentId));
                                  if (editedStaff.firstName) formData.append('firstName', editedStaff.firstName);
                                  if (editedStaff.lastName) formData.append('lastName', editedStaff.lastName);
                                  if (editedStaff.email) formData.append('email', editedStaff.email);
                                  if (editedStaff.position) formData.append('position', editedStaff.position);
                                  if (editedStaff.employmentDocumentsUrl) formData.append('employmentDocumentsUrl', editedStaff.employmentDocumentsUrl);
                                  if (editedStaff.nationalIdPhotoUrl) formData.append('nationalIdPhotoUrl', editedStaff.nationalIdPhotoUrl);
                                  if (editedStaff.academicCertificatesUrl) formData.append('academicCertificatesUrl', editedStaff.academicCertificatesUrl);
                                  if (editedStaff.passportPhotoUrl) formData.append('passportPhotoUrl', editedStaff.passportPhotoUrl);
                                  handleSave(member.id, formData);
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
                                onClick={() => handleEdit(member)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeleteStaff(member.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                                onClick={() => setShowDetails(member)}
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

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Staff Member</h2>
              <button
                onClick={() => setShowAddStaff(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form action={handleAddStaff}>
              <div className="grid grid-cols-2 gap-6 p-6">
                <div>
                  <label htmlFor="staffUserId" className="block mb-2 text-sm font-medium text-gray-700">User ID</label>
                  <input
                    type="number"
                    id="staffUserId"
                    name="userId" // Important for FormData
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newStaff.userId}
                    onChange={(e) => setNewStaff({ ...newStaff, userId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="staffFirstName" className="block mb-2 text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    id="staffFirstName"
                    name="firstName"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newStaff.firstName}
                    onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="staffLastName" className="block mb-2 text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    id="staffLastName"
                    name="lastName"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newStaff.lastName}
                    onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="staffEmail" className="block mb-2 text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    id="staffEmail"
                    name="email"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="staffPosition" className="block mb-2 text-sm font-medium text-gray-700">Position</label>
                  <input
                    type="text"
                    id="staffPosition"
                    name="position"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newStaff.position}
                    onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="staffDepartmentId" className="block mb-2 text-sm font-medium text-gray-700">Department ID</label>
                  <input
                    type="number"
                    id="staffDepartmentId"
                    name="departmentId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newStaff.departmentId}
                    onChange={(e) => setNewStaff({ ...newStaff, departmentId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="employmentDocumentsUrl" className="block mb-2 text-sm font-medium text-gray-700">Employment Docs URL (Optional)</label>
                  <input
                    type="text"
                    id="employmentDocumentsUrl"
                    name="employmentDocumentsUrl"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newStaff.employmentDocumentsUrl}
                    onChange={(e) => setNewStaff({ ...newStaff, employmentDocumentsUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="nationalIdPhotoUrl" className="block mb-2 text-sm font-medium text-gray-700">National ID Photo URL (Optional)</label>
                  <input
                    type="text"
                    id="nationalIdPhotoUrl"
                    name="nationalIdPhotoUrl"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newStaff.nationalIdPhotoUrl}
                    onChange={(e) => setNewStaff({ ...newStaff, nationalIdPhotoUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="academicCertificatesUrl" className="block mb-2 text-sm font-medium text-gray-700">Academic Certificates URL (Optional)</label>
                  <input
                    type="text"
                    id="academicCertificatesUrl"
                    name="academicCertificatesUrl"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newStaff.academicCertificatesUrl}
                    onChange={(e) => setNewStaff({ ...newStaff, academicCertificatesUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="passportPhotoUrl" className="block mb-2 text-sm font-medium text-gray-700">Passport Photo URL (Optional)</label>
                  <input
                    type="text"
                    id="passportPhotoUrl"
                    name="passportPhotoUrl"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newStaff.passportPhotoUrl}
                    onChange={(e) => setNewStaff({ ...newStaff, passportPhotoUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddStaff(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-700 hover:to-pink-600 transition-all shadow-md"
                >
                  Create Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Staff Details</h2>
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
                  <p className="font-medium">{showDetails.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-medium">{showDetails.userId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">First Name</p>
                  <p className="font-medium">{showDetails.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p className="font-medium">{showDetails.lastName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{showDetails.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-medium">{showDetails.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department ID</p>
                  <p className="font-medium">{showDetails.departmentId}</p>
                </div>
                {showDetails.employmentDocumentsUrl && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Employment Documents</p>
                    <a href={showDetails.employmentDocumentsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Documents</a>
                  </div>
                )}
                {showDetails.nationalIdPhotoUrl && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">National ID Photo</p>
                    <a href={showDetails.nationalIdPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Photo</a>
                  </div>
                )}
                {showDetails.academicCertificatesUrl && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Academic Certificates</p>
                    <a href={showDetails.academicCertificatesUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Certificates</a>
                  </div>
                )}
                {showDetails.passportPhotoUrl && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Passport Photo</p>
                    <a href={showDetails.passportPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Photo</a>
                  </div>
                )}
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