'use client';

import { useState, useEffect } from 'react';
import {
  getAllDepartments,
  getDepartmentDetails,
  createDepartment,
  updateDepartmentName,
  // assignHeadOfDepartment,
  removeHeadOfDepartment,
  getDepartmentStaff,
  getDepartmentPrograms,
  deleteDepartment,
  type DepartmentWithStats,
  type DepartmentDetails,
  type DepartmentStaffMember,
  type DepartmentProgram,
} from '@/lib/actions/admin/department.actions';

import {
  FiUsers, FiBook, FiPlus, FiEdit2, FiTrash2, 
  FiUserPlus, FiUserMinus, FiLoader, FiX, FiChevronUp,
  FiSearch, FiArrowUp, FiArrowDown
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';

export default function AdminDepartmentsClient() {
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<DepartmentWithStats[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDetails | null>(null);
  const [staff, setStaff] = useState<DepartmentStaffMember[]>([]);
  const [programs, setPrograms] = useState<DepartmentProgram[]>([]);
  const [activeTab, setActiveTab] = useState<'staff' | 'programs'>('staff');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    departments: true,
    details: false,
    staff: false,
    programs: false,
    create: false,
    update: false
  });
  const [error, setError] = useState<string | null>(null);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({
    key: 'name',
    direction: 'asc'
  });

  // Fetch all departments on component mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(prev => ({ ...prev, departments: true }));
        const data = await getAllDepartments();
        setDepartments(data);
        setFilteredDepartments(data);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load departments');
      } finally {
        setLoading(prev => ({ ...prev, departments: false }));
      }
    };

    loadDepartments();
  }, []);

  // Filter departments based on search term
  useEffect(() => {
    const filtered = departments.filter(dept => 
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.headOfDepartment && 
        `${dept.headOfDepartment.firstName} ${dept.headOfDepartment.lastName}`
          .toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // Sort the filtered departments
    const sorted = [...filtered].sort((a, b) => {
      // If one of them is selected, it should come first
      if (selectedDepartment) {
        if (a.id === selectedDepartment.id) return -1;
        if (b.id === selectedDepartment.id) return 1;
      }
      
      // Apply the current sorting
      if (sortConfig.key) {
        const aValue = a[sortConfig.key as keyof DepartmentWithStats];
        const bValue = b[sortConfig.key as keyof DepartmentWithStats];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' 
            ? aValue - bValue 
            : bValue - aValue;
        }
      }
      
      return 0;
    });
    
    setFilteredDepartments(sorted);
  }, [departments, searchTerm, sortConfig, selectedDepartment]);

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Load department details when selected
  const handleSelectDepartment = async (departmentId: number) => {
    try {
      setLoading(prev => ({ 
        ...prev, 
        details: true,
        staff: true,
        programs: true
      }));
      setError(null);
      
      const [details, deptStaff, deptPrograms] = await Promise.all([
        getDepartmentDetails(departmentId),
        getDepartmentStaff(departmentId),
        getDepartmentPrograms(departmentId)
      ]);

      setSelectedDepartment(details);
      setStaff(deptStaff);
      setPrograms(deptPrograms);
      setActiveTab('staff');
      setEditMode(false);
      setNewDepartmentName(details.name);
      setIsDetailsModalOpen(true);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load department details');
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        details: false,
        staff: false,
        programs: false
      }));
    }
  };

  // Create new department
  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) {
      setError('Department name is required');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      const newDept = await createDepartment(newDepartmentName);
      const newDeptWithStats: DepartmentWithStats = {
        id: newDept.id,
        name: newDept.name,
        headOfDepartment: null,
        staffCount: 0,
        programCount: 0
      };
      
      setDepartments(prev => [...prev, newDeptWithStats]);
      setNewDepartmentName('');
      setIsCreateModalOpen(false);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to create department');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update department name
  const handleUpdateDepartmentName = async () => {
    if (!selectedDepartment || !newDepartmentName.trim()) {
      setError('Department name is required');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);

      const updatedDept = await updateDepartmentName(selectedDepartment.id, newDepartmentName);
      
      setDepartments(prev => prev.map(dept => 
        dept.id === selectedDepartment.id 
          ? { ...dept, name: updatedDept.name } 
          : dept
      ));
      
      setSelectedDepartment(prev => prev ? { ...prev, name: updatedDept.name } : null);
      setEditMode(false);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to update department');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Assign head of department
  const handleAssignHead = async (staffId: number) => {
    if (!selectedDepartment) return;

    try {
      setError(null);
      // const updatedDept = await assignHeadOfDepartment(selectedDepartment.id, staffId);
      
      // Update the head in both lists
      const newHead = staff.find(s => s.id === staffId);
      
      setDepartments(prev => prev.map(dept => 
        dept.id === selectedDepartment.id 
          ? { 
              ...dept, 
              headOfDepartment: newHead ? {
                id: newHead.id,
                firstName: newHead.firstName,
                lastName: newHead.lastName,
                email: newHead.email
              } : null
            } 
          : dept
      ));
      
      setSelectedDepartment(prev => prev ? { 
        ...prev, 
        headOfDepartment: newHead ? {
          id: newHead.id,
          firstName: newHead.firstName,
          lastName: newHead.lastName,
          email: newHead.email
        } : null
      } : null);
      
      setStaff(prev => prev.map(member => ({
        ...member,
        isHead: member.id === staffId
      })));
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to assign head');
    }
  };

  // Remove head of department
  const handleRemoveHead = async () => {
    if (!selectedDepartment || !selectedDepartment.headOfDepartment) return;

    try {
      setError(null);
      await removeHeadOfDepartment(selectedDepartment.id);
      
      setDepartments(prev => prev.map(dept => 
        dept.id === selectedDepartment.id 
          ? { ...dept, headOfDepartment: null } 
          : dept
      ));
      
      setSelectedDepartment(prev => prev ? { ...prev, headOfDepartment: null } : null);
      
      setStaff(prev => prev.map(member => ({
        ...member,
        isHead: false
      })));
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to remove head');
    }
  };

  // Delete department
  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      setError(null);
      await deleteDepartment(selectedDepartment.id);
      
      setDepartments(prev => prev.filter(dept => dept.id !== selectedDepartment.id));
      setSelectedDepartment(null);
      setIsDetailsModalOpen(false);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to delete department');
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <FiChevronUp className="opacity-30" />;
    
    return sortConfig.direction === 'asc' 
      ? <FiArrowUp className="text-blue-500" /> 
      : <FiArrowDown className="text-blue-500" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Department Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <FiPlus size={16} /> New Department
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative w-64">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading.departments ? (
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded mb-2 animate-pulse"></div>
            ))}
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="p-6 text-center">
            <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No departments found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    <SortIcon columnKey="name" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Head of Department
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('staffCount')}
                >
                  <div className="flex items-center gap-1">
                    <FiUsers className="inline" /> Staff
                    <SortIcon columnKey="staffCount" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('programCount')}
                >
                  <div className="flex items-center gap-1">
                    <FiBook className="inline" /> Programs
                    <SortIcon columnKey="programCount" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDepartments.map((department) => (
                <tr 
                  key={department.id} 
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedDepartment?.id === department.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSelectDepartment(department.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{department.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {department.headOfDepartment ? (
                      <div>
                        <div className="text-sm text-gray-900">
                          {department.headOfDepartment.firstName} {department.headOfDepartment.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {department.headOfDepartment.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {department.staffCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {department.programCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDepartment(department.id);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Department Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> Create New Department
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter department name"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDepartment}
                disabled={!newDepartmentName.trim() || loading.create}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 ${
                  loading.create ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed`}
              >
                {loading.create ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    Creating...
                  </>
                ) : (
                  <>
                    <FiPlus size={16} />
                    Create Department
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Details Modal */}
      {isDetailsModalOpen && selectedDepartment && (
        <div className="fixed inset-0 backdrop-blur-sm  bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-800">
                Department Details: {selectedDepartment.name}
              </h3>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Department Header */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    {editMode ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={newDepartmentName}
                          onChange={(e) => setNewDepartmentName(e.target.value)}
                          className="text-2xl font-bold px-3 py-1 border border-blue-300 rounded"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateDepartmentName}
                            disabled={!newDepartmentName.trim() || loading.update}
                            className={`px-3 py-1 text-sm rounded-md text-white ${
                              loading.update ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                            } transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed`}
                          >
                            {loading.update ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditMode(false)}
                            className="px-3 py-1 text-sm rounded-md bg-gray-200 hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        {selectedDepartment.name}
                        <button
                          onClick={() => setEditMode(true)}
                          className="text-blue-500 hover:text-blue-800 p-1"
                          title="Edit name"
                        >
                          <FiEdit2 size={18} />
                        </button>
                      </h2>
                    )}
                    
                    {selectedDepartment.headOfDepartment ? (
                      <p className="text-gray-600 mt-2">
                        Head: {selectedDepartment.headOfDepartment.firstName} {selectedDepartment.headOfDepartment.lastName}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic mt-2">No head assigned</p>
                    )}
                  </div>
                  
                  <button
                    onClick={handleDeleteDepartment}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete department"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Staff Members</p>
                    <p className="font-medium text-blue-500">
                      {selectedDepartment.staffCount}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Programs</p>
                    <p className="font-medium text-green-600">
                      {selectedDepartment.programCount}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="font-medium text-purple-600">
                      {new Date(selectedDepartment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  className={`px-4 py-2 font-medium flex items-center gap-2 ${
                    activeTab === 'staff'
                      ? 'text-blue-500 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('staff')}
                >
                  <FiUsers /> Staff
                </button>
                <button
                  className={`px-4 py-2 font-medium flex items-center gap-2 ${
                    activeTab === 'programs'
                      ? 'text-blue-500 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('programs')}
                >
                  <FiBook /> Programs
                </button>
              </div>

              {/* Staff Tab */}
              {activeTab === 'staff' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FiUsers /> Staff Members ({staff.length})
                    </h3>
                  </div>
                  <div className="divide-y">
                    {loading.staff ? (
                      <div className="p-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded mb-2 animate-pulse"></div>
                        ))}
                      </div>
                    ) : staff.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No staff members in this department
                      </div>
                    ) : (
                      staff.map((member) => (
                        <div key={member.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {member.firstName} {member.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {member.email}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {member.position}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              {member.isHead ? (
                                <button
                                  onClick={() => handleRemoveHead()}
                                  className="text-red-600 hover:text-red-800 p-1 flex items-center gap-1 text-sm"
                                  title="Remove as head"
                                >
                                  <FiUserMinus size={16} />
                                  <span>Remove HOD</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAssignHead(member.id)}
                                  className="text-blue-500 hover:text-blue-800 p-1 flex items-center gap-1 text-sm"
                                  title="Assign as head"
                                >
                                  <FiUserPlus size={16} />
                                  <span>Make HOD</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Programs Tab */}
              {activeTab === 'programs' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FiBook /> Programs ({programs.length})
                    </h3>
                  </div>
                  <div className="divide-y">
                    {loading.programs ? (
                      <div className="p-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded mb-2 animate-pulse"></div>
                        ))}
                      </div>
                    ) : programs.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No programs in this department
                      </div>
                    ) : (
                      programs.map((program) => (
                        <div key={program.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {program.name} ({program.code})
                              </h4>
                              <p className="text-sm text-gray-600">
                                Duration: {program.durationSemesters} semesters
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}