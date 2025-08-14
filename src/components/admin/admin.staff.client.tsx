
// components/admin/admin.staff.client.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getAllStaff,
  getStaffDetails,
  createStaff,
  updateStaff,
  deleteStaff,
  updateStaffDocuments,
  searchStaff,
  type StaffWithDetails,
  type StaffDetails,
  type StaffCreateData,
  StaffDeletePayload,
//   type StaffUpdateData
} from '@/lib/actions/admin/staff.actions';

import {
  FiUser, FiPlus, FiEdit2, FiTrash2,
  FiLoader, FiX, FiSearch, FiInfo,
  FiCheck, FiFileText, FiCreditCard, FiAward, FiCamera
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';
import { format } from 'date-fns';

export default function AdminStaffClient() {
  const [staff, setStaff] = useState<StaffWithDetails[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    staff: true,
    details: false,
    create: false,
    update: false,
    documents: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<StaffCreateData>>({
    firstName: '',
    lastName: '',
    email: '',
    idNumber: '',
    departmentId: 1,
    position: '',
    roleId: 2 // Assuming 2 is the default staff role ID
  });

  const [documentsFormData, setDocumentsFormData] = useState({
    employmentDocumentsUrl: '',
    nationalIdPhotoUrl: '',
    academicCertificatesUrl: '',
    passportPhotoUrl: ''
  });

  // Fetch all staff on component mount and when search changes
  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(prev => ({ ...prev, staff: true }));
        setError(null);
        const staffData = searchQuery.trim() ? await searchStaff(searchQuery) : await getAllStaff();
        setStaff(staffData);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load staff');
      } finally {
        setLoading(prev => ({ ...prev, staff: false }));
      }
    };

    loadStaff();
  }, [searchQuery]);

  // Load staff details when selected
  const handleSelectStaff = async (staffId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      setError(null);
      
      const details = await getStaffDetails(staffId);
      setSelectedStaff(details);
      setFormData({
        firstName: details.firstName,
        lastName: details.lastName,
        email: details.email,
        idNumber: details.idNumber || '',
        departmentId: details.department.id,
        position: details.position,
        roleId: details.user.role.id
      });
      setDocumentsFormData({
        employmentDocumentsUrl: details.employmentDocumentsUrl || '',
        nationalIdPhotoUrl: details.nationalIdPhotoUrl || '',
        academicCertificatesUrl: details.academicCertificatesUrl || '',
        passportPhotoUrl: details.passportPhotoUrl || ''
      });
      setIsViewModalOpen(true);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load staff details');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Create new staff
  const handleCreateStaff = async () => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      if (!formData.firstName || !formData.lastName || !formData.email || !formData.position || !formData.departmentId || !formData.roleId) {
        throw new ActionError('All required fields must be filled');
      }

      const newStaff = await createStaff({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        idNumber: formData.idNumber,
        departmentId: formData.departmentId,
        position: formData.position,
        roleId: formData.roleId
      });
      
      setStaff(prev => [...prev, {
        id: newStaff.id,
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        email: newStaff.email,
        idNumber: newStaff.idNumber,
        position: newStaff.position,
        department: {
          id: formData.departmentId!,
          name: '' // Will be updated when selected
        },
        user: {
          id: 0, // Temporary, will be updated
          role: {
            id: formData.roleId!,
            name: '' // Will be updated
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
      
      setIsCreateModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        idNumber: '',
        departmentId: 1,
        position: '',
        roleId: 2
      });
      setSuccess('Staff member created successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to create staff member');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update staff
  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);

      const updatedStaff = await updateStaff(selectedStaff.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        idNumber: formData.idNumber,
        departmentId: formData.departmentId,
        position: formData.position,
        roleId: formData.roleId
      });
      
      setStaff(prev => prev.map(staff => 
        staff.id === selectedStaff.id 
          ? { 
              ...staff, 
              firstName: updatedStaff.firstName,
              lastName: updatedStaff.lastName,
              email: updatedStaff.email,
              idNumber: updatedStaff.idNumber,
              position: updatedStaff.position,
              department: {
                id: formData.departmentId!,
                name: staff.department.name
              },
              user: {
                id: staff.user.id,
                role: {
                  id: formData.roleId!,
                  name: staff.user.role.name
                }
              },
              updatedAt: new Date()
            } 
          : staff
      ));
      
      setSelectedStaff(prev => prev ? { 
        ...prev, 
        firstName: updatedStaff.firstName,
        lastName: updatedStaff.lastName,
        email: updatedStaff.email,
        idNumber: updatedStaff.idNumber,
        position: updatedStaff.position,
        department: {
          id: formData.departmentId!,
          name: prev.department.name
        },
        user: {
          id: prev.user.id,
          role: {
            id: formData.roleId!,
            name: prev.user.role.name
          }
        },
        updatedAt: new Date()
      } : null);
      
      setIsEditModalOpen(false);
      setSuccess('Staff member updated successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to update staff member');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Update staff documents
  const handleUpdateDocuments = async () => {
    if (!selectedStaff) return;

    try {
      setLoading(prev => ({ ...prev, documents: true }));
      setError(null);

      const updatedStaff = await updateStaffDocuments(selectedStaff.id, {
        employmentDocumentsUrl: documentsFormData.employmentDocumentsUrl || null,
        nationalIdPhotoUrl: documentsFormData.nationalIdPhotoUrl || null,
        academicCertificatesUrl: documentsFormData.academicCertificatesUrl || null,
        passportPhotoUrl: documentsFormData.passportPhotoUrl || null
      });
      
      setSelectedStaff(prev => prev ? { 
        ...prev, 
        employmentDocumentsUrl: updatedStaff.employmentDocumentsUrl,
        nationalIdPhotoUrl: updatedStaff.nationalIdPhotoUrl,
        academicCertificatesUrl: updatedStaff.academicCertificatesUrl,
        passportPhotoUrl: updatedStaff.passportPhotoUrl,
        updatedAt: new Date()
      } : null);
      
      setIsDocumentsModalOpen(false);
      setSuccess('Staff documents updated successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to update staff documents');
    } finally {
      setLoading(prev => ({ ...prev, documents: false }));
    }
  };

  // Delete staff
const handleDeleteStaff = async (staffMember?: StaffDeletePayload) => {
  const targetStaff = staffMember || selectedStaff;
  if (!targetStaff) return;

  if (!confirm(`Are you sure you want to delete ${targetStaff.firstName}-${targetStaff.lastName}? This action cannot be undone.`)) return;

  try {
    setError(null);
    await deleteStaff(targetStaff.id);

    setStaff(prev => prev.filter(s => s.id !== targetStaff.id));

    // Only reset modal state if we're deleting the selected staff
    if (!staffMember) {
      setSelectedStaff(null);
      setIsViewModalOpen(false);
    }

    setSuccess('Staff member deleted successfully!');
  } catch (err) {
    setError(err instanceof ActionError ? err.message : 'Failed to delete staff member');
  }
};


  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 flex items-center gap-2"
        >
          <FiPlus size={16} /> New Staff
        </button>
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

      <div className="grid grid-cols-1 gap-8">
        {/* Search and Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="relative w-full max-w-md">
              <div className="text-black absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-black pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {loading.staff ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ) : staff.length === 0 ? (
            <div className="p-6 text-center">
              <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No staff members found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staff.map((staffMember) => (
                    <tr key={staffMember.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <FiUser className="text-emerald-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {staffMember.firstName} {staffMember.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {staffMember.idNumber || 'No ID'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{staffMember.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{staffMember.department.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{staffMember.position}</div>
                        <div className="text-sm text-gray-500">
                          Joined {formatDate(staffMember.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleSelectStaff(staffMember.id)}
                          className="text-emerald-600 hover:text-emerald-900 mr-4"
                          title="View Details"
                        >
                          <FiInfo />
                        </button>
                        <button
                          onClick={() => {
                            handleSelectStaff(staffMember.id);
                            setIsViewModalOpen(false);
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
<button
  onClick={() => handleDeleteStaff(staffMember)}
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

      {/* Create Staff Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> New Staff Member
              </h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="john.doe@university.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number (optional)
                </label>
                <input
                  type="text"
                  value={formData.idNumber || ''}
                  onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="EMP123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position || ''}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="Professor"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department ID
                  </label>
                  <input
                    type="number"
                    value={formData.departmentId || ''}
                    onChange={(e) => setFormData({...formData, departmentId: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role ID
                  </label>
                  <input
                    type="number"
                    value={formData.roleId || ''}
                    onChange={(e) => setFormData({...formData, roleId: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="2"
                  />
                </div>
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
                onClick={handleCreateStaff}
                disabled={!formData.firstName || !formData.lastName || !formData.email || 
                         !formData.position || !formData.departmentId || !formData.roleId || loading.create}
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
                    Create Staff
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Staff Details Modal */}
      {isViewModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800">Staff Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <FiUser className="text-emerald-600 text-2xl" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedStaff.firstName} {selectedStaff.lastName}
                  </h2>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedStaff.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">ID Number</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedStaff.idNumber || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Position</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedStaff.position}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Department</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedStaff.department.name}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Role</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedStaff.user.role.name}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Date Joined</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedStaff.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <FiFileText /> Employment Documents
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedStaff.employmentDocumentsUrl ? (
                            <a href={selectedStaff.employmentDocumentsUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                              View Document
                            </a>
                          ) : 'Not uploaded'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <FiCreditCard /> National ID
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedStaff.nationalIdPhotoUrl ? (
                            <a href={selectedStaff.nationalIdPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                              View Document
                            </a>
                          ) : 'Not uploaded'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <FiAward /> Academic Certificates
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedStaff.academicCertificatesUrl ? (
                            <a href={selectedStaff.academicCertificatesUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                              View Document
                            </a>
                          ) : 'Not uploaded'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <FiCamera /> Passport Photo
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedStaff.passportPhotoUrl ? (
                            <a href={selectedStaff.passportPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                              View Photo
                            </a>
                          ) : 'Not uploaded'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsDocumentsModalOpen(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md flex items-center gap-2"
              >
                <FiEdit2 size={16} />
                Update Documents
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
              >
                <FiEdit2 size={16} />
                Edit Staff
              </button>
<button
  onClick={() => handleDeleteStaff}
  className="text-red-600 hover:text-red-900"
  title="Delete"
>
  <FiTrash2 />
</button>

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

      {/* Edit Staff Modal */}
      {isEditModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiEdit2 size={18} /> Edit Staff Member
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number (optional)
                </label>
                <input
                  type="text"
                  value={formData.idNumber || ''}
                  onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position || ''}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department ID
                  </label>
                  <input
                    type="number"
                    value={formData.departmentId || ''}
                    onChange={(e) => setFormData({...formData, departmentId: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role ID
                  </label>
                  <input
                    type="number"
                    value={formData.roleId || ''}
                    onChange={(e) => setFormData({...formData, roleId: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                </div>
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
                onClick={handleUpdateStaff}
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

      {/* Update Documents Modal */}
      {isDocumentsModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiEdit2 size={18} /> Update Staff Documents
              </h2>
              <button 
                onClick={() => setIsDocumentsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employment Documents URL
                </label>
                <input
                  type="text"
                  value={documentsFormData.employmentDocumentsUrl || ''}
                  onChange={(e) => setDocumentsFormData({...documentsFormData, employmentDocumentsUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="https://example.com/employment.pdf"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  National ID Photo URL
                </label>
                <input
                  type="text"
                  value={documentsFormData.nationalIdPhotoUrl || ''}
                  onChange={(e) => setDocumentsFormData({...documentsFormData, nationalIdPhotoUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:focus:ring-emerald-500 text-gray-800"
                  placeholder="https://example.com/id.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Certificates URL
                </label>
                <input
                  type="text"
                  value={documentsFormData.academicCertificatesUrl || ''}
                  onChange={(e) => setDocumentsFormData({...documentsFormData, academicCertificatesUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="https://example.com/certificates.pdf"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passport Photo URL
                </label>
                <input
                  type="text"
                  value={documentsFormData.passportPhotoUrl || ''}
                  onChange={(e) => setDocumentsFormData({...documentsFormData, passportPhotoUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setIsDocumentsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDocuments}
                disabled={loading.documents}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 ${
                  loading.documents ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
                } transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed`}
              >
                {loading.documents ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    Updating...
                  </>
                ) : (
                  'Update Documents'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}