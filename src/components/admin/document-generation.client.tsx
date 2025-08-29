// components/admin/documents.client.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { ActionError } from '@/lib/utils';
import {
  FiFileText, FiDownload, FiLoader, FiX, FiCheck, FiUsers, FiUser, 
  FiCreditCard, FiBook, FiFilter
} from 'react-icons/fi';
import { getAllSemesters } from '@/lib/actions/academic-calendar.actions';
import { getAllPrograms } from '@/lib/actions/admin/courses.actions';
import { 
  generateReceiptPdf, 
  generateStudentListPdf, 
  generateStaffListPdf, 
  generateInvoiceListPdf, 
  generatePaymentListPdf, 
  generateTranscriptPdf 
} from '@/lib/actions/pdf-generataion/pdf-generation.actions';
import { getAllCourses } from '@/lib/actions/registrar.courses.action';
import { getAllDepartments } from '@/lib/actions/registrar.department.actions';
import { getAllStudents } from '@/lib/actions/admin/students.action'; // Add this import

interface Option {
  id: number;
  name: string;
  code?: string;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  studentNumber: string;
  email?: string;
}

interface DocumentFilters {
  // Receipt filters
  paymentId?: string;
  
  // Student list filters
  studentListProgramId?: number;
  studentListCourseId?: number;
  studentListSemesterId?: number;
  
  // Staff list filters
  staffListProgramId?: number;
  staffListPosition?: string;
  
  // Invoice list filters
  invoiceStudentName?: string;
  invoiceBalanceOnly?: boolean;
  invoiceStartDate?: string;
  invoiceEndDate?: string;
  invoiceStatus?: string;
  
  // Payment list filters
  paymentMethod?: string;
  paymentStudentName?: string;
  paymentStartDate?: string;
  paymentEndDate?: string;
  
  // Transcript filters
  transcriptProgramId?: number;
  transcriptCourseId?: number;
  transcriptStudentName?: string;
}

