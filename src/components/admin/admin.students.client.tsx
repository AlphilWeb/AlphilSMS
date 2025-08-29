// components/admin/admin.students.client.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getAllStudents,
  deleteStudent,
  getStudentEnrollments,
  searchStudents,
  type StudentWithDetails,
  type StudentEnrollment,
} from '@/lib/actions/admin/students.action';

// Add PDF generation import
import { generateStudentListPdf } from '@/lib/actions/pdf-generataion/pdf-generation.actions';
import { ActionError } from '@/lib/utils';

import BulkStudentsModal from '@/components/admin/bulk-students-modal.client';

import {
  getStudentForEdit,
  updateStudent,
} from '@/lib/actions/users/student.edit.actions';
import { getStudentFormOptions, addStudent } from '@/lib/actions/test/test.action';

import {
  FiUser, FiBook, FiPlus, FiEdit2, FiTrash2, 
  FiLoader, FiX, FiSearch, FiInfo, FiCheck, FiFileText, FiCreditCard, FiAward, FiCamera,
  FiExternalLink,
  FiEye,
  FiEyeOff,
  FiDownload // Added download icon
} from 'react-icons/fi';

interface Option {
  id: number;
  name: string;
  code?: string;
}

interface StudentFormOptions {
  programs: Option[];
  departments: Option[];
  semesters: Option[];
  roles: Option[]; 
}

