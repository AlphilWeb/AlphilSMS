// components/admin/bulk-students-modal.client.tsx
'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiX, FiUpload, FiDownload, FiTrash2 } from 'react-icons/fi';

interface BulkStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (students: StudentData[]) => Promise<void>;
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

const initialStudentData: StudentData = {
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
};

export default function BulkStudentsModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  options 
}: BulkStudentsModalProps) {
  const [students, setStudents] = useState<StudentData[]>([{ ...initialStudentData }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

useEffect(() => {
  if (isOpen) {
    // Reset form when modal opens
    setStudents([{ ...initialStudentData }]);
    setError(null);
    setSuccess(null);
    
    // Set default values for dropdowns if options are available
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
}, [isOpen, options.departments, options.programs, options.roles, options.semesters]);

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
      const updatedStudents = [...students];
      updatedStudents.splice(index, 1);
      setStudents(updatedStudents);
    }
  };

  const handleChange = (index: number, field: keyof StudentData, value: string | number) => {
    const updatedStudents = [...students];
    updatedStudents[index] = {
      ...updatedStudents[index],
      [field]: value
    };
    setStudents(updatedStudents);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate all required fields
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        if (!student.firstName || !student.lastName || !student.email || 
            !student.registrationNumber || !student.studentNumber || 
            !student.programId || !student.departmentId || !student.currentSemesterId ||
            !student.password || !student.roleId) {
          throw new Error(`Row ${i + 1}: All required fields must be filled`);
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(student.email)) {
          throw new Error(`Row ${i + 1}: Invalid email format`);
        }
      }
      
      await onSubmit(students);
      setSuccess(`${students.length} students added successfully!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add students');
      console.error('Error adding students:', err);
    } finally {
      setLoading(false);
    }
  };

const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const lines = content.split('\n').filter(line => line.trim());

      // Skip header row if exists
      const dataRows = lines[0].toLowerCase().includes('firstname') ? lines.slice(1) : lines;

      const parsedStudents = dataRows.map(line => {
        const values = line.split(',').map(v => v.trim());
        
        // Capitalize both DB values and CSV input for comparison
        const normalize = (val: string) => val.toUpperCase();

        const program = options.programs.find(p => normalize(p.name) === normalize(values[6]));
        const department = options.departments.find(d => normalize(d.name) === normalize(values[7]));
        const semester = options.semesters.find(s => normalize(s.name) === normalize(values[8]));
        const role = options.roles.find(r => normalize(r.name) === normalize(values[10]));

        return {
          firstName: values[0] || '',
          lastName: values[1] || '',
          email: values[2] || '',
          idNumber: values[3] || '',
          registrationNumber: values[4] || '',
          studentNumber: values[5] || '',
          programId: program?.id || 0,
          departmentId: department?.id || 0,
          currentSemesterId: semester?.id || 0,
          password: values[9] || '',
          roleId: role?.id || 0,
        };
      });

      setStudents(parsedStudents.length > 0 ? parsedStudents : [{ ...initialStudentData }]);
    } catch (err) {
      setError('Failed to parse CSV file. Please check the format.');
      console.error('Error parsing CSV file:', err);
    }
  };
  reader.readAsText(file);
};


const downloadTemplate = () => {
  const headers = [
    'firstName', 'lastName', 'email', 'idNumber', 'registrationNumber',
    'studentNumber', 'programName', 'department', 'semester',
    'password', 'role'
  ];
    
  const csvContent = headers.join(',') + '\n';
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'students_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-8xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-6 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiPlus size={18} /> Bulk Student Entry
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
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
              <FiX className="flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Import/Export Controls */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3">
              <label className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 flex items-center gap-2 cursor-pointer">
                <FiUpload size={16} />
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 flex items-center gap-2"
              >
                <FiDownload size={16} />
                Download Template
              </button>
            </div>
            <button
              onClick={addRow}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <FiPlus size={16} />
              Add Row
            </button>
          </div>

          {/* Table for bulk entry */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration NO
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student NO
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program 
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Password
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.firstName}
                        onChange={(e) => handleChange(index, 'firstName', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm"
                        placeholder="John"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.lastName}
                        onChange={(e) => handleChange(index, 'lastName', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm"
                        placeholder="Doe"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <input
                        type="email"
                        value={student.email}
                        onChange={(e) => handleChange(index, 'email', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm"
                        placeholder="john.doe@example.com"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.idNumber}
                        onChange={(e) => handleChange(index, 'idNumber', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm"
                        placeholder="ID123456"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.registrationNumber}
                        onChange={(e) => handleChange(index, 'registrationNumber', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm"
                        placeholder="REG123456"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.studentNumber}
                        onChange={(e) => handleChange(index, 'studentNumber', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm"
                        placeholder="STU789012"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <select
                        value={student.programId}
                        onChange={(e) => handleChange(index, 'programId', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm"
                      >
                        {options.programs.map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.code ? `${program.code} - ${program.name}` : program.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <select
                        value={student.departmentId}
                        onChange={(e) => handleChange(index, 'departmentId', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm"
                      >
                        {options.departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <select
                        value={student.currentSemesterId}
                        onChange={(e) => handleChange(index, 'currentSemesterId', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm"
                      >
                        {options.semesters.map((semester) => (
                          <option key={semester.id} value={semester.id}>{semester.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <input
                        type="password"
                        value={student.password}
                        onChange={(e) => handleChange(index, 'password', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm"
                        placeholder="Password"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <select
                        value={student.roleId}
                        onChange={(e) => handleChange(index, 'roleId', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm"
                      >
                        {options.roles.map((role) => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <button
                        onClick={() => removeRow(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove row"
                        disabled={students.length === 1}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 ${
              loading ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
            } transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Adding {students.length} Students...
              </>
            ) : (
              `Add ${students.length} Students`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}