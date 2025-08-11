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
  type ProgramWithStats,
  type ProgramDetails,
  type ProgramCourse,
  type ProgramStudent,
} from '@/lib/actions/admin/programs.action';

import {
  FiUsers, FiBook, FiPlus, FiEdit2, FiTrash2, 
  FiLoader, FiX
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';

export default function AdminProgramsClient() {
  const [programs, setPrograms] = useState<ProgramWithStats[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<ProgramDetails | null>(null);
  const [courses, setCourses] = useState<ProgramCourse[]>([]);
  const [students, setStudents] = useState<ProgramStudent[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'students'>('courses');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    programs: true,
    details: false,
    courses: false,
    students: false,
    create: false,
    update: false
  });
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    durationSemesters: 8,
    departmentId: 1 // Default to first department
  });
  const [editMode, setEditMode] = useState(false);
  // const [expandedDepartments, setExpandedDepartments] = useState<Record<number, boolean>>({});

  // Fetch all programs on component mount
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setLoading(prev => ({ ...prev, programs: true }));
        const data = await getAllPrograms();
        setPrograms(data);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load programs');
      } finally {
        setLoading(prev => ({ ...prev, programs: false }));
      }
    };

    loadPrograms();
  }, []);

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
      
      setPrograms(prev => [...prev, {
        id: newProgram.id,
        name: newProgram.name,
        code: newProgram.code,
        durationSemesters: newProgram.durationSemesters,
        department: {
          id: formData.departmentId,
          name: '' // Will be updated when selected
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
        departmentId: 1
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
      
      setPrograms(prev => prev.map(prog => 
        prog.id === selectedProgram.id 
          ? { 
              ...prog, 
              name: updatedProgram.name,
              code: updatedProgram.code,
              durationSemesters: updatedProgram.durationSemesters,
              department: {
                id: formData.departmentId,
                name: '' // Will be updated when selected
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
          name: '' // Will be updated when selected
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
  const handleDeleteProgram = async () => {
    if (!selectedProgram) return;

    try {
      setError(null);
      await deleteProgram(selectedProgram.id);
      
      setPrograms(prev => prev.filter(prog => prog.id !== selectedProgram.id));
      setSelectedProgram(null);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to delete program');
    }
  };

  // Toggle department expansion
  // const toggleDepartmentExpansion = (departmentId: number) => {
  //   expandedDepartments[departmentId] = !expandedDepartments[departmentId];
  //   setExpandedDepartments(prev => ({
  //     ...prev,
  //     [departmentId]: !prev[departmentId]
  //   }));
  // };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Program Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Programs List */}
        <div className="lg:col-span-1">
          {loading.programs ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : programs.length === 0 ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No programs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedProgram?.id === program.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleSelectProgram(program.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">{program.name}</h3>
                      <p className="text-sm text-gray-600">{program.code}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <FiUsers size={12} /> {program.studentCount}
                        </span>
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <FiBook size={12} /> {program.courseCount}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                      {program.durationSemesters} sems
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Program Details */}
        <div className="lg:col-span-3">
          {!selectedProgram ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <FiBook className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">Select a program to view details</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Program Header */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              {/* Departments would need to be loaded */}
                              <option value="1">Computer Science</option>
                              <option value="2">Business</option>
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
                    onClick={handleDeleteProgram}
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
          )}
        </div>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="1">Computer Science</option>
                      <option value="2">Business</option>
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
    </div>
  );
}