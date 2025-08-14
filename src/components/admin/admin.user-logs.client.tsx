// components/admin/admin.user-logs.client.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getAllUserLogs,
  getUserLogById,
//   createUserLog,
  getLogsSummary,
  type UserLogWithDetails,
//   type UserLogData,
  type UserLogsFilter,
  type LogsSummary
} from '@/lib/actions/admin/user.logs.actions';

import {
  FiActivity, FiUser,
  FiFilter, FiX, FiInfo, FiClock,
   FiPieChart,
  FiCheck
} from 'react-icons/fi';
import { format } from 'date-fns';

export default function AdminUserLogsClient() {
  const [logs, setLogs] = useState<UserLogWithDetails[]>([]);
  const [summary, setSummary] = useState<LogsSummary>({
    totalLogs: 0,
    actionsDistribution: [],
    recentActivity: []
  });
  const [selectedLog, setSelectedLog] = useState<UserLogWithDetails | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    logs: true,
    summary: true,
    details: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserLogsFilter>({});

  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy HH:mm:ss');
  };

  // Format duration
  const formatDuration = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Action badge
  const ActionBadge = ({ action }: { action: string }) => {
    const actionClasses = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      login: 'bg-purple-100 text-purple-800',
      logout: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${actionClasses[action as keyof typeof actionClasses] || 'bg-yellow-100 text-yellow-800'}`}>
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </span>
    );
  };

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(prev => ({ ...prev, logs: true, summary: true }));
        setError(null);
        
        const [logsData, summaryData] = await Promise.all([
          getAllUserLogs(filters),
          getLogsSummary()
        ]);
        
        setLogs(logsData);
        setSummary(summaryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(prev => ({ 
          ...prev, 
          logs: false, 
          summary: false 
        }));
      }
    };

    loadData();
  }, [filters]);

  // Load log details when selected
  const handleSelectLog = async (logId: number) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      setError(null);
      
      const details = await getUserLogById(logId);
      if (details) {
        setSelectedLog(details);
        setIsViewModalOpen(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load log details');
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Apply filters
  const handleApplyFilters = (newFilters: UserLogsFilter) => {
    setFilters(newFilters);
    setIsFilterModalOpen(false);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({});
    setIsFilterModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">User Activity Logs</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <FiFilter size={16} /> Filters
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
              <p className="text-sm font-medium text-gray-500">Total Logs</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {summary.totalLogs}
              </p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
              <FiActivity size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Actions Distribution</p>
              <p className="mt-1 text-sm text-gray-900">
                {summary.actionsDistribution.map(a => `${a.action}: ${a.count}`).join(', ')}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FiPieChart size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Recent Activity</p>
              <p className="mt-1 text-sm text-gray-900">
                {summary.recentActivity.length > 0 ? 
                  `${summary.recentActivity[0].action} by ${summary.recentActivity[0].user.email}` : 
                  'No recent activity'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FiClock size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading.logs ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center">
            <FiActivity className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">No logs found</p>
            {Object.keys(filters).length > 0 && (
              <button
                onClick={handleClearFilters}
                className="mt-4 text-sm text-emerald-600 hover:text-emerald-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <FiUser className="text-emerald-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {log.user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {log.user.role.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.targetTable || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.targetId ? `ID: ${log.targetId}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(log.timestamp)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDuration(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleSelectLog(log.id)}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="View Details"
                      >
                        <FiInfo />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiFilter size={18} /> Filter Logs
              </h2>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
                <input
                  type="text"
                  value={filters.action || ''}
                  onChange={(e) => setFilters({...filters, action: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="create, update, delete, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Table
                </label>
                <input
                  type="text"
                  value={filters.targetTable || ''}
                  onChange={(e) => setFilters({...filters, targetTable: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="users, students, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Query
                </label>
                <input
                  type="text"
                  value={filters.searchQuery || ''}
                  onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  placeholder="Search in actions, descriptions, emails"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Clear Filters
              </button>
              <button
                onClick={() => handleApplyFilters(filters)}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Log Details Modal */}
      {isViewModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-xl font-bold text-gray-800">Log Details</h2>
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
                  <FiActivity className="text-emerald-600 text-2xl" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800">
                    Log #{selectedLog.id}
                  </h2>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Action</h3>
                      <p className="mt-1">
                        <ActionBadge action={selectedLog.action} />
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedLog.timestamp)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDuration(selectedLog.timestamp)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">User</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedLog.user.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedLog.user.role.name}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Target</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedLog.targetTable || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedLog.targetId ? `ID: ${selectedLog.targetId}` : ''}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedLog.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t">
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
    </div>
  );
}