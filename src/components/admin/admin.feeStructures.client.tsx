// components/admin/admin.feeStructures.client.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAllFeeStructures,
  getFeeStructureDetails,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  searchFeeStructures,
  type FeeStructureWithDetails,
  type FeeStructureDetails,
  type FeeStructureCreateData,
} from '@/lib/actions/admin/fee-structures.actions';

// Add these imports for your new server actions
import { getAllPrograms } from '@/lib/actions/admin/programs.action';
import { getAllSemesters } from '@/lib/actions/admin/semesters.action';

// Add PDF generation import
import { generateFeeStructurePdf } from '@/lib/actions/pdf-generataion/pdf-generation.actions';

import {
  FiDollarSign, FiPlus, FiEdit2, FiTrash2, 
  FiLoader, FiX, FiSearch, FiInfo, FiCheck,
  FiDownload // Add PDF-related icons
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';

type ProgramType = FeeStructureWithDetails['program'];
type SemesterType = FeeStructureWithDetails['semester'];

export default function AdminFeeStructuresClient() {
  const [feeStructures, setFeeStructures] = useState<FeeStructureWithDetails[]>([]);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<FeeStructureDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [loading, setLoading] = useState({
    feeStructures: true,
    details: false,
    create: false,
    update: false,
    programs: false,
    semesters: false,
    generatingPdf: false // Add PDF generation loading state
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [programs, setPrograms] = useState<ProgramType[]>([]);
  const [semesters, setSemesters] = useState<SemesterType[]>([]);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0
  });

  const [formData, setFormData] = useState<FeeStructureCreateData>({
    programId: 0,
    semesterId: 0,
    totalAmount: 0,
    description: ''
  });

  // --- Fetch Programs using server action ---
  const fetchPrograms = async () => {
    try {
      setLoading(prev => ({ ...prev, programs: true }));
      const programsData = await getAllPrograms();
      setPrograms(programsData);

      // Set default programId if not set
      if (programsData.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          programId: prev.programId === 0 ? programsData[0].id : prev.programId 
        }));
      }
    } catch (err) {
      console.error('Failed to load programs:', err);
      setError('Failed to load programs');
    } finally {
      setLoading(prev => ({ ...prev, programs: false }));
    }
  };

  // --- Fetch Semesters using server action ---
  const fetchSemesters = async () => {
    try {
      setLoading(prev => ({ ...prev, semesters: true }));
      const semestersData = await getAllSemesters();
      setSemesters(semestersData);

      // Set default semesterId if not set
      if (semestersData.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          semesterId: prev.semesterId === 0 ? semestersData[0].id : prev.semesterId 
        }));
      }
    } catch (err) {
      console.error('Failed to load semesters:', err);
      setError('Failed to load semesters');
    } finally {
      setLoading(prev => ({ ...prev, semesters: false }));
    }
  };

  // Fetch all fee structures on component mount and when search changes
  const loadFeeStructures = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, feeStructures: true }));
      setError(null);

      const data = await getAllFeeStructures();
      setFeeStructures(data);
      setPagination(prev => ({ ...prev, totalItems: data.length }));
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load fee structures');
    } finally {
      setLoading(prev => ({ ...prev, feeStructures: false }));
    }
  }, []);

  // --- Initial data load ---
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchPrograms(),
        fetchSemesters(),
        loadFeeStructures()
      ]);
    };
    loadInitialData();
  }, [loadFeeStructures]);

  // --- Search fee structures ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      loadFeeStructures();
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(prev => ({ ...prev, feeStructures: true }));
        setError(null);

        const results = await searchFeeStructures(searchQuery);
        setFeeStructures(results);
        setPagination(prev => ({ ...prev, totalItems: results.length }));
      } catch (err) {
        setError(err instanceof ActionError ? err.message : 'Search failed');
      } finally {
        setLoading(prev => ({ ...prev, feeStructures: false }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, loadFeeStructures]);

  // --- Select fee structure ---
  const handleSelectFeeStructure = async (feeStructureId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      setError(null);

      const details = await getFeeStructureDetails(feeStructureId);
      setSelectedFeeStructure(details);

      setFormData({
        programId: details.program.id,
        semesterId: details.semester.id,
        totalAmount: details.totalAmount,
        description: details.description || ''
      });

      setIsViewModalOpen(true);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load fee structure details');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // --- Create new fee structure ---
  const handleCreateFeeStructure = async () => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      // Create fee structure via action
      const newFeeStructure = await createFeeStructure(formData);

      // Fetch program and semester names for display
      const program = programs.find(p => p.id === formData.programId);
      const semester = semesters.find(s => s.id === formData.semesterId);

      // Optimistically update UI
      setFeeStructures(prev => [
        ...prev,
        {
          id: newFeeStructure.id,
          totalAmount: Number(newFeeStructure.totalAmount),
          description: newFeeStructure.description,
          program: {
            id: formData.programId,
            name: program?.name || '',
            code: program?.code || ''
          },
          semester: {
            id: formData.semesterId,
            name: semester?.name || ''
          },
          createdAt: new Date(newFeeStructure.createdAt),
          updatedAt: new Date(newFeeStructure.updatedAt)
        }
      ]);

      // Reset form & close modal
      setFormData({
        programId: programs[0]?.id ?? 0,
        semesterId: semesters[0]?.id ?? 0,
        totalAmount: 0,
        description: ''
      });
      setIsCreateModalOpen(false);
      setSuccess('Fee structure created successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to create fee structure');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // --- Update existing fee structure ---
  const handleUpdateFeeStructure = async () => {
    if (!selectedFeeStructure) return;

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);

      // Update via action
      const updatedFeeStructure = await updateFeeStructure(selectedFeeStructure.id, {
        programId: formData.programId,
        semesterId: formData.semesterId,
        totalAmount: formData.totalAmount,
        description: formData.description
      });

      const updatedProgram = programs.find(p => p.id === updatedFeeStructure.programId);
      const updatedSemester = semesters.find(s => s.id === updatedFeeStructure.semesterId);

      // Update UI
      setFeeStructures(prev =>
        prev.map(fs =>
          fs.id === selectedFeeStructure.id
            ? {
                ...fs,
                totalAmount: Number(updatedFeeStructure.totalAmount),
                description: updatedFeeStructure.description,
                program: {
                  id: updatedProgram?.id || fs.program.id,
                  name: updatedProgram?.name || fs.program.name,
                  code: updatedProgram?.code || fs.program.code
                },
                semester: {
                  id: updatedSemester?.id || fs.semester.id,
                  name: updatedSemester?.name || fs.semester.name
                },
                updatedAt: new Date(updatedFeeStructure.updatedAt)
              }
            : fs
        )
      );

      // Update selectedFeeStructure state
      setSelectedFeeStructure(prev =>
        prev
          ? {
              ...prev,
              totalAmount: Number(updatedFeeStructure.totalAmount),
              description: updatedFeeStructure.description,
              program: {
                id: updatedProgram?.id || prev.program.id,
                name: updatedProgram?.name || prev.program.name,
                code: updatedProgram?.code || prev.program.code
              },
              semester: {
                id: updatedSemester?.id || prev.semester.id,
                name: updatedSemester?.name || prev.semester.name,
                startDate: prev.semester.startDate,
                endDate: prev.semester.endDate
              },
              updatedAt: new Date(updatedFeeStructure.updatedAt)
            }
          : null
      );

      setIsEditModalOpen(false);
      setSuccess('Fee structure updated successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to update fee structure');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Delete a fee structure
// Delete a fee structure by ID
const handleDeleteFeeStructure = async (feeStructureId?: number) => {
  const idToDelete = feeStructureId || selectedFeeStructure?.id;
  
  if (!idToDelete) return;
  
  if (!confirm('Are you sure you want to delete this fee structure?')) return;

  try {
    setError(null);
    await deleteFeeStructure(idToDelete);
    
    setFeeStructures(prev => prev.filter(fs => fs.id !== idToDelete));
    
    // Only clear selectedFeeStructure if it's the one being deleted
    if (selectedFeeStructure?.id === idToDelete) {
      setSelectedFeeStructure(null);
    }
    
    // Only close modal if it's open for the deleted structure
    if (isViewModalOpen && selectedFeeStructure?.id === idToDelete) {
      setIsViewModalOpen(false);
    }
    
    setSuccess('Fee structure deleted successfully!');
  } catch (err) {
    setError(err instanceof ActionError ? err.message : 'Failed to delete fee structure');
  }
};

  // Generate PDF for a fee structure
  const handleGeneratePdf = async (feeStructureId: number) => {
    try {
      setLoading(prev => ({ ...prev, generatingPdf: true }));
      setError(null);
      setSuccess(null);

      const pdfBuffer = await generateFeeStructurePdf(feeStructureId);
      
      // Create a blob and download the PDF
      const uint8Array = new Uint8Array(pdfBuffer);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get the fee structure for filename
      const feeStructure = feeStructures.find(fs => fs.id === feeStructureId);
      const programCode = feeStructure?.program.code || 'fee-structure';
      const semesterName = feeStructure?.semester.name || '';
      
      a.download = `${programCode}-${semesterName}-fee-structure.pdf`.replace(/\s+/g, '-').toLowerCase();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Fee structure PDF generated successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to generate PDF');
    } finally {
      setLoading(prev => ({ ...prev, generatingPdf: false }));
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  // Get paginated data
  const paginatedFeeStructures = feeStructures.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Fee Structure Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 flex items-center gap-2"
        >
          <FiPlus size={16} /> New Fee Structure
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
              <div className="text-emerald-500 absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search fee structures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-black pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {loading.feeStructures ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ) : feeStructures.length === 0 ? (
            <div className="p-6 text-center">
              <FiDollarSign className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No fee structures found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semester
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedFeeStructures.map((feeStructure) => (
                    <tr 
                      key={feeStructure.id} 
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <FiDollarSign className="text-emerald-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {feeStructure.program.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {feeStructure.program.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{feeStructure.semester.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(feeStructure.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(feeStructure.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleSelectFeeStructure(feeStructure.id)}
                          className="text-emerald-600 hover:text-emerald-900 mr-4"
                          title="View Details"
                        >
                          <FiInfo />
                        </button>
                        <button
                          onClick={() => handleGeneratePdf(feeStructure.id)}
                          disabled={loading.generatingPdf}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Download PDF"
                        >
                          {loading.generatingPdf ? <FiLoader className="animate-spin" /> : <FiDownload />}
                        </button>
                        <button
                          onClick={() => {
                            handleSelectFeeStructure(feeStructure.id);
                            setIsViewModalOpen(false);
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
<button
  onClick={() => handleDeleteFeeStructure(feeStructure.id)}
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

              {feeStructures.length > 0 && (
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of{' '}
                    {pagination.totalItems} entries
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({...prev, page: Math.max(1, prev.page - 1)}))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({...prev, page: prev.page + 1}))}
                      disabled={pagination.page * pagination.pageSize >= pagination.totalItems}
                      className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Fee Structure Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> Create New Fee Structure
              </h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program
                </label>
                <select
                  value={formData.programId}
                  onChange={(e) => setFormData({...formData, programId: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name} ({program.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <select
                  value={formData.semesterId}
                  onChange={(e) => setFormData({...formData, semesterId: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  {semesters.map(semester => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount
                </label>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="Fee structure description..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t text-black">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium  bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
<button
  onClick={handleCreateFeeStructure}
  disabled={!formData.programId || !formData.semesterId || formData.totalAmount <= 0 || loading.create}
  className={`px-4 py-2 text-sm font-medium border border-white rounded-md flex items-center gap-2 ${
    loading.create ? 'bg-emerald-400' : 'bg-emerald-500 hover:bg-emerald-600'
  } text-white transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed`}
>
  {loading.create ? (
    <>
      <FiLoader className="animate-spin" size={16} />
      Creating...
    </>
  ) : (
    <>
      <FiPlus size={16} />
      Create Fee Structure
    </>
  )}
</button>
            </div>
          </div>
        </div>
      )}

      {/* View Fee Structure Details Modal */}
      {isViewModalOpen && selectedFeeStructure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800">Fee Structure Details</h2>
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
                  <FiDollarSign className="text-emerald-600 text-2xl" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedFeeStructure.program.name} ({selectedFeeStructure.program.code})
                  </h2>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Semester</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedFeeStructure.semester.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {selectedFeeStructure.semester.startDate} to {selectedFeeStructure.semester.endDate}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {formatCurrency(selectedFeeStructure.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedFeeStructure.createdAt)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedFeeStructure.updatedAt)}
                      </p>
                    </div>
                  </div>
                  
                  {selectedFeeStructure.description && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedFeeStructure.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => handleGeneratePdf(selectedFeeStructure.id)}
                disabled={loading.generatingPdf}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
              >
                {loading.generatingPdf ? (
                  <FiLoader className="animate-spin" size={16} />
                ) : (
                  <FiDownload size={16} />
                )}
                Download PDF
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
              >
                <FiEdit2 size={16} />
                Edit Fee Structure
              </button>
<button
  onClick={() => handleDeleteFeeStructure()}
  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center gap-2"
>
  <FiTrash2 size={16} />
  Delete Fee Structure
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

      {/* Edit Fee Structure Modal */}
      {isEditModalOpen && selectedFeeStructure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiEdit2 size={18} /> Edit Fee Structure
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program
                </label>
                <select
                  value={formData.programId}
                  onChange={(e) => setFormData({...formData, programId: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name} ({program.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <select
                  value={formData.semesterId}
                  onChange={(e) => setFormData({...formData, semesterId: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  {semesters.map(semester => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount
                </label>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFeeStructure}
                disabled={loading.update}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 KSH{
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