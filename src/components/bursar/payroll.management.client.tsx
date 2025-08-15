// components/admin/admin.payroll.client.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getAllSalaries,
  getSalaryDetails,
  createSalary,
  updateSalary,
  deleteSalary,
//   getSalariesForStaff,
//   getSalariesForDepartment,
  getPayrollSummary,
  getMonthlyPayrollStats,
  filterSalaries,
  type SalaryWithStaffDetails,
  type SalaryDetails,
//   type SalaryCreateData,
//   type SalaryUpdateData,
  type SalaryFilterOptions,
  searchSalaries,
  MonthlyPayrollStat,
} from '@/lib/actions/bursar/payroll-management.actions';

import {
  FiDollarSign, FiUser, FiUsers, FiPlus, 
  FiEdit2, FiTrash2, FiLoader, FiX, FiSearch, 
  FiInfo, FiCheck, FiBarChart2
} from 'react-icons/fi';
import { ActionError } from '@/lib/utils';

export default function AdminPayrollClient() {
  const [salaries, setSalaries] = useState<SalaryWithStaffDetails[]>([]);
  const [selectedSalary, setSelectedSalary] = useState<SalaryDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    salaries: true,
    details: false,
    create: false,
    update: false,
    summary: false,
    stats: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalCancelled: 0,
    totalRecords: 0
  });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyPayrollStat[]>([]);
  console.log(monthlyStats)
  const [filterOptions, setFilterOptions] = useState<SalaryFilterOptions>({});

  const [formData, setFormData] = useState({
    staffId: 1,
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    description: '',
    status: 'pending'
  });

  // Fetch all salaries on component mount and when filters change