export default function DocumentsClient() {
  const [activeTab, setActiveTab] = useState('receipt');
  const [loading, setLoading] = useState({
    generating: false,
    options: true,
    students: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>({});
  
  // Options for filters
  const [programs, setPrograms] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  console.log(departments);
  const [semesters, setSemesters] = useState<Option[]>([]);
  const [courses, setCourses] = useState<Option[]>([]);
  const [positions, setPositions] = useState<string[]>([]);

  // Student search functionality
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const studentDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
        setShowStudentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load options on component mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(prev => ({ ...prev, options: true, students: true }));
        setError(null);
        
        const [programsData, departmentsData, semestersData, coursesData, studentsData] = await Promise.all([
          getAllPrograms(),
          getAllDepartments(),
          getAllSemesters(),
          getAllCourses(),
          getAllStudents()
        ]);
        
        setPrograms(programsData);
        setDepartments(departmentsData);
        setSemesters(semestersData);
        setCourses(coursesData);
        setStudents(studentsData);
        setFilteredStudents(studentsData);
        
        // Mock positions - in a real app, these would come from the database
        setPositions(['Professor', 'Lecturer', 'Administrator', 'Support Staff', 'Department Head']);
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Failed to load options');
      } finally {
        setLoading(prev => ({ ...prev, options: false, students: false }));
      }
    };

    loadOptions();
  }, []);

  // Filter students based on search
  useEffect(() => {
    if (!studentSearch.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => 
      student.firstName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.lastName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(studentSearch.toLowerCase()))
    );
    setFilteredStudents(filtered);
  }, [studentSearch, students]);

  // Handle filter changes
  const handleFilterChange = (key: keyof DocumentFilters, value: string | number | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle student selection for transcript search
  const handleStudentSelect = (student: Student) => {
    setStudentSearch('');
    setSelectedStudentName(`${student.firstName} ${student.lastName} (${student.studentNumber})`);
    handleFilterChange('transcriptStudentName', `${student.firstName} ${student.lastName}`);
    setShowStudentDropdown(false);
  };

  // Handle student selection for invoice search
  const handleInvoiceStudentSelect = (student: Student) => {
    setStudentSearch('');
    setSelectedStudentName(`${student.firstName} ${student.lastName} (${student.studentNumber})`);
    handleFilterChange('invoiceStudentName', `${student.firstName} ${student.lastName}`);
    setShowStudentDropdown(false);
  };

  // Handle student selection for payment search
  const handlePaymentStudentSelect = (student: Student) => {
    setStudentSearch('');
    setSelectedStudentName(`${student.firstName} ${student.lastName} (${student.studentNumber})`);
    handleFilterChange('paymentStudentName', `${student.firstName} ${student.lastName}`);
    setShowStudentDropdown(false);
  };

  // Clear student selection
  const clearStudentSelection = () => {
    setStudentSearch('');
    setSelectedStudentName('');
    
    // Clear the appropriate filter based on active tab
    if (activeTab === 'transcripts') {
      handleFilterChange('transcriptStudentName', undefined);
    } else if (activeTab === 'invoices') {
      handleFilterChange('invoiceStudentName', undefined);
    } else if (activeTab === 'payments') {
      handleFilterChange('paymentStudentName', undefined);
    }
  };

  // Generate PDF based on active tab
  const generatePdf = async () => {
    try {
      setLoading(prev => ({ ...prev, generating: true }));
      setError(null);
      setSuccess(null);

      let pdfBuffer: Buffer;
      
      switch (activeTab) {
        case 'receipt':
          if (!filters.paymentId) {
            throw new ActionError('Payment ID is required');
          }
          pdfBuffer = await generateReceiptPdf(parseInt(filters.paymentId));
          break;
          
        case 'students':
          pdfBuffer = await generateStudentListPdf({
            programId: filters.studentListProgramId,
            courseId: filters.studentListCourseId,
            semesterId: filters.studentListSemesterId,
          });
          break;
          
        case 'staff':
          pdfBuffer = await generateStaffListPdf({
            programId: filters.staffListProgramId,
            position: filters.staffListPosition,
          });
          break;
          
        case 'invoices':
          pdfBuffer = await generateInvoiceListPdf({
            studentName: filters.invoiceStudentName,
            balanceGreaterThanZero: filters.invoiceBalanceOnly,
            dueDateRange: filters.invoiceStartDate && filters.invoiceEndDate ? {
              start: new Date(filters.invoiceStartDate),
              end: new Date(filters.invoiceEndDate)
            } : undefined,
            status: filters.invoiceStatus,
          });
          break;
          
        case 'payments':
          pdfBuffer = await generatePaymentListPdf({
            paymentMethod: filters.paymentMethod,
            studentName: filters.paymentStudentName,
            dateRange: filters.paymentStartDate && filters.paymentEndDate ? {
              start: new Date(filters.paymentStartDate),
              end: new Date(filters.paymentEndDate)
            } : undefined,
          });
          break;
          
        case 'transcripts':
          pdfBuffer = await generateTranscriptPdf({
            programId: filters.transcriptProgramId,
            courseId: filters.transcriptCourseId,
            studentName: filters.transcriptStudentName,
          });
          break;
          
        default:
          throw new ActionError('Invalid document type');
      }
      
      // Create a blob and download the PDF
      const uint8Array = new Uint8Array(pdfBuffer);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Document generated successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to generate document');
    } finally {
      setLoading(prev => ({ ...prev, generating: false }));
    }
  };

  // Reset filters for current tab
  const resetFilters = () => {
    const tabSpecificFilters: Record<string, (keyof DocumentFilters)[]> = {
      receipt: ['paymentId'],
      students: ['studentListProgramId', 'studentListCourseId', 'studentListSemesterId'],
      staff: ['staffListProgramId', 'staffListPosition'],
      invoices: ['invoiceStudentName', 'invoiceBalanceOnly', 'invoiceStartDate', 'invoiceEndDate', 'invoiceStatus'],
      payments: ['paymentMethod', 'paymentStudentName', 'paymentStartDate', 'paymentEndDate'],
      transcripts: ['transcriptProgramId', 'transcriptCourseId', 'transcriptStudentName'],
    };
    
    const filtersToReset = tabSpecificFilters[activeTab] || [];
    const newFilters = { ...filters };
    
    filtersToReset.forEach(key => {
      delete newFilters[key];
    });
    
    setFilters(newFilters);
    setStudentSearch('');
    setSelectedStudentName('');
  };

  // Student search component
  const renderStudentSearch = (onSelect: (student: Student) => void) => (
    <div className="relative" ref={studentDropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Student Search
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder={selectedStudentName || "Search students by name or ID..."}
          value={studentSearch}
          onChange={(e) => {
            setStudentSearch(e.target.value);
            setShowStudentDropdown(true);
          }}
          onFocus={() => setShowStudentDropdown(true)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
        />
        {selectedStudentName && (
          <button
            type="button"
            onClick={clearStudentSelection}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <FiX size={16} />
          </button>
        )}
      </div>
      
      {/* Student Dropdown */}
      {showStudentDropdown && filteredStudents.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredStudents.map(student => (
            <div
              key={student.id}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0"
              onClick={() => onSelect(student)}
            >
              <div className="font-medium">{student.firstName} {student.lastName}</div>
              <div className="text-gray-500 text-xs">{student.studentNumber}</div>
              {student.email && <div className="text-gray-500 text-xs">{student.email}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Show selected student */}
      {selectedStudentName && (
        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-md">
          <div className="text-sm font-medium text-emerald-800">Selected:</div>
          <div className="text-sm text-emerald-600">{selectedStudentName}</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Document Generation</h1>
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

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'receipt', label: 'Receipt', icon: <FiFileText size={18} /> },
              { id: 'students', label: 'Student List', icon: <FiUsers size={18} /> },
              { id: 'staff', label: 'Staff List', icon: <FiUser size={18} /> },
              { id: 'invoices', label: 'Invoice List', icon: <FiCreditCard size={18} /> },
              { id: 'payments', label: 'Payment List', icon: <FiFileText size={18} /> },
              { id: 'transcripts', label: 'Transcripts', icon: <FiBook size={18} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setStudentSearch('');
                  setSelectedStudentName('');
                }}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Filter Form */}
        <div className="p-6">
          {loading.options ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-100 rounded"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                  <FiFilter size={18} /> 
                  {activeTab === 'receipt' && 'Receipt Generation'}
                  {activeTab === 'students' && 'Student List Filters'}
                  {activeTab === 'staff' && 'Staff List Filters'}
                  {activeTab === 'invoices' && 'Invoice List Filters'}
                  {activeTab === 'payments' && 'Payment List Filters'}
                  {activeTab === 'transcripts' && 'Transcript Filters'}
                </h2>
                <button
                  onClick={resetFilters}
                  className="px-3 py-1 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Reset Filters
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Receipt Filters */}
                {activeTab === 'receipt' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment ID *
                    </label>
                    <input
                      type="text"
                      value={filters.paymentId || ''}
                      onChange={(e) => handleFilterChange('paymentId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                      placeholder="Enter payment ID"
                    />
                  </div>
                )}

                {/* Student List Filters */}
                {activeTab === 'students' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program
                      </label>
                      <select
                        value={filters.studentListProgramId || ''}
                        onChange={(e) => handleFilterChange('studentListProgramId', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                      >
                        <option value="">All Programs</option>
                        {programs.map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.code ? `${program.code} - ${program.name}` : program.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course
                      </label>
                      <select
                        value={filters.studentListCourseId || ''}
                        onChange={(e) => handleFilterChange('studentListCourseId', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                      >
                        <option value="">All Courses</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.code ? `${course.code} - ${course.name}` : course.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Semester
                      </label>
                      <select
                        value={filters.studentListSemesterId || ''}
                        onChange={(e) => handleFilterChange('studentListSemesterId', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                      >
                        <option value="">All Semesters</option>
                        {semesters.map((semester) => (
                          <option key={semester.id} value={semester.id}>{semester.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Staff List Filters */}
                {activeTab === 'staff' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program
                      </label>
                      <select
                        value={filters.staffListProgramId || ''}
                        onChange={(e) => handleFilterChange('staffListProgramId', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                      >
                        <option value="">All Programs</option>
                        {programs.map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.code ? `${program.code} - ${program.name}` : program.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <select
                        value={filters.staffListPosition || ''}
                        onChange={(e) => handleFilterChange('staffListPosition', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                      >
                        <option value="">All Positions</option>
                        {positions.map((position) => (
                          <option key={position} value={position}>{position}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Invoice List Filters */}
                {activeTab === 'invoices' && (
                  <>
                    {renderStudentSearch(handleInvoiceStudentSelect)}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="balanceOnly"
                        checked={filters.invoiceBalanceOnly || false}
                        onChange={(e) => handleFilterChange('invoiceBalanceOnly', e.target.checked)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label htmlFor="balanceOnly" className="ml-2 block text-sm text-gray-700">
                        Show only invoices with balance
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={filters.invoiceStatus || ''}
                        onChange={(e) => handleFilterChange('invoiceStatus', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                      >
                        <option value="">All Statuses</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={filters.invoiceStartDate || ''}
                          onChange={(e) => handleFilterChange('invoiceStartDate', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                          placeholder="Start date"
                        />
                        <input
                          type="date"
                          value={filters.invoiceEndDate || ''}
                          onChange={(e) => handleFilterChange('invoiceEndDate', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                          placeholder="End date"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Payment List Filters */}
                {activeTab === 'payments' && (
                  <>
                    {renderStudentSearch(handlePaymentStudentSelect)}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={filters.paymentMethod || ''}
                        onChange={(e) => handleFilterChange('paymentMethod', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                      >
                        <option value="">All Methods</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="mobile_money">Mobile Money</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={filters.paymentStartDate || ''}
                          onChange={(e) => handleFilterChange('paymentStartDate', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                          placeholder="Start date"
                        />
                        <input
                          type="date"
                          value={filters.paymentEndDate || ''}
                          onChange={(e) => handleFilterChange('paymentEndDate', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                          placeholder="End date"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Transcript Filters */}
                {activeTab === 'transcripts' && (
                  <>
                    {renderStudentSearch(handleStudentSelect)}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program
                      </label>
                      <select
                        value={filters.transcriptProgramId || ''}
                        onChange={(e) => handleFilterChange('transcriptProgramId', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                      >
                        <option value="">All Programs</option>
                        {programs.map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.code ? `${program.code} - ${program.name}` : program.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course
                      </label>
                      <select
                        value={filters.transcriptCourseId || ''}
                        onChange={(e) => handleFilterChange('transcriptCourseId', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                      >
                        <option value="">All Courses</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.code ? `${course.code} - ${course.name}` : course.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Generate Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={generatePdf}
                  disabled={loading.generating || (activeTab === 'receipt' && !filters.paymentId)}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 ${
                    loading.generating ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
                  } transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed`}
                >
                  {loading.generating ? (
                    <>
                      <FiLoader className="animate-spin" size={16} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FiDownload size={16} />
                      Generate PDF
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}