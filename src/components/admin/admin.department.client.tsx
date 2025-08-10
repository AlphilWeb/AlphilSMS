'use client';

import { useState, useEffect } from 'react';
import {
  getAllDepartments,
  getDepartmentDetails,
  createDepartment,
  updateDepartmentName,
  assignHeadOfDepartment,
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
   FiUserPlus, FiUserMinus,
   FiLoader,
   FiX
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';

export default function AdminDepartmentsClient() {
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDetails | null>(null);
  const [staff, setStaff] = useState<DepartmentStaffMember[]>([]);
  const [programs, setPrograms] = useState<DepartmentProgram[]>([]);
  const [activeTab, setActiveTab] = useState<'staff' | 'programs'>('staff');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  // Fetch all departments on component mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(prev => ({ ...prev, departments: true }));
        const data = await getAllDepartments();
        setDepartments(data);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load departments');
      } finally {
        setLoading(prev => ({ ...prev, departments: false }));
      }
    };

    loadDepartments();
  }, []);

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
      setDepartments(prev => [...prev, {
        id: newDept.id,
        name: newDept.name,
        headOfDepartment: null,
        staffCount: 0,
        programCount: 0
      }]);
      
      // Select the new department
      await handleSelectDepartment(newDept.id);
      setNewDepartmentName('');
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
      const updatedDept = await assignHeadOfDepartment(selectedDepartment.id, staffId);
      console.log(updatedDept)
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
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to delete department');
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Department Management</h1>
        <div className="flex items-center justify-between mb-4">
  <button
    onClick={() => setIsCreateModalOpen(true)}
    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
  >
    <FiPlus size={16} /> New Department
  </button>
</div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Departments List */}
        <div className="lg:col-span-1">

          
          {/* Create Department Form */}
{isCreateModalOpen && (
  <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
      {/* Modal Header */}
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
      
      {/* Modal Body */}
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
              className="text-blue-600 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter department name"
            />
          </div>
        </div>
      </div>
      
      {/* Modal Footer */}
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


          {/* Departments List */}
          {loading.departments ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : departments.length === 0 ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No departments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {departments.map((department) => (
                <div
                  key={department.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedDepartment?.id === department.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleSelectDepartment(department.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">{department.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <FiUsers size={12} /> {department.staffCount}
                        </span>
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <FiBook size={12} /> {department.programCount}
                        </span>
                      </div>
                    </div>
                    {department.headOfDepartment && (
                      <span 
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full"
                        title={`Head: ${department.headOfDepartment.firstName} ${department.headOfDepartment.lastName}`}
                      >
                        HOD
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department Details */}
        <div className="lg:col-span-3 m-5">
          {!selectedDepartment ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">Select a department to view details</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Department Header */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
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
                          className="text-blue-600 hover:text-blue-800 p-1"
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
                    <p className="font-medium text-blue-600">
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
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('staff')}
                >
                  <FiUsers /> Staff
                </button>
                <button
                  className={`px-4 py-2 font-medium flex items-center gap-2 ${
                    activeTab === 'programs'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('programs')}
                >
                  <FiBook /> Programs
                </button>
              </div>

              {/* Staff Tab */}
              {activeTab === 'staff' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                                  className="text-blue-600 hover:text-blue-800 p-1 flex items-center gap-1 text-sm"
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
          )}
        </div>
      </div>
    </div>
  );
}