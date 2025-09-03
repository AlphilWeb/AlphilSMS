// components/admin/bulk-students-modal.client.tsx
'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiX, FiUpload, FiDownload, FiTrash2 } from 'react-icons/fi';

interface BulkStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (students: StudentWithDetailsData[]) => Promise<void>;
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

interface StudentWithDetailsData {
  // Student basic info
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
  
  // Personal details
  age: number;
  sex: string;
  county: string;
  village: string;
  contact1: string;
  contact2: string;
  contact3: string;
  dateJoined: string; // ISO date string
}

const initialStudentData: StudentWithDetailsData = {
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
  
  // Personal details defaults
  age: 18,
  sex: '',
  county: '',
  village: '',
  contact1: '',
  contact2: '',
  contact3: '',
  dateJoined: new Date().toISOString().split('T')[0], // Today's date
};

export default function BulkStudentsModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  options 
}: BulkStudentsModalProps) {
  const [students, setStudents] = useState<StudentWithDetailsData[]>([{ ...initialStudentData }]);
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

  const handleChange = (index: number, field: keyof StudentWithDetailsData, value: string | number) => {
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
        
        // Student basic info validation
        if (!student.firstName || !student.lastName || !student.email || 
            !student.registrationNumber || !student.studentNumber || 
            !student.programId || !student.departmentId || !student.currentSemesterId ||
            !student.password || !student.roleId) {
          throw new Error(`Row ${i + 1}: All student fields must be filled`);
        }
        
        // Personal details validation
        if (!student.age || !student.sex || !student.county || !student.village || 
            !student.contact1 || !student.dateJoined) {
          throw new Error(`Row ${i + 1}: All personal details fields must be filled`);
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(student.email)) {
          throw new Error(`Row ${i + 1}: Invalid email format`);
        }
        
        // Age validation
        if (student.age < 16 || student.age > 100) {
          throw new Error(`Row ${i + 1}: Age must be between 16 and 100`);
        }
        
        // Contact validation
        if (student.contact1.length < 10) {
          throw new Error(`Row ${i + 1}: Contact 1 must be at least 10 characters`);
        }
      }
      
      await onSubmit(students);
      setSuccess(`${students.length} students with details added successfully!`);
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
      console.log('Raw CSV content:', content); // Debug log
      
      const lines = content.split('\n').filter(line => line.trim());
      console.log('CSV lines:', lines); // Debug log

      // Skip header row if exists
      const hasHeaders = lines[0].toLowerCase().includes('firstname');
      const dataRows = hasHeaders ? lines.slice(1) : lines;
      console.log('Data rows:', dataRows); // Debug log

      const parsedStudents = dataRows.map((line, index) => {
        // Better CSV parsing that handles quotes and empty values
        const values = line.split(',').map(v => {
          let value = v.trim();
          // Remove quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1).trim();
          }
          return value;
        });
        
        console.log(`Row ${index} values:`, values); // Debug log

        const normalize = (val: string) => val.toUpperCase();

        const program = options.programs.find(p => normalize(p.name) === normalize(values[6]));
        const department = options.departments.find(d => normalize(d.name) === normalize(values[7]));
        const semester = options.semesters.find(s => normalize(s.name) === normalize(values[8]));
        const role = options.roles.find(r => normalize(r.name) === normalize(values[10]));

        // Parse age safely - handle empty strings and non-numbers
        const ageValue = values[11]?.trim();
        const parsedAge = ageValue ? parseInt(ageValue) : 0;
        const age = isNaN(parsedAge) ? 18 : Math.max(16, Math.min(100, parsedAge));

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
          password: values[9]?.trim() || '',
          roleId: role?.id || 0,
          
          // Personal details from CSV
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

      console.log('Parsed students:', parsedStudents); // Debug log
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
    a.download = 'students_with_details_template.csv';
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
            <FiPlus size={18} /> Bulk Student Entry with Details
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
                  {/* Student Info Headers */}
                  <th colSpan={6} className="px-4 py-3 text-center bg-blue-100 text-xs font-medium text-blue-800 uppercase tracking-wider">
                    Student Information
                  </th>
                  <th colSpan={5} className="px-4 py-3 text-center bg-green-100 text-xs font-medium text-green-800 uppercase tracking-wider">
                    Personal Details
                  </th>
                  <th className="bg-gray-50"></th>
                </tr>
                <tr>
                  {/* Student Info Columns */}
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Name
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Name
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Number
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reg No
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student No
                  </th>
                  
                  {/* Personal Details Columns */}
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sex
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    County
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Village
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact 1
                  </th>
                  
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {/* Student Info Cells */}
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.firstName}
                        onChange={(e) => handleChange(index, 'firstName', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 text-sm"
                        placeholder="John"
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.lastName}
                        onChange={(e) => handleChange(index, 'lastName', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 text-sm"
                        placeholder="Doe"
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input
                        type="email"
                        value={student.email}
                        onChange={(e) => handleChange(index, 'email', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 text-sm"
                        placeholder="john.doe@example.com"
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.idNumber}
                        onChange={(e) => handleChange(index, 'idNumber', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 text-sm"
                        placeholder="ID123456"
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.registrationNumber}
                        onChange={(e) => handleChange(index, 'registrationNumber', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 text-sm"
                        placeholder="REG123456"
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.studentNumber}
                        onChange={(e) => handleChange(index, 'studentNumber', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 text-sm"
                        placeholder="STU789012"
                      />
                    </td>
                    
                    {/* Personal Details Cells */}
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input
                        type="number"
                        value={student.age}
                        onChange={(e) => handleChange(index, 'age', parseInt(e.target.value) || 18)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 text-sm"
                        min="16"
                        max="100"
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <select
                        value={student.sex}
                        onChange={(e) => handleChange(index, 'sex', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 text-sm"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.county}
                        onChange={(e) => handleChange(index, 'county', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 text-sm"
                        placeholder="Nairobi"
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.village}
                        onChange={(e) => handleChange(index, 'village', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 text-sm"
                        placeholder="Karen"
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={student.contact1}
                        onChange={(e) => handleChange(index, 'contact1', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 text-sm"
                        placeholder="+254712345678"
                      />
                    </td>
                    
                    <td className="px-2 py-2 whitespace-nowrap">
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

          {/* Additional personal details section (optional contacts) */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Contact Information (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {students.map((student, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-xs text-gray-600">Row {index + 1} - Additional Contacts</label>
                  <input
                    type="text"
                    value={student.contact2}
                    onChange={(e) => handleChange(index, 'contact2', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 text-sm"
                    placeholder="Contact 2 (Emergency)"
                  />
                  <input
                    type="text"
                    value={student.contact3}
                    onChange={(e) => handleChange(index, 'contact3', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 text-sm"
                    placeholder="Contact 3 (Next of Kin)"
                  />
                  <input
                    type="date"
                    value={student.dateJoined}
                    onChange={(e) => handleChange(index, 'dateJoined', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-800 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Program/Department/Semester/Role Selection */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            {students.map((student, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-xs text-gray-600">Row {index + 1} - Academic Info</label>
                <select
                  value={student.programId}
                  onChange={(e) => handleChange(index, 'programId', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 text-sm"
                >
                  <option value={0}>Select Program</option>
                  {options.programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.code ? `${program.code} - ${program.name}` : program.name}
                    </option>
                  ))}
                </select>
                <select
                  value={student.departmentId}
                  onChange={(e) => handleChange(index, 'departmentId', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 text-sm"
                >
                  <option value={0}>Select Department</option>
                  {options.departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                <select
                  value={student.currentSemesterId}
                  onChange={(e) => handleChange(index, 'currentSemesterId', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 text-sm"
                >
                  <option value={0}>Select Semester</option>
                  {options.semesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>{semester.name}</option>
                  ))}
                </select>
                <select
                  value={student.roleId}
                  onChange={(e) => handleChange(index, 'roleId', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 text-sm"
                >
                  <option value={0}>Select Role</option>
                  {options.roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <input
                  type="password"
                  value={student.password}
                  onChange={(e) => handleChange(index, 'password', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 text-sm"
                  placeholder="Password"
                />
              </div>
            ))}
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