interface SelectedStudentType {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  idNumber?: string | null;
  registrationNumber: string;
  studentNumber: string;
  programId: number;
  departmentId: number;
  currentSemesterId?: number | null;
  program?: {
    id: number;
    name: string;
  };
  department?: {
    id: number;
    name: string;
  };
  currentSemester?: {
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
  passportPhotoUrl?: string | null;
  idPhotoUrl?: string | null;
  certificateUrl?: string | null;
}

interface StudentData {
  firstName: string;
  lastName: string;
  email: string;
  idNumber: string;
  registrationNumber: string;
  studentNumber: string;
  programId: number;
  departmentId: number;
  currentSemesterId: number;
  password: string;
  roleId: number;
}

export default function AdminStudentsClient() {
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudentType | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    students: true,
    details: false,
    enrollments: false,
    create: false,
    update: false,
    generating: false // Added for PDF generation
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [options, setOptions] = useState<StudentFormOptions>({ programs: [], departments: [], semesters: [], roles: [] });
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    idNumber: '',
    registrationNumber: '',
    studentNumber: '',
    programId: 0,
    departmentId: 0,
    currentSemesterId: 0,
    password: '',
    roleId: 0,
  });

  const [documentsFormData, setDocumentsFormData] = useState({
    passportPhoto: null as File | null,
    idPhoto: null as File | null,
    certificate: null as File | null,
  });

  const [showPassword, setShowPassword] = useState(false);

  // Fetch all students on component mount and when search changes
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(prev => ({ ...prev, students: true }));
        setError(null);
        const studentsData = await getAllStudents();
        setStudents(studentsData);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load students' );
        console.error('Error loading students:', err);
      } finally {
        setLoading(prev => ({ ...prev, students: false }));
      }
    };

    loadStudents();
  }, []);

  // Load form options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const opts = await getStudentFormOptions();
        setOptions({
          programs: opts.programs,
          departments: opts.departments,
          semesters: opts.semesters,
          roles: opts.roles ?? [],
        });
        // Set default values
        if (opts.programs.length > 0 && opts.departments.length > 0 && opts.semesters.length > 0 && opts.roles && opts.roles.length > 0) {
          setFormData(prev => ({
            ...prev,
            programId: opts.programs[0].id,
            departmentId: opts.departments[0].id,
            currentSemesterId: opts.semesters[0].id,
            roleId: opts.roles.find(r => r.name.toLowerCase().includes('student'))?.id || opts.roles[0]?.id || 0
          }));
        }
      } catch (err) {
        console.error('Failed to load form options:', err);
      }
    };

    loadOptions();
  }, []);

  // Handle search
  useEffect(() => {
    // If search query is empty, reload all students immediately
    if (!searchQuery.trim()) {
      const loadAllStudents = async () => {
        try {
          setLoading(prev => ({ ...prev, students: true }));
          const studentsData = await getAllStudents();
          setStudents(studentsData);
        } catch (err) {
          setError(err instanceof ActionError ? err.message : 'Failed to load students');
        } finally {
          setLoading(prev => ({ ...prev, students: false }));
        }
      };
      
      loadAllStudents();
      return;
    }

    // If there's a search query, use the debounced search
    const timer = setTimeout(async () => {
      try {
        setLoading(prev => ({ ...prev, students: true }));
        const results = await searchStudents(searchQuery);
        setStudents(results);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Search failed');
      } finally {
        setLoading(prev => ({ ...prev, students: false }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // NEW: Generate Student List PDF
  const generateStudentListPdfHandler = async () => {
    try {
      setLoading(prev => ({ ...prev, generating: true }));
      setError(null);
      setSuccess(null);

      // Generate PDF based on current filters (search query)
      const pdfBuffer = await generateStudentListPdf({
        studentName: searchQuery || undefined,
      });
      
      // Create a blob and download the PDF
      const uint8Array = new Uint8Array(pdfBuffer);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_list_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Student list generated successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to generate student list');
    } finally {
      setLoading(prev => ({ ...prev, generating: false }));
    }
  };

  // Load student details when selected
  const handleSelectStudent = async (studentId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true, enrollments: true }));
      setError(null);
      
      const [opts, studentRes, studentEnrollments] = await Promise.all([
        getStudentFormOptions(),
        getStudentForEdit(studentId),
        getStudentEnrollments(studentId)
      ]);

      setOptions(opts);

      if (studentRes.success && studentRes.student) {
        // Create a new object that conforms to the expected type
        const studentToSet = {
          ...studentRes.student,
          // Convert currentSemester from `... | null` to `... | undefined`
          currentSemester: studentRes.student.currentSemester ?? undefined,
          // Convert user from `... | null` to `... | undefined`
          user: studentRes.student.user ?? undefined,
        };

        setSelectedStudent(studentToSet);
        setEnrollments(studentEnrollments);
        setFormData({
          firstName: studentRes.student.firstName,
          lastName: studentRes.student.lastName,
          email: studentRes.student.email,
          idNumber: studentRes.student.idNumber || '',
          registrationNumber: studentRes.student.registrationNumber,
          studentNumber: studentRes.student.studentNumber,
          programId: studentRes.student.programId,
          departmentId: studentRes.student.departmentId,
          currentSemesterId: studentRes.student.currentSemesterId ?? 0,
          password: '',
          roleId: (options.roles ?? []).find(r => r.name.toLowerCase().includes('student'))?.id || (options.roles ?? [])[0]?.id || 0 
        });

        // Set file previews
        const previews: Record<string, string> = {};
        if (studentRes.student.passportPhotoUrl) previews.passportPhoto = studentRes.student.passportPhotoUrl;
        if (studentRes.student.idPhotoUrl) previews.idPhoto = studentRes.student.idPhotoUrl;
        if (studentRes.student.certificateUrl) previews.certificate = studentRes.student.certificateUrl;
        setFilePreviews(previews);
        
        setIsViewModalOpen(true);
      } else {
        setError(studentRes.error || 'Failed to load student details');
      }
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load student details');
    } finally {
      setLoading(prev => ({ ...prev, details: false, enrollments: false }));
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

  // Create new student
  const handleCreateStudent = async () => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      // Add password and roleId validation
      if (!formData.firstName || !formData.lastName || !formData.email || 
          !formData.registrationNumber || !formData.studentNumber || 
          !formData.programId || !formData.departmentId || !formData.currentSemesterId ||
          !formData.password || !formData.roleId) {
        throw new ActionError('All required fields must be filled');
      }

      const studentData: {
        firstName: string;
        lastName: string;
        email: string;
        idNumber: string;
        registrationNumber: string;
        studentNumber: string;
        programId: number;
        departmentId: number;
        currentSemesterId: number;
        password: string;
        roleId: number;
        passportPhoto?: File;
        idPhoto?: File;
        certificate?: File;
      } = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        idNumber: formData.idNumber,
        registrationNumber: formData.registrationNumber,
        studentNumber: formData.studentNumber,
        programId: formData.programId,
        departmentId: formData.departmentId,
        currentSemesterId: formData.currentSemesterId,
        password: formData.password,
        roleId: formData.roleId,
      };
      if (documentsFormData.passportPhoto) studentData.passportPhoto = documentsFormData.passportPhoto;
      if (documentsFormData.idPhoto) studentData.idPhoto = documentsFormData.idPhoto;
      if (documentsFormData.certificate) studentData.certificate = documentsFormData.certificate;

      const newStudent = await addStudent(studentData);
      
      if (newStudent.success && newStudent.student) {
        setStudents(prev => [...prev, {
          id: newStudent.student!.id,
          firstName: newStudent.student!.firstName,
          lastName: newStudent.student!.lastName,
          email: newStudent.student!.email,
          registrationNumber: newStudent.student!.registrationNumber,
          studentNumber: newStudent.student!.studentNumber,
          program: {
            id: formData.programId,
            name: options.programs.find(p => p.id === formData.programId)?.name || ''
          },
          department: {
            id: formData.departmentId,
            name: options.departments.find(d => d.id === formData.departmentId)?.name || ''
          },
          currentSemester: {
            id: formData.currentSemesterId,
            name: options.semesters.find(s => s.id === formData.currentSemesterId)?.name || ''
          },
          user: {
            id: newStudent.student!.userId || 0,
            role: {
              id: formData.roleId,
              name: (options.roles ?? []).find(r => r.id === formData.roleId)?.name || ''
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
          registrationNumber: '',
          studentNumber: '',
          programId: options.programs[0]?.id || 0,
          departmentId: options.departments[0]?.id || 0,
          currentSemesterId: options.semesters[0]?.id || 0,
          password: '',
          roleId: (options.roles ?? []).find(r => r.name.toLowerCase().includes('student'))?.id || (options.roles ?? [])[0]?.id || 0
        });
        setDocumentsFormData({
          passportPhoto: null,
          idPhoto: null,
          certificate: null
        });
        setFilePreviews({});
        setSuccess('Student created successfully!');
      } else {
        throw new ActionError(newStudent.error || 'Failed to create student');
      }
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to create student');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update student
  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);

      if (formData.password && formData.password.length > 0 && formData.password.length < 8) {
        throw new ActionError('Password must be at least 8 characters long');
      }

      const shouldDeleteFiles = {
        certificate: !documentsFormData.certificate && !filePreviews.certificate,
        idPhoto: !documentsFormData.idPhoto && !filePreviews.idPhoto,
        passportPhoto: !documentsFormData.passportPhoto && !filePreviews.passportPhoto,
      };

      const updatePayload: {
        firstName: string;
        lastName: string;
        email: string;
        idNumber: string;
        registrationNumber: string;
        studentNumber: string;
        programId: number;
        departmentId: number;
        currentSemesterId: number;
        password?: string;
        roleId: number;
        shouldDeleteFiles: {
          certificate: boolean;
          idPhoto: boolean;
          passportPhoto: boolean;
        };
        passportPhoto?: File;
        idPhoto?: File;
        certificate?: File;
      } = {
        ...formData,
        shouldDeleteFiles,
      };
      
      // Only include password if it's not empty
      if (formData.password.trim() !== "") {
        updatePayload.password = formData.password;
      }
      
      // Include roleId
      updatePayload.roleId = formData.roleId;
      
      if (documentsFormData.passportPhoto) updatePayload.passportPhoto = documentsFormData.passportPhoto;
      if (documentsFormData.idPhoto) updatePayload.idPhoto = documentsFormData.idPhoto;
      if (documentsFormData.certificate) updatePayload.certificate = documentsFormData.certificate;

      const updatedStudent = await updateStudent(selectedStudent.id, {
        ...updatePayload,
        password: updatePayload.password ?? "",
      });    
      
      if (updatedStudent.success && updatedStudent.student) {
        setStudents(prev => prev.map(student => 
          student.id === selectedStudent.id 
            ? { 
                ...student, 
                firstName: updatedStudent.student!.firstName,
                lastName: updatedStudent.student!.lastName,
                email: updatedStudent.student!.email,
                registrationNumber: updatedStudent.student!.registrationNumber,
                studentNumber: updatedStudent.student!.studentNumber,
                program: {
                  id: formData.programId,
                  name: options.programs.find(p => p.id === formData.programId)?.name || student.program.name
                },
                department: {
                  id: formData.departmentId,
                  name: options.departments.find(d => d.id === formData.departmentId)?.name || student.department.name
                },
                currentSemester: {
                  id: formData.currentSemesterId,
                  name: options.semesters.find(s => s.id === formData.currentSemesterId)?.name || student.currentSemester.name
                },
                updatedAt: new Date()
              } 
            : student
        ));
        
        setSelectedStudent((prev: SelectedStudentType | null): SelectedStudentType | null => prev ? { 
          ...prev, 
          firstName: updatedStudent.student!.firstName,
          lastName: updatedStudent.student!.lastName,
          email: updatedStudent.student!.email,
          registrationNumber: updatedStudent.student!.registrationNumber,
          studentNumber: updatedStudent.student!.studentNumber,
          program: {
            id: formData.programId,
            name: options.programs.find((p: Option) => p.id === formData.programId)?.name || prev.program?.name
          },
          department: {
            id: formData.departmentId,
            name: options.departments.find((d: Option) => d.id === formData.departmentId)?.name || prev.department?.name
          },
          currentSemester: {
            id: formData.currentSemesterId,
            name: options.semesters.find((s: Option) => s.id === formData.currentSemesterId)?.name || prev.currentSemester?.name
          },
          updatedAt: new Date()
        } as SelectedStudentType : null);
        
        setIsEditModalOpen(false);
        setSuccess('Student updated successfully!');
      } else {
        throw new ActionError(updatedStudent.error || 'Failed to update student');
      }
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to update student');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  const handleBulkCreateStudents = async (students: StudentData[]) => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);
      
      const createdStudents: StudentWithDetails[] = [];
      
      for (const student of students) {
        // Validate required fields
        if (!student.firstName || !student.lastName || !student.email || 
            !student.registrationNumber || !student.studentNumber || 
            !student.programId || !student.departmentId || !student.currentSemesterId ||
            !student.password || !student.roleId) {
          throw new ActionError(`All required fields must be filled for all students`);
        }

        const studentData: StudentData = {
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          idNumber: student.idNumber,
          registrationNumber: student.registrationNumber,
          studentNumber: student.studentNumber,
          programId: student.programId,
          departmentId: student.departmentId,
          currentSemesterId: student.currentSemesterId,
          password: student.password,
          roleId: student.roleId,
        };

        const newStudent = await addStudent(studentData);
        
        if (newStudent.success && newStudent.student) {
          createdStudents.push({
            id: newStudent.student.id,
            firstName: newStudent.student.firstName,
            lastName: newStudent.student.lastName,
            email: newStudent.student.email,
            registrationNumber: newStudent.student.registrationNumber,
            studentNumber: newStudent.student.studentNumber,
            program: {
              id: student.programId,
              name: options.programs.find(p => p.id === student.programId)?.name || ''
            },
            department: {
              id: student.departmentId,
              name: options.departments.find(d => d.id === student.departmentId)?.name || ''
            },
            currentSemester: {
              id: student.currentSemesterId,
              name: options.semesters.find(s => s.id === student.currentSemesterId)?.name || ''
            },
            user: {
              id: newStudent.student.userId || 0,
              role: {
                id: student.roleId,
                name: (options.roles ?? []).find(r => r.id === student.roleId)?.name || ''
              }
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          throw new ActionError(newStudent.error || 'Failed to create student');
        }
      }
      
      // Add all created students to the list
      setStudents(prev => [...prev, ...createdStudents]);
      setIsBulkModalOpen(false);
      setSuccess(`${students.length} students created successfully!`);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to create students');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Delete student
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    if (!confirm(`Are you sure you want to delete ${selectedStudent.firstName} ${selectedStudent.lastName}? This action cannot be undone.`)) return;

    try {
      setError(null);
      await deleteStudent(selectedStudent.id);
      
      setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
      setSelectedStudent(null);
      setIsViewModalOpen(false);
      setSuccess('Student deleted successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to delete student');
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Student Management</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <FiPlus size={16} /> New Student
          </button>
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:blue-emerald-700 transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <FiPlus size={16} /> Bulk Entry
          </button>
          {/* NEW: Generate Student List Button */}
          <button
            onClick={generateStudentListPdfHandler}
            disabled={loading.generating || students.length === 0}
            className={`px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${
              loading.generating || students.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading.generating ? (
              <>
                <FiLoader className="animate-spin" size={16} />
                Generating...
              </>
            ) : (
              <>
                <FiDownload size={16} />
                Generate Student List
              </>
            )}
          </button>
        </div>
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
              <div className="text-emerald-500 absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-black pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {loading.students ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="p-6 text-center">
              <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr 
                      key={student.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectStudent(student.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <FiUser className="text-emerald-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.studentNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.program.name}</div>
                        <div className="text-sm text-gray-500">{student.department.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.registrationNumber}</div>
                        <div className="text-sm text-gray-500">
                          Joined {formatDate(student.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleSelectStudent(student.id)}
                          className="text-emerald-600 hover:text-emerald-900 mr-4"
                          title="View Details"
                        >
                          <FiInfo />
                        </button>
                        <button
                          onClick={() => {
                            handleSelectStudent(student.id);
                            setIsViewModalOpen(false);
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => {
                            // Create a new object that conforms to SelectedStudentType
                            const selectedStudent = {
                              ...student,
                              programId: student.program.id,
                              departmentId: student.department.id,
                            };
                            setSelectedStudent(selectedStudent);
                            handleDeleteStudent();
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

      {/* Create Student Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-6 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> Create New Student
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Number
                  </label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="ID123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    placeholder="REG123456"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Number *
                </label>
                <input
                  type="text"
                  name="studentNumber"
                  value={formData.studentNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="STU789012"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
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
                    Program *
                  </label>
                  <select
                    name="programId"
                    value={formData.programId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    required
                  >
                    <option value="">Select Program</option>
                    {options.programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.code ? `${program.code} - ${program.name}` : program.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester *
                  </label>
                  <select
                    name="currentSemesterId"
                    value={formData.currentSemesterId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    required
                  >
                    <option value="">Select Semester</option>
                    {options.semesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>{semester.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Password Field */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Password *
  </label>
  <input
    type="password"
    name="password"
    value={formData.password}
    onChange={handleChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
    placeholder="Enter password"
    required
  />
  <p className="text-xs text-gray-500 mt-1">
    Must be at least 8 characters with uppercase, lowercase, number, and special character
  </p>
</div>

{/* Add Role Field */}
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
    {options.roles?.map((role) => (
      <option key={role.id} value={role.id}>{role.name}</option>
    ))}
  </select>
</div>

              {/* File Upload Sections */}
              <div className="grid grid-cols-3 gap-4">
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
                      <image href={filePreviews.passportPhoto} className="h-20 w-20 object-cover rounded" />
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
                    ID Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'idPhoto')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {filePreviews.idPhoto && (
                    <div className="mt-2">
                      <image href={filePreviews.idPhoto} className="h-20 w-20 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeFile('idPhoto')}
                        className="mt-1 text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificate
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, 'certificate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {filePreviews.certificate && (
                    <div className="mt-2">
                      <div className="h-20 w-20 bg-gray-100 rounded flex items-center justify-center">
                        <FiFileText className="text-gray-400 text-2xl" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('certificate')}
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
                onClick={handleCreateStudent}
                disabled={loading.create || !formData.firstName || !formData.lastName || !formData.email || 
                      !formData.registrationNumber || !formData.studentNumber || 
                      !formData.programId || !formData.departmentId || !formData.currentSemesterId ||
                      !formData.password || !formData.roleId} 
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
                    Create Student
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Details Modal */}
      {/* View Student Details Modal */}
{isViewModalOpen && selectedStudent && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-auto">
    <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center border-b p-6">
        <h2 className="text-xl font-bold text-gray-800">Student Details</h2>
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
              {selectedStudent.firstName} {selectedStudent.lastName}
            </h2>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1 text-sm text-gray-900">{selectedStudent.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Student Number</h3>
                <p className="mt-1 text-sm text-gray-900">{selectedStudent.studentNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Registration Number</h3>
                <p className="mt-1 text-sm text-gray-900">{selectedStudent.registrationNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">ID Number</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedStudent.idNumber || 'Not provided'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date Joined</h3>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedStudent.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedStudent.updatedAt)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Program</h3>
                <p className="mt-1 text-sm text-gray-900">{selectedStudent.program?.name || 'Unknown'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Department</h3>
                <p className="mt-1 text-sm text-gray-900">{selectedStudent.department?.name || 'Unknown'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Current Semester</h3>
                <p className="mt-1 text-sm text-gray-900">{selectedStudent.currentSemester?.name || 'Unknown'}</p>
              </div>
              
              {/* User Account Information */}
              {selectedStudent.user && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">User ID</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedStudent.user.id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">User Role</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedStudent.user.role?.name || 'Unknown'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Documents Section */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <FiCamera /> Passport Photo
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedStudent.passportPhotoUrl ? (
                      <a 
                        href={selectedStudent.passportPhotoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        View Photo <FiExternalLink size={12} />
                      </a>
                    ) : 'Not uploaded'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <FiCreditCard /> ID Photo
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedStudent.idPhotoUrl ? (
                      <a 
                        href={selectedStudent.idPhotoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        View Photo <FiExternalLink size={12} />
                      </a>
                    ) : 'Not uploaded'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <FiAward /> Certificate
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedStudent.certificateUrl ? (
                      <a 
                        href={selectedStudent.certificateUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        View Document <FiExternalLink size={12} />
                      </a>
                    ) : 'Not uploaded'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollments Section */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <FiBook /> Enrollments
          </h3>
          {loading.enrollments ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
              No enrollments found for this student
            </div>
          ) : (
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semester
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollment Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.course.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {enrollment.course.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {enrollment.semester.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-3 p-6 border-t">
        <button
          onClick={() => {
            setIsViewModalOpen(false);
            setIsEditModalOpen(true);
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
        >
          <FiEdit2 size={16} />
          Edit Student
        </button>
        <button
          onClick={handleDeleteStudent}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center gap-2"
        >
          <FiTrash2 size={16} />
          Delete Student
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

      {/* Edit Student Modal */}
      {isEditModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-6 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiEdit2 size={18} /> Edit Student
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Number
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
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Number *
                </label>
                <input
                  type="text"
                  name="studentNumber"
                  value={formData.studentNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
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
                    Program *
                  </label>
                  <select
                    name="programId"
                    value={formData.programId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    required
                  >
                    <option value="">Select Program</option>
                    {options.programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.code ? `${program.code} - ${program.name}` : program.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester *
                  </label>
                  <select
                    name="currentSemesterId"
                    value={formData.currentSemesterId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                    required
                  >
                    <option value="">Select Semester</option>
                    {options.semesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>{semester.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (leave blank to keep current)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 pr-10"
                    placeholder="Enter new password"
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
                  {options.roles?.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              {/* File Upload Sections */}
              <div className="grid grid-cols-3 gap-4">
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
                      <image href={filePreviews.passportPhoto} className="h-20 w-20 object-cover rounded" />
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
                    ID Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'idPhoto')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {filePreviews.idPhoto && (
                    <div className="mt-2">
                      <image href={filePreviews.idPhoto} className="h-20 w-20 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeFile('idPhoto')}
                        className="mt-1 text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificate
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, 'certificate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {filePreviews.certificate && (
                    <div className="mt-2">
                      <div className="h-20 w-20 bg-gray-100 rounded flex items-center justify-center">
                        <FiFileText className="text-gray-400 text-2xl" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('certificate')}
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
                onClick={handleUpdateStudent}
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
      <BulkStudentsModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSubmit={handleBulkCreateStudents}
        options={options}
      />
    </div>
  );
}