useEffect(() => {
  const loadSalaries = async () => {
    try {
      setLoading(prev => ({ ...prev, salaries: true }));
      setError(null);

      let salariesData;

      if (Object.keys(filterOptions).length > 0 || searchQuery.trim()) {
        if (searchQuery.trim()) {
          salariesData = await searchSalaries(searchQuery.trim());
        } else {
          salariesData = await filterSalaries(filterOptions);
        }
      } else {
        salariesData = await getAllSalaries();
      }

      setSalaries(salariesData);
    } catch (err) {
      setError(
        err instanceof ActionError ? err.message : "Failed to load salaries"
      );
    } finally {
      setLoading(prev => ({ ...prev, salaries: false }));
    }
  };

  loadSalaries();
}, [filterOptions, searchQuery]);


  // Load payroll summary
  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(prev => ({ ...prev, summary: true }));
        const summaryData = await getPayrollSummary();
        setSummary(summaryData);
      } catch (err) {
        console.error('Failed to load payroll summary', err);
      } finally {
        setLoading(prev => ({ ...prev, summary: false }));
      }
    };

    loadSummary();
  }, []);

  // Load monthly stats for current year
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(prev => ({ ...prev, stats: true }));
        const currentYear = new Date().getFullYear();
        const statsData = await getMonthlyPayrollStats(currentYear);
        setMonthlyStats(statsData);
      } catch (err) {
        console.error('Failed to load monthly stats', err);
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }
    };

    loadStats();
  }, []);

  // Load salary details when selected
  const handleSelectSalary = async (salaryId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      setError(null);
      
      const details = await getSalaryDetails(salaryId);
      setSelectedSalary(details);
      setFormData({
        staffId: details.staff.id,
        amount: details.amount,
        paymentDate: details.paymentDate,
        description: details.description || '',
        status: details.status
      });
      setIsViewModalOpen(true);
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to load salary details');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Create new salary record
  const handleCreateSalary = async () => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      const newSalary = await createSalary({
        staffId: formData.staffId,
        amount: formData.amount,
        paymentDate: formData.paymentDate,
        description: formData.description,
        status: formData.status as 'pending' | 'paid' | 'cancelled'
      });
      
      setSalaries(prev => [...prev, {
        id: newSalary.id,
        amount: Number(newSalary.amount),
        paymentDate: newSalary.paymentDate,
        description: newSalary.description,
        status: newSalary.status,
        staff: {
          id: formData.staffId,
          firstName: '', // Will be updated when selected
          lastName: '',
          email: '',
          position: '',
          department: {
            id: 0,
            name: ''
          }
        }
      }]);
      
      setIsCreateModalOpen(false);
      setFormData({
        staffId: 1,
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        description: '',
        status: 'pending'
      });
      setSuccess('Salary record created successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to create salary record');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update salary record
  const handleUpdateSalary = async () => {
  if (!selectedSalary) {
    setError("No salary selected for update.");
    return;
  }

  // Basic client-side validation before sending request
  if (!formData.amount || formData.amount <= 0) {
    setError("Amount must be greater than 0.");
    return;
  }
  if (!formData.paymentDate) {
    setError("Payment date is required.");
    return;
  }
  if (!['pending', 'paid', 'cancelled'].includes(formData.status)) {
    setError("Invalid salary status.");
    return;
  }

  try {
    setLoading(prev => ({ ...prev, update: true }));
    setError(null);

    const updateResult = await updateSalary(selectedSalary.id, {
      amount: Number(formData.amount),
      paymentDate: formData.paymentDate,
      description: formData.description?.trim() || null,
      status: formData.status as 'pending' | 'paid' | 'cancelled',
    });

    if (updateResult.success) {
      // Fetch the updated salary details to update state
      const updatedDetails = await getSalaryDetails(selectedSalary.id);

      setSalaries(prev =>
        prev.map(salary =>
          salary.id === selectedSalary.id
            ? {
                ...salary,
                amount: Number(updatedDetails.amount),
                paymentDate: updatedDetails.paymentDate,
                description: updatedDetails.description,
                status: updatedDetails.status,
              }
            : salary
        )
      );

      setSelectedSalary(prev =>
        prev && prev.id === selectedSalary.id
          ? {
              ...prev,
              amount: Number(updatedDetails.amount),
              paymentDate: updatedDetails.paymentDate,
              description: updatedDetails.description,
              status: updatedDetails.status,
            }
          : prev
      );
    }

    setIsEditModalOpen(false);
    setSuccess("Salary record updated successfully!");
  } catch (err) {
    setError(
      err instanceof ActionError
        ? err.message
        : "Failed to update salary record."
    );
  } finally {
    setLoading(prev => ({ ...prev, update: false }));
  }
};


  // Delete salary record
  const handleDeleteSalary = async () => {
    if (!selectedSalary) return;

    if (!confirm('Are you sure you want to delete this salary record?')) return;

    try {
      setError(null);
      await deleteSalary(selectedSalary.id);
      
      setSalaries(prev => prev.filter(s => s.id !== selectedSalary.id));
      setSelectedSalary(null);
      setIsViewModalOpen(false);
      setSuccess('Salary record deleted successfully!');
    } catch (err) {
      setError(err instanceof ActionError ? err.message : 'Failed to delete salary record');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 flex items-center gap-2"
        >
          <FiPlus size={16} /> New Salary Record
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Paid</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600">
                {formatCurrency(summary.totalPaid)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
              <FiDollarSign size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="mt-1 text-2xl font-semibold text-amber-600">
                {formatCurrency(summary.totalPending)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-amber-100 text-amber-600">
              <FiLoader size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Cancelled</p>
              <p className="mt-1 text-2xl font-semibold text-red-600">
                {formatCurrency(summary.totalCancelled)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <FiX size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Records</p>
              <p className="mt-1 text-2xl font-semibold text-gray-800">
                {summary.totalRecords}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gray-100 text-gray-600">
              <FiUsers size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Filter Salaries</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterOptions.status || ''}
              onChange={(e) => setFilterOptions({
                ...filterOptions,
                status: e.target.value || undefined
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filterOptions.fromDate || ''}
              onChange={(e) => setFilterOptions({
                ...filterOptions,
                fromDate: e.target.value || undefined
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filterOptions.toDate || ''}
              onChange={(e) => setFilterOptions({
                ...filterOptions,
                toDate: e.target.value || undefined
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Search and Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <div className="text-emerald-500 absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search salaries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-black pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading.salaries ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : salaries.length === 0 ? (
          <div className="p-6 text-center">
            <FiDollarSign className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No salary records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaries.map((salary) => (
                  <tr 
                    key={salary.id} 
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <FiUser className="text-emerald-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {salary.staff.firstName} {salary.staff.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {salary.staff.position}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{salary.staff.department.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(salary.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(salary.paymentDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        salary.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : salary.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {salary.status.charAt(0).toUpperCase() + salary.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleSelectSalary(salary.id)}
                        className="text-emerald-600 hover:text-emerald-900 mr-4"
                        title="View Details"
                      >
                        <FiInfo />
                      </button>
                      <button
                        onClick={() => {
                          handleSelectSalary(salary.id);
                          setIsViewModalOpen(false);
                          setIsEditModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                            onClick={async () => {
                            const fullDetails = await getSalaryDetails(salary.id);
                            setSelectedSalary(fullDetails);
                            handleDeleteSalary();
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

      {/* Monthly Stats Chart (Placeholder) */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
          <FiBarChart2 /> Monthly Payroll Overview
        </h2>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500">
          {loading.stats ? (
            <div className="flex items-center gap-2">
              <FiLoader className="animate-spin" /> Loading chart...
            </div>
          ) : (
            <p>Chart visualization would be implemented here</p>
          )}
        </div>
      </div>

      {/* Create Salary Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiPlus size={18} /> New Salary Record
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
                  Staff Member
                </label>
                <select
                  value={formData.staffId}
                  onChange={(e) => setFormData({...formData, staffId: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  <option value="1">John Doe (IT Department)</option>
                  <option value="2">Jane Smith (Mathematics)</option>
                  {/* In a real app, you would fetch and map through actual staff */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'pending' | 'paid' | 'cancelled'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
                  placeholder="Additional notes about this payment..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSalary}
                disabled={!formData.staffId || formData.amount <= 0 || !formData.paymentDate || loading.create}
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
                    Create Record
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Salary Details Modal */}
      {isViewModalOpen && selectedSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800">Salary Record Details</h2>
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
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {formatCurrency(selectedSalary.amount)}
                      </h2>
                      <span className={`mt-1 inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
                        selectedSalary.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : selectedSalary.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedSalary.status.charAt(0).toUpperCase() + selectedSalary.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Payment Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(selectedSalary.paymentDate)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Staff Member</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedSalary.staff.firstName} {selectedSalary.staff.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedSalary.staff.position}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Department</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedSalary.staff.department.name}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedSalary.staff.email}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">ID Number</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedSalary.staff.idNumber || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {selectedSalary.description && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                        {selectedSalary.description}
                      </p>
                    </div>
                  )}
                </div>
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
                Edit Record
              </button>
              <button
                onClick={handleDeleteSalary}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center gap-2"
              >
                <FiTrash2 size={16} />
                Delete Record
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

      {/* Edit Salary Modal */}
      {isEditModalOpen && selectedSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiEdit2 size={18} /> Edit Salary Record
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
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'pending' | 'paid' | 'cancelled'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
                onClick={handleUpdateSalary}
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
    </div>
  );
}