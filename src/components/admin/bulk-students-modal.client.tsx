// components/admin/bulk-students-modal.client.tsx
'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiX, FiUpload, FiDownload, FiTrash2, FiAlertCircle, FiCheck, FiUser, FiBook, FiMapPin } from 'react-icons/fi';

interface BulkStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (students: StudentWithDetailsFormData[]) => Promise<void>;
  options: {
    programs: Option[];
    departments: Option[];
    semesters: Option[];
    roles: Option[];
  };
}

interface Option {
  id: number;
  name: string;
  code?: string;
}

interface StudentWithDetailsFormData {
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
  age: number;
  sex: string;
  county: string;
  village: string;
  contact1: string;
  contact2: string;
  contact3: string;
  dateJoined: string;
}

const initialStudentData: StudentWithDetailsFormData = {
  firstName: '',
  lastName: '',
  email: '',
  idNumber: '',
  registrationNumber: '',
  studentNumber: '',
  programId: 0,
  departmentId: 0,
  currentSemesterId: 0,
  password: 'DefaultPassword123!',
  roleId: 0,
  age: 18,
  sex: '',
  county: '',
  village: '',
  contact1: '',
  contact2: '',
  contact3: '',
  dateJoined: new Date().toISOString().split('T')[0],
};

export default function BulkStudentsModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  options 
}: BulkStudentsModalProps) {
  const [students, setStudents] = useState<StudentWithDetailsFormData[]>([{ ...initialStudentData }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [activeTab, setActiveTab] = useState<'form' | 'table'>('form');

  useEffect(() => {
    if (isOpen) {
      setStudents([{ ...initialStudentData }]);
      setError(null);
      setSuccess(null);
      setValidationErrors({});
      setActiveTab('form');
      
      if (options.programs.length > 0 && options.departments.length > 0 && 
          options.semesters.length > 0 && options.roles.length > 0) {
        const defaultStudent = {
          ...initialStudentData,
          programId: options.programs[0].id,
          departmentId: options.departments[0].id,
          currentSemesterId: options.semesters[0].id,
          roleId: options.roles.find(r => r.name.toLowerCase().includes('student'))?.id || options.roles[0]?.id || 0
        };
        setStudents([defaultStudent]);
      }
    }
  }, [isOpen, options]);

  const addRow = () => {
    setStudents([...students, { 
      ...initialStudentData,
      programId: options.programs[0]?.id || 0,
      departmentId: options.departments[0]?.id || 0,
      currentSemesterId: options.semesters[0]?.id || 0,
      roleId: options.roles.find(r => r.name.toLowerCase().includes('student'))?.id || options.roles[0]?.id || 0
    }]);
  };

  const removeRow = (index: number) => {
    if (students.length > 1) {
      const updatedStudents = students.filter((_, i) => i !== index);
      setStudents(updatedStudents);
      
      const updatedErrors = { ...validationErrors };
      delete updatedErrors[index];
      setValidationErrors(updatedErrors);
    }
  };

  const handleChange = (index: number, field: keyof StudentWithDetailsFormData, value: string | number) => {
    const updatedStudents = students.map((student, i) => 
      i === index ? { ...student, [field]: value } : student
    );
    setStudents(updatedStudents);
    
    if (validationErrors[index]) {
      const updatedErrors = { ...validationErrors };
      updatedErrors[index] = updatedErrors[index].filter(error => !error.toLowerCase().includes(field.toString().toLowerCase()));
      setValidationErrors(updatedErrors);
    }
  };

  const validateStudent = (student: StudentWithDetailsFormData): string[] => {
    const errors: string[] = [];
    
    if (!student.firstName.trim()) errors.push("First name is required");
    if (!student.lastName.trim()) errors.push("Last name is required");
    if (!student.email.trim()) errors.push("Email is required");
    if (!student.registrationNumber.trim()) errors.push("Registration number is required");
    if (!student.studentNumber.trim()) errors.push("Student number is required");
    if (!student.programId) errors.push("Program is required");
    if (!student.departmentId) errors.push("Department is required");
    if (!student.currentSemesterId) errors.push("Semester is required");
    if (!student.password.trim()) errors.push("Password is required");
    if (!student.roleId) errors.push("Role is required");
    if (!student.age || student.age < 16 || student.age > 100) errors.push("Age must be 16-100");
    if (!student.sex.trim()) errors.push("Gender is required");
    if (!student.county.trim()) errors.push("County is required");
    if (!student.village.trim()) errors.push("Village is required");
    if (!student.contact1.trim()) errors.push("Primary contact is required");
    if (!student.dateJoined.trim()) errors.push("Date joined is required");
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (student.email && !emailRegex.test(student.email)) {
      errors.push("Invalid email format");
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const newValidationErrors: Record<number, string[]> = {};
    let hasErrors = false;
    
    students.forEach((student, index) => {
      const errors = validateStudent(student);
      if (errors.length > 0) {
        newValidationErrors[index] = errors;
        hasErrors = true;
      }
    });
    
    setValidationErrors(newValidationErrors);
    
    if (hasErrors) {
      setError("Please fix the validation errors before submitting.");
      setLoading(false);
      return;
    }
    
    try {
      await onSubmit(students);
      setSuccess(`${students.length} students added successfully!`);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add students");
      console.log(err)
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') || file.size > 5 * 1024 * 1024) {
      setError("Please upload a valid CSV file (max 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
          setError("CSV file is empty");
          return;
        }

        const hasHeaders = lines[0].toLowerCase().includes('firstname');
        const dataRows = hasHeaders ? lines.slice(1) : lines;

        const parsedStudents = dataRows.map(line => {
          const values = line.split(',').map(v => {
            let value = v.trim();
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1).trim();
            }
            return value;
          });

          const program = options.programs.find(p => p.name.toUpperCase() === values[6]?.toUpperCase());
          const department = options.departments.find(d => d.name.toUpperCase() === values[7]?.toUpperCase());
          const semester = options.semesters.find(s => s.name.toUpperCase() === values[8]?.toUpperCase());
          const role = options.roles.find(r => r.name.toUpperCase() === values[10]?.toUpperCase());

          const ageValue = values[11]?.trim();
          const parsedAge = ageValue ? parseInt(ageValue) : 18;
          const age = Math.max(16, Math.min(100, isNaN(parsedAge) ? 18 : parsedAge));

          return {
            firstName: values[0]?.trim() || '',
            lastName: values[1]?.trim() || '',
            email: values[2]?.trim() || '',
            idNumber: values[3]?.trim() || '',
            registrationNumber: values[4]?.trim() || '',
            studentNumber: values[5]?.trim() || '',
            programId: program?.id || 0,
            departmentId: department?.id || 0,
            currentSemesterId: semester?.id || 0,
            password: values[9]?.trim() || 'DefaultPassword123!',
            roleId: role?.id || 0,
            age: age,
            sex: values[12]?.trim() || '',
            county: values[13]?.trim() || '',
            village: values[14]?.trim() || '',
            contact1: values[15]?.trim() || '',
            contact2: values[16]?.trim() || '',
            contact3: values[17]?.trim() || '',
            dateJoined: values[18]?.trim() || new Date().toISOString().split('T')[0],
          };
        });

        setStudents(parsedStudents.length > 0 ? parsedStudents : [{ ...initialStudentData }]);
        setActiveTab('table');
        setSuccess(`Imported ${parsedStudents.length} students from CSV`);
      } catch (err) {
        setError("Failed to parse CSV file. Please check the format.");
        console.log(err)
      }
    };
    
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = [
      'firstName', 'lastName', 'email', 'idNumber', 'registrationNumber',
      'studentNumber', 'programName', 'department', 'semester',
      'password', 'role', 'age', 'sex', 'county', 'village',
      'contact1', 'contact2', 'contact3', 'dateJoined'
    ];
      
    const csvContent = headers.join(',') + '\n' +
      'John,Doe,john.doe@example.com,ID123456,REG123456,STU789012,' +
      'Computer Science,IT Department,Semester 1,' +
      'password123,Student,20,Male,Nairobi,Karen,' +
      '+254712345678,+254723456789,+254734567890,2024-01-15';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSuccess("Template downloaded successfully");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-opacity-50">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <FiUser className="w-6 h-6" />
              Bulk Student Creation
            </h2>
            <p className="text-emerald-100 mt-1">Add multiple students with complete details</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-emerald-500 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 border-r p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FiUpload className="w-4 h-4" />
                Import Options
              </h3>
              
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-2">Upload CSV File</span>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="px-4 py-3 bg-white border-2 border-dashed border-emerald-300 rounded-lg hover:border-emerald-400 transition-colors cursor-pointer text-center">
                    <FiUpload className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <span className="text-sm text-emerald-600 font-medium">Choose CSV File</span>
                    <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
                  </div>
                </div>
              </label>

              <button
                onClick={downloadTemplate}
                className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2 text-gray-700"
              >
                <FiDownload className="w-4 h-4" />
                Download Template
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FiPlus className="w-4 h-4" />
                Quick Actions
              </h3>
              
              <button
                onClick={addRow}
                className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Add Student Row
              </button>

              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-gray-700 mb-2">Current Status</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Students</span>
                    <span className="font-semibold">{students.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Validation Errors</span>
                    <span className="text-red-600 font-semibold">
                      {Object.values(validationErrors).flat().length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto p-6">
            {/* Status Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-green-700">{success}</span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b mb-6">
              <button
                onClick={() => setActiveTab('form')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'form'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Form View
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'table'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Table View ({students.length})
              </button>
            </div>

            {/* Form View */}
            {activeTab === 'form' && (
              <div className="space-y-6">
                {students.map((student, index) => (
                  <div key={index} className="bg-white rounded-xl border p-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg text-gray-800">
                        Student #{index + 1}
                      </h3>
                      {students.length > 1 && (
                        <button
                          onClick={() => removeRow(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove student"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {validationErrors[index] && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
                        <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                          {validationErrors[index].map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <FiUser className="w-4 h-4" />
                          Personal Info
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input
                              type="text"
                              value={student.firstName}
                              onChange={(e) => handleChange(index, 'firstName', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input
                              type="text"
                              value={student.lastName}
                              onChange={(e) => handleChange(index, 'lastName', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="Doe"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input
                              type="email"
                              value={student.email}
                              onChange={(e) => handleChange(index, 'email', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="john.doe@example.com"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Academic Information */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <FiBook className="w-4 h-4" />
                          Academic Info
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                            <input
                              type="text"
                              value={student.registrationNumber}
                              onChange={(e) => handleChange(index, 'registrationNumber', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="REG123456"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Student Number *</label>
                            <input
                              type="text"
                              value={student.studentNumber}
                              onChange={(e) => handleChange(index, 'studentNumber', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="STU789012"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                            <select
                              value={student.programId}
                              onChange={(e) => handleChange(index, 'programId', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                              <option value={0}>Select Program</option>
                              {options.programs.map((program) => (
                                <option key={program.id} value={program.id}>
                                  {program.code ? `${program.code} - ${program.name}` : program.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <FiMapPin className="w-4 h-4" />
                          Additional Details
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                            <input
                              type="number"
                              value={student.age}
                              onChange={(e) => handleChange(index, 'age', parseInt(e.target.value) || 18)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              min="16"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                            <select
                              value={student.sex}
                              onChange={(e) => handleChange(index, 'sex', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact *</label>
                            <input
                              type="text"
                              value={student.contact1}
                              onChange={(e) => handleChange(index, 'contact1', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="+254712345678"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Details Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                        <select
                          value={student.departmentId}
                          onChange={(e) => handleChange(index, 'departmentId', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value={0}>Select Department</option>
                          {options.departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                        <select
                          value={student.currentSemesterId}
                          onChange={(e) => handleChange(index, 'currentSemesterId', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value={0}>Select Semester</option>
                          {options.semesters.map((semester) => (
                            <option key={semester.id} value={semester.id}>{semester.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                        <select
                          value={student.roleId}
                          onChange={(e) => handleChange(index, 'roleId', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value={0}>Select Role</option>
                          {options.roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                          type="text"
                          value={student.password}
                          onChange={(e) => handleChange(index, 'password', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Enter password"
                        />
                      </div>
                    </div>

                    {/* Location and Contact Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">County *</label>
                        <input
                          type="text"
                          value={student.county}
                          onChange={(e) => handleChange(index, 'county', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Nairobi"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Village *</label>
                        <input
                          type="text"
                          value={student.village}
                          onChange={(e) => handleChange(index, 'village', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Karen"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                        <input
                          type="text"
                          value={student.contact2}
                          onChange={(e) => handleChange(index, 'contact2', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="+254723456789"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Joined *</label>
                        <input
                          type="date"
                          value={student.dateJoined}
                          onChange={(e) => handleChange(index, 'dateJoined', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Table View */}
            {activeTab === 'table' && (
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Student No</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Program</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Age</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map((student, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{student.studentNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {options.programs.find(p => p.id === student.programId)?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{student.age}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => removeRow(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove student"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-white p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {students.length} student{students.length !== 1 ? 's' : ''} ready for import
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || Object.values(validationErrors).flat().length > 0}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  `Add ${students.length} Students`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}