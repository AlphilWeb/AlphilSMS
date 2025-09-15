'use client';

import { useState, useEffect } from 'react';
import {
  getAllPrograms,
  getProgramDetails,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramCourses,
  getProgramStudents,
  getAllDepartments,
  type DepartmentOption,
  type ProgramWithStats,
  type ProgramDetails,
  type ProgramCourse,
  type ProgramStudent,
} from '@/lib/actions/admin/programs.action';

import {
  FiUsers, FiBook, FiPlus, FiEdit2, FiTrash2, 
  FiLoader, FiX, FiChevronUp, FiSearch, FiArrowUp, FiArrowDown
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';

export default function AdminProgramsClient() {
  const [programs, setPrograms] = useState<ProgramWithStats[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramWithStats[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<ProgramDetails | null>(null);
  const [courses, setCourses] = useState<ProgramCourse[]>([]);
  const [students, setStudents] = useState<ProgramStudent[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'students'>('courses');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    programs: true,
    details: false,
    courses: false,
    students: false,
    create: false,
    update: false
  });
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    durationSemesters: 8,
    departmentId: 0
  });
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({
    key: 'name',
    direction: 'asc'
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Fetch all programs and departments on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(prev => ({ ...prev, programs: true }));
        const [programsData, departmentsData] = await Promise.all([
          getAllPrograms(),
          getAllDepartments(),
        ]);
        setPrograms(programsData);
        setFilteredPrograms(programsData);
        setDepartmentOptions(departmentsData);
        
        // Set initial form values after options load
        if (departmentsData.length > 0) {
          setFormData(prev => ({
            ...prev,
            departmentId: departmentsData[0].id
          }));
        }
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load initial data');
      } finally {
        setLoading(prev => ({ ...prev, programs: false }));
      }
    };

    loadInitialData();
  }, []);

