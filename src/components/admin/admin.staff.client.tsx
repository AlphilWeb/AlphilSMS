'use client';

import { useState, useEffect } from 'react';
import {
  getAllStaff,
  deleteStaff,
  type StaffWithDetails,
  type StaffDeletePayload,
  searchStaff,
} from '@/lib/actions/admin/staff.actions';

import {
  getStaffForEdit,
  updateStaff,
} from '@/lib/actions/users/staff.edit.actions';
import { getStaffFormOptions, addStaff } from '@/lib/actions/users/users.actions';

import {
  FiUser, FiPlus, FiEdit2, FiTrash2,
  FiLoader, FiX, FiSearch, FiInfo,
  FiCheck, FiFileText, FiCreditCard, FiAward, FiCamera,
  FiEye, FiEyeOff
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';
import { format } from 'date-fns';
import Image from 'next/image';

interface Option {
  id: number;
  name: string;
}

interface StaffFormOptions {
  departments: Option[];
  roles: Option[];
}

interface SelectedStaffType {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  idNumber?: string | null;
  position: string;
  departmentId: number;
  department: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    role?: {
      id: number;
      name: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  employmentDocumentsUrl?: string | null;
  nationalIdPhotoUrl?: string | null;
  academicCertificatesUrl?: string | null;
  passportPhotoUrl?: string | null;
}

interface UpdateStaffPayload {
  firstName: string;
  lastName: string;
  email: string;
  idNumber: string;
  departmentId: number;
  position: string;
  roleId: number;
  shouldDeleteFiles: {
    employmentDocuments: boolean;
    nationalIdPhoto: boolean;
    academicCertificates: boolean;
    passportPhoto: boolean;
  };
  password?: string;
  employmentDocuments?: File;
  nationalIdPhoto?: File;
  academicCertificates?: File;
  passportPhoto?: File;
}

export default function AdminStaffClient() {
  const [staff, setStaff] = useState<StaffWithDetails[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<SelectedStaffType | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
  const [options, setOptions] = useState<StaffFormOptions>({ departments: [], roles: [] });
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    idNumber: '',
    departmentId: 0,
    position: '',
    roleId: 0,
    password: '',
  });

  const [documentsFormData, setDocumentsFormData] = useState({
    employmentDocuments: null as File | null,
    nationalIdPhoto: null as File | null,
    academicCertificates: null as File | null,
    passportPhoto: null as File | null
  });

  // Format error messages for user display
  const formatErrorMessage = (error: unknown): string => {
    console.error('Raw error:', error);
    
    if (error instanceof ActionError) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object') {
      // Handle Zod validation errors
      if ('issues' in error && Array.isArray(error.issues)) {
        const issues = error.issues as Array<{path: string[], message: string}>;
        if (issues.length > 0) {
          return issues.map(issue => {
            const field = issue.path[issue.path.length - 1];
            return `${field ? field + ': ' : ''}${issue.message}`;
          }).join(', ');
        }
      }
      
      // Handle other object errors
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
    }
    
    return 'An unexpected error occurred. Please try again.';
  };

  // Fetch all staff on component mount
  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(prev => ({ ...prev, staff: true }));
        setError(null);
        const staffData = await getAllStaff();
        setStaff(staffData);
      } catch (err) {
        const errorMessage = formatErrorMessage(err);
        setError(errorMessage);
      } finally {
        setLoading(prev => ({ ...prev, staff: false }));
      }
    };

    loadStaff();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    // If search query is empty, reload all staff immediately
    if (!searchQuery.trim()) {
      const loadAllStaff = async () => {
        try {
          setLoading(prev => ({ ...prev, staff: true }));
          const staffData = await getAllStaff();
          setStaff(staffData);
        } catch (err) {
          const errorMessage = formatErrorMessage(err);
          setError(errorMessage);
        } finally {
          setLoading(prev => ({ ...prev, staff: false }));
        }
      };
      
      loadAllStaff();
      return;
    }

    // If there's a search query, use the debounced search
    const timer = setTimeout(async () => {
      try {
        setLoading(prev => ({ ...prev, staff: true }));
        const results = await searchStaff(searchQuery);
        setStaff(results);
      } catch (err) {
        const errorMessage = formatErrorMessage(err);
        setError(errorMessage);
      } finally {
        setLoading(prev => ({ ...prev, staff: false }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load form options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const opts = await getStaffFormOptions();
        setOptions(opts);
        // Set default values
        if (opts.departments.length > 0 && opts.roles.length > 0) {
          setFormData(prev => ({
            ...prev,
            departmentId: opts.departments[0].id,
            roleId: opts.roles.find(r => r.name.toLowerCase().includes('staff'))?.id || opts.roles[0].id
          }));
        }
      } catch (err) {
        console.error('Failed to load form options:', err);
      }
    };

    loadOptions();
  }, []);

  // Load staff details when selected
  const handleSelectStaff = async (staffId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      setError(null);
      
      const [opts, staffRes] = await Promise.all([
        getStaffFormOptions(),
        getStaffForEdit(staffId)
      ]);

      setOptions(opts);

      if (staffRes.success && staffRes.staff) {
        const staffToSet = {
          ...staffRes.staff,
          user: staffRes.staff.user ?? undefined,
        };

        setSelectedStaff(staffToSet);
        
        const userRoleId = staffRes.staff.user?.role?.id || 
                          (opts.roles ?? []).find(r => r.name.toLowerCase().includes('staff'))?.id || 
                          (opts.roles ?? [])[0]?.id || 0;
        
        setFormData({
          firstName: staffRes.staff.firstName,
          lastName: staffRes.staff.lastName,
          email: staffRes.staff.email,
          idNumber: staffRes.staff.idNumber || '',
          departmentId: staffRes.staff.departmentId,
          position: staffRes.staff.position,
          roleId: userRoleId,
          password: ''
        });

        // Set file previews
        const previews: Record<string, string> = {};
        if (staffRes.staff.passportPhotoUrl) previews.passportPhoto = staffRes.staff.passportPhotoUrl;
        if (staffRes.staff.nationalIdPhotoUrl) previews.nationalIdPhoto = staffRes.staff.nationalIdPhotoUrl;
        if (staffRes.staff.academicCertificatesUrl) previews.academicCertificates = staffRes.staff.academicCertificatesUrl;
        if (staffRes.staff.employmentDocumentsUrl) previews.employmentDocuments = staffRes.staff.employmentDocumentsUrl;
        setFilePreviews(previews);
        
        setIsViewModalOpen(true);
      } else {
        setError(staffRes.error || 'Failed to load staff details');
      }
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.endsWith('Id') ? Number(value) : value,
    }));
  };

  // Handle file input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      setDocumentsFormData(prev => ({
        ...prev,
        [field]: files[0]
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews(prev => ({
          ...prev,
          [field]: e.target?.result as string
        }));
      };
      reader.readAsDataURL(files[0]);
    }
  };

  // Remove file from form
  const removeFile = (field: string) => {
    setDocumentsFormData(prev => ({ ...prev, [field]: null }));
    setFilePreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[field];
      return newPreviews;
    });
  };

  // Create new staff
  const handleCreateStaff = async () => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      if (!formData.firstName || !formData.lastName || !formData.email || !formData.position || !formData.departmentId || !formData.roleId) {
        throw new ActionError('All required fields must be filled');
      }

      if (!formData.password) {
        throw new ActionError('Password is required');
      }

      // Optional: Add password strength validation
      if (formData.password.length < 8) {
        throw new ActionError('Password must be at least 8 characters long');
      }

      const staffData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        idNumber: formData.idNumber,
        departmentId: formData.departmentId,
        position: formData.position,
        roleId: formData.roleId,
        password: formData.password,
        passportPhoto: documentsFormData.passportPhoto ?? undefined,
        nationalIdPhoto: documentsFormData.nationalIdPhoto ?? undefined,
        academicCertificates: documentsFormData.academicCertificates ?? undefined,
        employmentDocuments: documentsFormData.employmentDocuments ?? undefined
      };

      const newStaff = await addStaff(staffData);
      
      if (newStaff.success && newStaff.staff) {
        setStaff(prev => [...prev, {
          id: newStaff.staff!.id,
          firstName: newStaff.staff!.firstName,
          lastName: newStaff.staff!.lastName,
          email: newStaff.staff!.email,
          idNumber: newStaff.staff!.idNumber,
          position: newStaff.staff!.position,
          department: {
            id: formData.departmentId,
            name: options.departments.find(d => d.id === formData.departmentId)?.name || ''
          },
          user: {
            id: newStaff.staff!.userId || 0,
            role: {
              id: formData.roleId,
              name: options.roles.find(r => r.id === formData.roleId)?.name || ''
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
          departmentId: options.departments[0]?.id || 0,
          position: '',
          roleId: options.roles.find(r => r.name.toLowerCase().includes('staff'))?.id || options.roles[0]?.id || 0,
          password: ''
        });
        setDocumentsFormData({
          employmentDocuments: null,
          nationalIdPhoto: null,
          academicCertificates: null,
          passportPhoto: null
        });
        setFilePreviews({});
        setSuccess('Staff member created successfully!');
      } else {
        throw new ActionError(newStaff.error || 'Failed to create staff');
      }
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
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

      // Only validate password if it's being changed (not empty)
      if (formData.password && formData.password.length > 0 && formData.password.length < 8) {
        throw new ActionError('Password must be at least 8 characters long');
      }

      const shouldDeleteFiles = {
        employmentDocuments: !documentsFormData.employmentDocuments && !filePreviews.employmentDocuments,
        nationalIdPhoto: !documentsFormData.nationalIdPhoto && !filePreviews.nationalIdPhoto,
        academicCertificates: !documentsFormData.academicCertificates && !filePreviews.academicCertificates,
        passportPhoto: !documentsFormData.passportPhoto && !filePreviews.passportPhoto,
      };

      // Create update payload with password and roleId
      const updatePayload: UpdateStaffPayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        idNumber: formData.idNumber,
        departmentId: formData.departmentId,
        position: formData.position,
        roleId: formData.roleId,
        shouldDeleteFiles,
      };
      
      // Only include password if it's not empty
      if (formData.password.trim() !== "") {
        updatePayload.password = formData.password;
      }
      
      // Add file uploads if they exist
      if (documentsFormData.employmentDocuments) updatePayload.employmentDocuments = documentsFormData.employmentDocuments;
      if (documentsFormData.nationalIdPhoto) updatePayload.nationalIdPhoto = documentsFormData.nationalIdPhoto;
      if (documentsFormData.academicCertificates) updatePayload.academicCertificates = documentsFormData.academicCertificates;
      if (documentsFormData.passportPhoto) updatePayload.passportPhoto = documentsFormData.passportPhoto;

      const updatedStaff = await updateStaff(selectedStaff.id, updatePayload);
      
      if (updatedStaff.success && updatedStaff.staff) {
        setStaff(prev => prev.map(staff => 
          staff.id === selectedStaff.id 
            ? { 
                ...staff, 
                firstName: updatedStaff.staff!.firstName,
                lastName: updatedStaff.staff!.lastName,
                email: updatedStaff.staff!.email,
                idNumber: updatedStaff.staff!.idNumber,
                position: updatedStaff.staff!.position,
                department: {
                  id: formData.departmentId,
                  name: options.departments.find(d => d.id === formData.departmentId)?.name || staff.department.name
                },
                user: {
                  id: staff.user.id,
                  role: {
                    id: formData.roleId,
                    name: options.roles.find(r => r.id === formData.roleId)?.name || staff.user.role.name
                  }
                },
                updatedAt: new Date()
              } 
            : staff
        ));
        
        setSelectedStaff((prev: SelectedStaffType | null): SelectedStaffType | null => prev ? { 
          ...prev, 
          firstName: updatedStaff.staff!.firstName,
          lastName: updatedStaff.staff!.lastName,
          email: updatedStaff.staff!.email,
          idNumber: updatedStaff.staff!.idNumber,
          position: updatedStaff.staff!.position,
          department: {
            id: formData.departmentId,
            name: options.departments.find((d: Option) => d.id === formData.departmentId)?.name || prev.department.name
          },
          user: {
            id: prev?.user?.id ?? 0,
            role: {
              id: formData.roleId,
              name: options.roles.find((r: Option) => r.id === formData.roleId)?.name || (prev?.user?.role?.name ?? '')
            }
          },
          updatedAt: new Date()
        } : null);
        
        setIsEditModalOpen(false);
        setSuccess('Staff member updated successfully!');
      } else {
        throw new ActionError(updatedStaff.error || 'Failed to update staff');
      }
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
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
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
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
                    <tr 
                      key={staffMember.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectStaff(staffMember.id)}
                    >
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStaff(staffMember.id);
                          }}
                          className="text-emerald-600 hover:text-emerald-900 mr-4"
                          title="View Details"
                        >
                          <FiInfo />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStaff(staffMember.id);
                            setIsViewModalOpen(false);
                            setIsEditModalOpen(true);
                          }}
                          className="text-pink-600 hover:text-pink-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStaff(staffMember);
                          }}
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
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-6 sticky top-0 bg-white z-10">
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
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="john.doe@university.edu"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number (optional)
                </label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="EMP123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="Professor"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                      required
                    >
                      <option value="">Select Department</option>
                      {options.departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      name="roleId"
                      value={formData.roleId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                      required
                    >
                      <option value="">Select Role</option>
                      {options.roles.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 pr-10"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters
                  </p>
                </div>

              {/* File Upload Sections */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passport Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'passportPhoto')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {filePreviews.passportPhoto && (
                    <div className="mt-2">
                      <Image
                        src={filePreviews.passportPhoto}
                        width={80}
                        height={80}
                        className="h-20 w-20 object-cover rounded"
                        alt="Passport preview"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile('passportPhoto')}
                        className="mt-1 text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    National ID Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'nationalIdPhoto')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {filePreviews.nationalIdPhoto && (
                    <div className="mt-2">
<Image
  src={filePreviews.nationalIdPhoto}
  width={80}
  height={80}
  className="h-20 w-20 object-cover rounded"
  alt="National ID preview"
/>
                      <button
                        type="button"
                        onClick={() => removeFile('nationalIdPhoto')}
                        className="mt-1 text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Certificates
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, 'academicCertificates')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {filePreviews.academicCertificates && (
                    <div className="mt-2">
                      <div className="h-20 w-20 bg-gray-100 rounded flex items-center justify-center">
                        <FiFileText className="text-gray-400 text-2xl" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('academicCertificates')}
                        className="mt-1 text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment Documents
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, 'employmentDocuments')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {filePreviews.employmentDocuments && (
                    <div className="mt-2">
                      <div className="h-20 w-20 bg-gray-100 rounded flex items-center justify-center">
                        <FiFileText className="text-gray-400 text-2xl" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('employmentDocuments')}
                        className="mt-1 text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStaff}
                disabled={loading.create || !formData.firstName || !formData.lastName || !formData.email || 
                         !formData.position || !formData.departmentId || !formData.roleId || !formData.password}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-auto">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                        {selectedStaff.department?.name || 'Unknown'}
                      </p>
                    </div>
                    
                    {/* User Account Information */}
                    {selectedStaff.user && (
                      <>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">User ID</h3>
                          <p className="mt-1 text-sm text-gray-900">{selectedStaff.user.id}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">User Role</h3>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedStaff.user.role?.name || 'Unknown'}
                          </p>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Date Joined</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedStaff.createdAt)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedStaff.updatedAt)}
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
                  setIsEditModalOpen(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md flex items-center gap-2"
              >
                <FiEdit2 size={16} />
                Edit Staff
              </button>
              <button
                onClick={() => handleDeleteStaff()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center gap-2"
              >
                <FiTrash2 size={16} />
                Delete Staff
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
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-6 sticky top-0 bg-white z-10">
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
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number (optional)
                </label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    required
                  >
                    <option value="">Select Department</option>
                    {options.departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    New Password (leave blank to keep current)
  </label>
  <input
    type="password"
    name="password"
    value={formData.password}
    onChange={handleChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
    placeholder="Enter new password"
  />
  <p className="text-xs text-gray-500 mt-1">
    Leave blank to keep current password
  </p>
</div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Role *
  </label>
  <select
    name="roleId"
    value={formData.roleId}
    onChange={handleChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
    required
  >
    <option value="">Select Role</option>
    {options.roles.map((role) => (
      <option key={role.id} value={role.id}>{role.name}</option>
    ))}
  </select>
</div>
              </div>


              {/* File Upload Sections */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passport Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'passportPhoto')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {filePreviews.passportPhoto && (
                    <div className="mt-2">
<Image
  src={filePreviews.passportPhoto}
  width={80}
  height={80}
  className="h-20 w-20 object-cover rounded"
  alt="Passport preview"
/>
                      <button
                        type="button"
                        onClick={() => removeFile('passportPhoto')}
                        className="mt-1 text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    National ID Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'nationalIdPhoto')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {filePreviews.nationalIdPhoto && (
                    <div className="mt-2">
<Image
  src={filePreviews.nationalIdPhoto}
  width={80}
  height={80}
  className="h-20 w-20 object-cover rounded"
  alt="National ID preview"
/>
                      <button
                        type="button"
                        onClick={() => removeFile('nationalIdPhoto')}
                        className="mt-1 text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Certificates
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, 'academicCertificates')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {filePreviews.academicCertificates && (
                    <div className="mt-2">
                      <div className="h-20 w-20 bg-gray-100 rounded flex items-center justify-center">
                        <FiFileText className="text-gray-400 text-2xl" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('academicCertificates')}
                        className="mt-1 text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment Documents
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, 'employmentDocuments')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {filePreviews.employmentDocuments && (
                    <div className="mt-2">
                      <div className="h-20 w-20 bg-gray-100 rounded flex items-center justify-center">
                        <FiFileText className="text-gray-400 text-2xl" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('employmentDocuments')}
                        className="mt-1 text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
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
    </div>
  );
}