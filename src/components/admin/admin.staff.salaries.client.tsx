// components/admin/admin.staff-salaries.client.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getAllStaffSalaries,
  getSalaryById,
  createStaffSalary,
  updateStaffSalary,
  deleteStaffSalary,
  getSalarySummary,
  getRecentSalaries,
  type StaffSalaryWithDetails,
  type StaffSalaryData,
  type SalarySummary
} from '@/lib/actions/admin/staff.salaries.actions';
import { getAllStaff } from '@/lib/actions/admin/staff.actions'; // Add this import

import {
  FiDollarSign, FiUser, FiPlus, FiEdit2, 
  FiTrash2, FiLoader, FiX, FiSearch, 
  FiInfo, FiCheck, FiCalendar,
  FiCreditCard, FiPieChart
} from 'react-icons/fi';
import { format } from 'date-fns';

interface StaffMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department?: {
    id: number;
    name: string;
  };
}

export default function AdminStaffSalariesClient() {
  const [salaries, setSalaries] = useState<StaffSalaryWithDetails[]>([]);
  const [recentSalaries, setRecentSalaries] = useState<StaffSalaryWithDetails[]>([]);
  const [summary, setSummary] = useState<SalarySummary>({
    totalSalaries: 0,
    totalPaid: 0,
    statusDistribution: []
  });
  const [selectedSalary, setSelectedSalary] = useState<StaffSalaryWithDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    salaries: true,
    recent: true,
    summary: true,
    details: false,
    create: false,
    update: false,
    staff: false // Add staff loading state
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all');

  // Add state for staff data and combobox
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const staffDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<StaffSalaryData>>({
    staffId: 0,
    amount: '',
    paymentDate: '',
    description: '',
    status: 'pending'
  });

  // Fetch initial data including staff
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(prev => ({ ...prev, salaries: true, recent: true, summary: true, staff: true }));
        setError(null);
        
        const [salariesData, recentData, summaryData, staffData] = await Promise.all([
          getAllStaffSalaries(),
          getRecentSalaries(),
          getSalarySummary(),
          getAllStaff() // Fetch staff data
        ]);
        
        setSalaries(salariesData);
        setRecentSalaries(recentData);
        setSummary(summaryData);
        setStaff(staffData);
        setFilteredStaff(staffData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(prev => ({ 
          ...prev, 
          salaries: false, 
          recent: false,
          summary: false,
          staff: false
        }));
      }
    };

    loadData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target as Node)) {
        setShowStaffDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isCreateModalOpen) {
      setStaffSearch('');
      setSelectedStaffName('');
      setFormData({
        staffId: 0,
        amount: '',
        paymentDate: '',
        description: '',
        status: 'pending'
      });
    }
  }, [isCreateModalOpen]);

  // Filter staff based on search
  useEffect(() => {
    if (!staffSearch.trim()) {
      setFilteredStaff(staff);
      return;
    }

    const filtered = staff.filter(staffMember => 
      staffMember.firstName.toLowerCase().includes(staffSearch.toLowerCase()) ||
      staffMember.lastName.toLowerCase().includes(staffSearch.toLowerCase()) ||
      staffMember.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
      staffMember.department?.name.toLowerCase().includes(staffSearch.toLowerCase())
    );
    setFilteredStaff(filtered);
  }, [staffSearch, staff]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      try {
        setLoading(prev => ({ ...prev, salaries: true }));
        const allSalaries = await getAllStaffSalaries();
        const filtered = allSalaries.filter(salary => 
          salary.staff.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          salary.staff.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          salary.staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          salary.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
          salary.staff.department.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSalaries(filtered);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(prev => ({ ...prev, salaries: false }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load salary details when selected
  const handleSelectSalary = async (salaryId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      setError(null);
      
      const details = await getSalaryById(salaryId);
      if (details) {
        setSelectedSalary(details);
        setFormData({
          staffId: details.staff.id,
          amount: details.amount,
          paymentDate: format(new Date(details.paymentDate), 'yyyy-MM-dd'),
          description: details.description || '',
          status: details.status
        });
        setIsViewModalOpen(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load salary details');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Create new salary
  const handleCreateSalary = async () => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      setError(null);

      if (!formData.staffId || !formData.amount || !formData.paymentDate || !formData.status) {
        throw new Error('Missing required fields');
      }

      const newSalary = await createStaffSalary({
        staffId: formData.staffId,
        amount: formData.amount,
        paymentDate: formData.paymentDate,
        description: formData.description || null,
        status: formData.status
      });
      
      setSalaries(prev => [...prev, {
        ...newSalary,
        id: newSalary.id,
        amount: formData.amount!,
        paymentDate: new Date(formData.paymentDate!),
        description: formData.description || null,
        status: formData.status!,
        staff: {
          id: formData.staffId!,
          firstName: staff.find(s => s.id === formData.staffId)?.firstName || '',
          lastName: staff.find(s => s.id === formData.staffId)?.lastName || '',
          email: staff.find(s => s.id === formData.staffId)?.email || '',
          department: {
            id: staff.find(s => s.id === formData.staffId)?.department?.id || 0,
            name: staff.find(s => s.id === formData.staffId)?.department?.name || ''
          }
        }
      }]);
      
      // Refresh recent salaries and summary
      const [recentData, summaryData] = await Promise.all([
        getRecentSalaries(),
        getSalarySummary()
      ]);
      setRecentSalaries(recentData);
      setSummary(summaryData);
      
      setIsCreateModalOpen(false);
      setFormData({
        staffId: 0,
        amount: '',
        paymentDate: '',
        description: '',
        status: 'pending'
      });
      setStaffSearch('');
      setSelectedStaffName('');
      setSuccess('Salary record created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create salary record');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Update salary
  const handleUpdateSalary = async () => {
    if (!selectedSalary) return;

    try {
      setLoading(prev => ({ ...prev, update: true }));
      setError(null);

      const updatedSalary = await updateStaffSalary(selectedSalary.id, {
        staffId: formData.staffId || selectedSalary.staff.id,
        amount: formData.amount || selectedSalary.amount,
        paymentDate: formData.paymentDate || format(selectedSalary.paymentDate, 'yyyy-MM-dd'),
        description: formData.description || selectedSalary.description || null,
        status: formData.status || selectedSalary.status
      });
      
      setSalaries(prev => prev.map(salary => 
        salary.id === selectedSalary.id 
          ? { 
              ...salary, 
              ...updatedSalary,
              amount: updatedSalary.amount,
              paymentDate: new Date(updatedSalary.paymentDate),
              description: updatedSalary.description,
              status: updatedSalary.status
            } 
          : salary
      ));
      
      // Update recent salaries if this one is in them
      setRecentSalaries(prev => 
        prev.map(salary => 
          salary.id === selectedSalary.id 
            ? { 
                ...salary, 
                ...updatedSalary,
                amount: updatedSalary.amount,
                paymentDate: new Date(updatedSalary.paymentDate),
                description: updatedSalary.description,
                status: updatedSalary.status
              } 
            : salary
        )
      );
      
      // Refresh summary
      const summaryData = await getSalarySummary();
      setSummary(summaryData);
      
      setSelectedSalary(prev => prev ? { 
        ...prev, 
        ...updatedSalary,
        amount: updatedSalary.amount,
        paymentDate: new Date(updatedSalary.paymentDate),
        description: updatedSalary.description,
        status: updatedSalary.status
      } : null);
      
      setIsEditModalOpen(false);
      setSuccess('Salary record updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update salary record');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  // Delete salary
  const handleDeleteSalary = async () => {
    if (!selectedSalary) return;

    if (!confirm('Are you sure you want to delete this salary record? This action cannot be undone.')) return;

    try {
      setError(null);
      await deleteStaffSalary(selectedSalary.id);
      
      setSalaries(prev => prev.filter(s => s.id !== selectedSalary.id));
      setRecentSalaries(prev => prev.filter(s => s.id !== selectedSalary.id));
      setSelectedSalary(null);
      setIsViewModalOpen(false);
      
      // Refresh summary
      const summaryData = await getSalarySummary();
      setSummary(summaryData);
      
      setSuccess('Salary record deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete salary record');
    }
  };

  // Format currency
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(parseFloat(amount));
  };

  // Format date
  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const statusClasses = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Staff Salaries</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 flex items-center gap-2"
          >
            <FiPlus size={16} /> New Salary
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Salaries</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {summary.totalSalaries}
              </p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
              <FiDollarSign size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Paid</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {formatCurrency(summary.totalPaid.toString())}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FiCreditCard size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Status Distribution</p>
              <p className="mt-1 text-sm text-gray-900">
                {summary.statusDistribution.map(s => `${s.status}: ${s.count}`).join(', ')}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FiPieChart size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'all' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            All Salaries
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'recent' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Recent Payments
          </button>
        </nav>
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
              placeholder={`Search ${activeTab === 'all' ? 'salaries' : 'recent payments'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-black pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading.salaries || loading.recent ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : activeTab === 'all' && salaries.length === 0 ? (
          <div className="p-6 text-center">
            <FiDollarSign className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No salary records found</p>
          </div>
        ) : activeTab === 'recent' && recentSalaries.length === 0 ? (
          <div className="p-6 text-center">
            <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No recent payments</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
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
                {(activeTab === 'all' ? salaries : recentSalaries).map((salary) => (
                  <tr key={salary.id} className="hover:bg-gray-50">
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
                            {salary.staff.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {salary.staff.department.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(salary.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(salary.paymentDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={salary.status} />
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
                        onClick={() => {
                          setSelectedSalary(salary);
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

      {/* Create Salary Modal - Updated with Staff Combobox */}
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
              {/* Staff Search and Select Combobox */}
              <div className="relative" ref={staffDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Member *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={selectedStaffName || "Search staff members..."}
                    value={staffSearch}
                    onChange={(e) => {
                      setStaffSearch(e.target.value);
                      setShowStaffDropdown(true);
                    }}
                    onFocus={() => setShowStaffDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                  {selectedStaffName && (
                    <button
                      type="button"
                      onClick={() => {
                        setStaffSearch('');
                        setSelectedStaffName('');
                        setFormData(prev => ({ ...prev, staffId: 0 }));
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
                
                {/* Staff Dropdown */}
                {showStaffDropdown && filteredStaff.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredStaff.map(staffMember => (
                      <div
                        key={staffMember.id}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, staffId: staffMember.id }));
                          setSelectedStaffName(`${staffMember.firstName} ${staffMember.lastName}`);
                          setStaffSearch('');
                          setShowStaffDropdown(false);
                        }}
                      >
                        <div className="font-medium">{staffMember.firstName} {staffMember.lastName}</div>
                        <div className="text-gray-500 text-xs">
                          {staffMember.email} • {staffMember.department?.name || 'No Department'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show selected staff */}
                {selectedStaffName && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-md">
                    <div className="text-sm font-medium text-emerald-800">Selected:</div>
                    <div className="text-sm text-emerald-600">{selectedStaffName}</div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="text"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="1000.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={formData.paymentDate || ''}
                  onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="Monthly salary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status || 'pending'}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
                disabled={!formData.staffId || !formData.amount || !formData.paymentDate || loading.create}
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
              <h2 className="text-xl font-bold text-gray-800">Salary Details</h2>
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
                    Salary Record #{selectedSalary.id}
                  </h2>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Staff Member</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedSalary.staff.firstName} {selectedSalary.staff.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedSalary.staff.email}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Department</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedSalary.staff.department.name}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(selectedSalary.amount)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <p className="mt-1">
                        <StatusBadge status={selectedSalary.status} />
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Payment Date</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedSalary.paymentDate)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedSalary.description || 'N/A'}
                      </p>
                    </div>
                  </div>
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
                  Staff ID
                </label>
                <input
                  type="number"
                  value={formData.staffId || ''}
                  onChange={(e) => setFormData({...formData, staffId: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="text"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={formData.paymentDate || ''}
                  onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status || 'pending'}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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