// Filter programs based on search term
useEffect(() => {
  const filtered = programs.filter(program => 
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.department.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Sort the filtered programs
  const sorted = [...filtered].sort((a, b) => {
    // If one of them is selected, it should come first
    if (selectedProgram) {
      if (a.id === selectedProgram.id) return -1;
      if (b.id === selectedProgram.id) return 1;
    }
    
    // Apply the current sorting
    const getNestedValue = (obj: ProgramWithStats, key: string): string | number | undefined => {
      const keys = key.split('.');
      let value: ProgramWithStats | string | number | undefined = obj;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k] as string | number | undefined;
        } else {
          return undefined;
        }
      }
      
      // Return only string or number values for comparison
      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }
      return undefined;
    };
    
    if (sortConfig.key) {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);
      
      // Handle cases where values might be undefined
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }
      
      // Fallback for mixed types or other cases
      const aString = String(aValue);
      const bString = String(bValue);
      return sortConfig.direction === 'asc' 
        ? aString.localeCompare(bString) 
        : bString.localeCompare(aString);
    }
    
    return 0;
  });
  
  setFilteredPrograms(sorted);
}, [programs, searchTerm, sortConfig, selectedProgram]);
  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Load program details when selected
  const handleSelectProgram = async (programId: number) => {
    try {
      setLoading(prev => ({ 
        ...prev, 
        details: true,
        courses: true,
        students: true
      }));
      setError(null);
      
      const [details, programCourses, programStudents] = await Promise.all([
        getProgramDetails(programId),
        getProgramCourses(programId),
        getProgramStudents(programId)
      ]);

      setSelectedProgram(details);
      setCourses(programCourses);
      setStudents(programStudents);
      setActiveTab('courses');
      setEditMode(false);
      setFormData({
        name: details.name,
        code: details.code,
        durationSemesters: details.durationSemesters,
        departmentId: details.department.id
      });

      setIsDetailsModalOpen(true);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load program details');
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        details: false,
        courses: false,
        students: false
      }));
    }
  };

  // Create new program
  const handleCreateProgram = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Program name and code are required');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      const newProgram = await createProgram(
        formData.name,
        formData.code,
        formData.durationSemesters,
        formData.departmentId
      );
      
      const department = departmentOptions.find(d => d.id === formData.departmentId);
      
      setPrograms(prev => [...prev, {
        id: newProgram.id,
        name: newProgram.name,
        code: newProgram.code,
        durationSemesters: newProgram.durationSemesters,
        department: {
          id: formData.departmentId,
          name: department?.name || ''
        },
        studentCount: 0,
        courseCount: 0
      }]);
      
      // Select the new program
      await handleSelectProgram(newProgram.id);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        code: '',
        durationSemesters: 8,
        departmentId: departmentOptions[0]?.id || 0
      });
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to create program');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update program
  const handleUpdateProgram = async () => {
    if (!selectedProgram || !formData.name.trim() || !formData.code.trim()) {
      setError('Program name and code are required');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);

      const updatedProgram = await updateProgram(selectedProgram.id, {
        name: formData.name,
        code: formData.code,
        durationSemesters: formData.durationSemesters,
        departmentId: formData.departmentId
      });
      
      const department = departmentOptions.find(d => d.id === formData.departmentId);
      
      setPrograms(prev => prev.map(prog => 
        prog.id === selectedProgram.id 
          ? { 
              ...prog, 
              name: updatedProgram.name,
              code: updatedProgram.code,
              durationSemesters: updatedProgram.durationSemesters,
              department: {
                id: formData.departmentId,
                name: department?.name || ''
              }
            } 
          : prog
      ));
      
      setSelectedProgram(prev => prev ? { 
        ...prev, 
        name: updatedProgram.name,
        code: updatedProgram.code,
        durationSemesters: updatedProgram.durationSemesters,
        department: {
          id: formData.departmentId,
          name: department?.name || ''
        }
      } : null);
      
      setEditMode(false);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to update program');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Delete program
  const handleDeleteProgram = async (programId: number) => {
    try {
      setError(null);
      await deleteProgram(programId);
      
      setPrograms(prev => prev.filter(prog => prog.id !== programId));
      setSelectedProgram(null);
      setIsDetailsModalOpen(false);
      setDeleteConfirmation('');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to delete program');
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
        <h1 className="text-3xl font-bold text-gray-800">Program Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <FiPlus size={16} /> New Program
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
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Programs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading.programs ? (
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded mb-2 animate-pulse"></div>
            ))}
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="p-6 text-center">
            <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No programs found</p>
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
                    Program Name
                    <SortIcon columnKey="name" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center gap-1">
                    Code
                    <SortIcon columnKey="code" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('department.name')}
                >
                  <div className="flex items-center gap-1">
                    Department
                    <SortIcon columnKey="department.name" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('durationSemesters')}
                >
                  <div className="flex items-center gap-1">
                    Duration
                    <SortIcon columnKey="durationSemesters" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('studentCount')}
                >
                  <div className="flex items-center gap-1">
                    <FiUsers className="inline" /> Students
                    <SortIcon columnKey="studentCount" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('courseCount')}
                >
                  <div className="flex items-center gap-1">
                    <FiBook className="inline" /> Courses
                    <SortIcon columnKey="courseCount" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrograms.map((program) => (
                <tr 
                  key={program.id} 
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedProgram?.id === program.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSelectProgram(program.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{program.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {program.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {program.department.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {program.durationSemesters} semesters
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {program.studentCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {program.courseCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectProgram(program.id);
                      }}
                      className="text-blue-600 hover:text-blue-900"
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

      {/* Create Program Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> Create New Program
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Computer Science"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="CS"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (Semesters)
                    </label>
                    <input
                      type="number"
                      value={formData.durationSemesters}
                      onChange={(e) => setFormData({...formData, durationSemesters: parseInt(e.target.value) || 8})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({...formData, departmentId: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {departmentOptions.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
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
                onClick={handleCreateProgram}
                disabled={!formData.name.trim() || !formData.code.trim() || loading.create}
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
                    Create Program
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Program Details Modal */}
      {isDetailsModalOpen && selectedProgram && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-800">
                Program Details: {selectedProgram.name} ({selectedProgram.code})
              </h3>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Program Header */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    {editMode ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Program Name
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Program Code
                            </label>
                            <input
                              type="text"
                              value={formData.code}
                              onChange={(e) => setFormData({...formData, code: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Duration (Semesters)
                            </label>
                            <input
                              type="number"
                              value={formData.durationSemesters}
                              onChange={(e) => setFormData({...formData, durationSemesters: parseInt(e.target.value) || 8})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="1"
                              max="12"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Department
                            </label>
                            <select
                              value={formData.departmentId}
                              onChange={(e) => setFormData({...formData, departmentId: parseInt(e.target.value)})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {departmentOptions.map(dept => (
                                <option key={dept.id} value={dept.id}>
                                  {dept.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateProgram}
                            disabled={!formData.name.trim() || !formData.code.trim() || loading.update}
                            className={`px-3 py-2 text-sm rounded-md text-white ${
                              loading.update ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                            } transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed`}
                          >
                            {loading.update ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditMode(false)}
                            className="px-3 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                          {selectedProgram.name} ({selectedProgram.code})
                          <button
                            onClick={() => setEditMode(true)}
                            className="text-blue-500 hover:text-blue-800 p-1"
                            title="Edit program"
                          >
                            <FiEdit2 size={18} />
                          </button>
                        </h2>
                        <p className="text-gray-600 mt-2">
                          Department: {selectedProgram.department.name}
                        </p>
                        <p className="text-gray-600">
                          Duration: {selectedProgram.durationSemesters} semesters
                        </p>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedProgram(selectedProgram)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete program"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Students</p>
                    <p className="font-medium text-blue-500">
                      {selectedProgram.studentCount}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Courses</p>
                    <p className="font-medium text-green-600">
                      {selectedProgram.courseCount}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="font-medium text-purple-600">
                      {new Date(selectedProgram.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  className={`px-4 py-2 font-medium flex items-center gap-2 ${
                    activeTab === 'courses'
                      ? 'text-blue-500 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('courses')}
                >
                  <FiBook /> Courses
                </button>
                <button
                  className={`px-4 py-2 font-medium flex items-center gap-2 ${
                    activeTab === 'students'
                      ? 'text-blue-500 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('students')}
                >
                  <FiUsers /> Students
                </button>
              </div>

              {/* Courses Tab */}
              {activeTab === 'courses' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FiBook /> Courses ({courses.length})
                    </h3>
                  </div>
                  <div className="divide-y">
                    {loading.courses ? (
                      <div className="p-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded mb-2 animate-pulse"></div>
                        ))}
                      </div>
                    ) : courses.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No courses in this program
                      </div>
                    ) : (
                      courses.map((course) => (
                        <div key={course.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {course.name} ({course.code})
                              </h4>
                              <p className="text-sm text-gray-600">
                                {course.credits} credits • {course.semester.name}
                              </p>
                              {course.lecturer && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Lecturer: {course.lecturer.firstName} {course.lecturer.lastName}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FiUsers /> Students ({students.length})
                    </h3>
                  </div>
                  <div className="divide-y">
                    {loading.students ? (
                      <div className="p-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded mb-2 animate-pulse"></div>
                        ))}
                      </div>
                    ) : students.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No students in this program
                      </div>
                    ) : (
                      students.map((student) => (
                        <div key={student.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {student.firstName} {student.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {student.email}
                              </p>
                              <div className="flex gap-4 mt-1">
                                <p className="text-xs text-gray-500">
                                  Reg: {student.registrationNumber}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Semester: {student.currentSemester.name}
                                </p>
                              </div>
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
        {/* Delete Confirmation Modal */}
        {selectedProgram && (
          <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  Confirm Deletion
                </h3>
                <button 
                  onClick={() => setSelectedProgram(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <h4 className="font-semibold text-red-800 mb-2">Warning: Deleting this program will permanently delete:</h4>
                  <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
                    <li>All courses in this program</li>
                    <li>All students enrolled in this program</li>
                    <li>All fee structures for this program</li>
                    <li>All enrollments, assignments, and course materials</li>
                    <li>All student transcripts and grades</li>
                  </ul>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type &quot;delete {selectedProgram.name}&quot; to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder={`delete ${selectedProgram.name}`}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-4 border-t">
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProgram(selectedProgram.id)}
                  disabled={deleteConfirmation !== `delete ${selectedProgram.name}`}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                  Delete Program
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}