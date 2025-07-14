// components/userLogs/userLog-client-component.tsx
'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck } from "react-icons/fi";
import { createUserLog, updateUserLog, deleteUserLog, getUserLogs } from "@/lib/actions/userLog.action";

// Define the interface for a UserLog based on your Drizzle schema
interface UserLog {
  id: number;
  userId: number;
  action: string;
  targetTable: string | null;
  targetId: number | null;
  timestamp: string; // Date object from DB, converted to ISO string for client
  description: string | null;
}

// Define the interface for reference data
interface ReferenceData {
  users: { id: number; firstName: string; lastName: string; email: string }[];
}

interface UserLogsClientComponentProps {
  initialUserLogs: UserLog[];
  referenceData: ReferenceData;
}

export default function UserLogsClientComponent({ initialUserLogs, referenceData }: UserLogsClientComponentProps) {
  const [userLogs, setUserLogs] = useState<UserLog[]>(initialUserLogs);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("userId"); // Default filter
  const [selectedUserLogId, setSelectedUserLogId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editedUserLog, setEditedUserLog] = useState<Partial<UserLog>>({});
  const [showDetails, setShowDetails] = useState<UserLog | null>(null);
  const [showAddUserLog, setShowAddUserLog] = useState(false);
  const [newUserLog, setNewUserLog] = useState({
    userId: "",
    action: "",
    targetTable: "",
    targetId: "",
    timestamp: "", // Datetime-local input will be string
    description: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Helper to get user display name
  const getUserDisplayName = (userId: number) => {
    const user = referenceData.users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName} (${user.email})` : `User ID: ${userId}`;
  };

  // Filter user logs based on search and filterBy criteria
  const filteredUserLogs = userLogs.filter((userLog: UserLog) => {
    let value = '';
    if (filterBy === 'userId') {
      value = getUserDisplayName(userLog.userId).toLowerCase();
    } else {
      value = (userLog as any)[filterBy]?.toString().toLowerCase() || '';
    }
    return value.includes(search.toLowerCase());
  });

  // Handle edit button click
  const handleEdit = (userLog: UserLog) => {
    setEditId(userLog.id);
    setEditedUserLog({
      ...userLog,
      action: userLog.action || '',
      targetTable: userLog.targetTable || '',
      targetId: userLog.targetId, // Assign directly as number | null
      description: userLog.description || '',
      // Ensure timestamp is formatted for datetime-local input
      timestamp: userLog.timestamp ? new Date(userLog.timestamp).toISOString().slice(0, 16) : '',
    });
    setFormError(null);
    setFormSuccess(null);
  };

  // Handle save (update) action
  const handleSave = async (id: number, formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await updateUserLog(id, formData);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to update user log.") : null);
        return;
      }
      setFormSuccess('User log updated successfully!');
      setEditId(null);
      // Re-fetch all user logs to ensure the local state is fully synchronized
      const updatedUserLogs = await getUserLogs();
      setUserLogs(updatedUserLogs.map(log => ({
        ...log,
        timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
      })));
    } catch (error: any) {
      setFormError(error.message || "Failed to update user log.");
    }
  };

  // Handle add new user log action
  const handleAddUserLog = async (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createUserLog(formData);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to create user log.") : null);
        return;
      }
      setFormSuccess('User log created successfully!');
      setShowAddUserLog(false);
      setNewUserLog({ // Reset form fields
        userId: "", action: "", targetTable: "", targetId: "", timestamp: "", description: ""
      });
      // Re-fetch all user logs to ensure the local state is fully synchronized
      const updatedUserLogs = await getUserLogs();
      setUserLogs(updatedUserLogs.map(log => ({
        ...log,
        timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
      })));
    } catch (error: any) {
      setFormError(error.message || "Failed to create user log.");
    }
  };

  // Handle delete user log action
  const handleDeleteUserLog = async (userLogId: number) => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm("Are you sure you want to delete this user log? This action cannot be undone.")) return;
    try {
      const result = await deleteUserLog(userLogId);
      if ('error' in result) {
        setFormError(result.error ? String("Failed to delete user log.") : null);
        return;
      }
      setFormSuccess('User log deleted successfully!');
      setUserLogs(userLogs.filter((userLog) => userLog.id !== userLogId));
    } catch (error: any) {
      setFormError(error.message || "Failed to delete user log.");
    }
  };

  return (
    <>
      {/* Search and filter bar */}
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search user logs..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option className="bg-emerald-800" value="userId">User</option>
            <option className="bg-emerald-800" value="action">Action</option>
            <option className="bg-emerald-800" value="targetTable">Target Table</option>
            <option className="bg-emerald-800" value="id">ID</option>
          </select>
        </div>
        <button
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddUserLog(true)}
        >
          <FiPlus /> Add User Log
        </button>
      </div>

      {/* Status messages */}
      {formError && (
        <div className="mx-8 mt-4 p-3 bg-red-500/90 text-white rounded-lg shadow flex items-center gap-2">
          <FiX className="flex-shrink-0" />
          {formError}
        </div>
      )}
      {formSuccess && (
        <div className="mx-8 mt-4 p-3 bg-green-500/90 text-white rounded-lg shadow flex items-center gap-2">
          <FiCheck className="flex-shrink-0" />
          {formSuccess}
        </div>
      )}

      {/* Table section */}
      <div className="px-12 py-6 h-[calc(100vh-250px)] overflow-hidden">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col border border-white/20">
          <div className="overflow-x-auto h-full">
            <div className="h-full">
              <div className="overflow-y-auto max-h-full">
                <table className="min-w-full table-fixed text-gray-800">
                  <thead className="sticky top-0 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white z-10">
                    <tr>
                      <th className="p-4 text-left w-20">ID</th>
                      <th className="p-4 text-left">User</th>
                      <th className="p-4 text-left">Action</th>
                      <th className="p-4 text-left">Target Table</th>
                      <th className="p-4 text-left">Target ID</th>
                      <th className="p-4 text-left">Timestamp</th>
                      <th className="p-4 text-left">Description</th>
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredUserLogs.map((userLog: UserLog) => (
                      <tr key={userLog.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-800">{userLog.id}</td>
                        <td className="p-4">
                          {editId === userLog.id ? (
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedUserLog.userId !== undefined ? String(editedUserLog.userId) : ''}
                              onChange={(e) => setEditedUserLog({ ...editedUserLog, userId: Number(e.target.value) })}
                            >
                              <option className="bg-emerald-800 text-white" value="">Select User</option>
                              {referenceData.users.map((user) => (
                                <option className="bg-emerald-800 text-white" key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName} ({user.email})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-800">{getUserDisplayName(userLog.userId)}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === userLog.id ? (
                            <input
                              type="text"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedUserLog.action || ''}
                              onChange={(e) => setEditedUserLog({ ...editedUserLog, action: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{userLog.action}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === userLog.id ? (
                            <input
                              type="text"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedUserLog.targetTable || ''}
                              onChange={(e) => setEditedUserLog({ ...editedUserLog, targetTable: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{userLog.targetTable || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === userLog.id ? (
                            <input
                              type="number"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedUserLog.targetId !== null ? editedUserLog.targetId : ''}
                              onChange={(e) => setEditedUserLog({ ...editedUserLog, targetId: Number(e.target.value) || null })}
                            />
                          ) : (
                            <span className="text-gray-800">{userLog.targetId || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === userLog.id ? (
                            <input
                              type="datetime-local"
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={(editedUserLog.timestamp || '').slice(0, 16)} // Format for datetime-local
                              onChange={(e) => setEditedUserLog({ ...editedUserLog, timestamp: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-800">{new Date(userLog.timestamp).toLocaleString()}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editId === userLog.id ? (
                            <textarea
                              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                              value={editedUserLog.description || ''}
                              onChange={(e) => setEditedUserLog({ ...editedUserLog, description: e.target.value })}
                              rows={2}
                            />
                          ) : (
                            <span className="text-gray-800">{userLog.description || 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-4 flex gap-3 items-center">
                          {editId === userLog.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  const formData = new FormData();
                                  if (editedUserLog.userId !== undefined) formData.append('userId', String(editedUserLog.userId));
                                  if (editedUserLog.action) formData.append('action', editedUserLog.action);
                                  if (editedUserLog.targetTable) formData.append('targetTable', editedUserLog.targetTable);
                                  if (editedUserLog.targetId !== undefined && editedUserLog.targetId !== null) formData.append('targetId', String(editedUserLog.targetId));
                                  if (editedUserLog.timestamp) formData.append('timestamp', editedUserLog.timestamp);
                                  if (editedUserLog.description) formData.append('description', editedUserLog.description);
                                  handleSave(userLog.id, formData);
                                }}
                              >
                                <FiSave /> Save
                              </button>
                              <button
                                className="text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-300 text-sm transition-colors"
                                onClick={() => setEditId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                onClick={() => handleEdit(userLog)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeleteUserLog(userLog.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
                                onClick={() => setShowDetails(userLog)}
                                title="View"
                              >
                                <FiEye />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Log Modal */}
      {showAddUserLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New User Log</h2>
              <button
                onClick={() => setShowAddUserLog(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form action={handleAddUserLog}>
              <div className="grid grid-cols-1 gap-6 p-6">
                <div>
                  <label htmlFor="logUserId" className="block mb-2 text-sm font-medium text-gray-700">User</label>
                  <select
                    id="logUserId"
                    name="userId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newUserLog.userId}
                    onChange={(e) => setNewUserLog({ ...newUserLog, userId: e.target.value })}
                    required
                  >
                    <option className="bg-emerald-800 text-white" value="">Select User</option>
                    {referenceData.users.map((user) => (
                      <option className="bg-emerald-800 text-white" key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="action" className="block mb-2 text-sm font-medium text-gray-700">Action</label>
                  <input
                    type="text"
                    id="action"
                    name="action"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newUserLog.action}
                    onChange={(e) => setNewUserLog({ ...newUserLog, action: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="targetTable" className="block mb-2 text-sm font-medium text-gray-700">Target Table (Optional)</label>
                  <input
                    type="text"
                    id="targetTable"
                    name="targetTable"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newUserLog.targetTable}
                    onChange={(e) => setNewUserLog({ ...newUserLog, targetTable: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="targetId" className="block mb-2 text-sm font-medium text-gray-700">Target ID (Optional)</label>
                  <input
                    type="number"
                    id="targetId"
                    name="targetId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newUserLog.targetId}
                    onChange={(e) => setNewUserLog({ ...newUserLog, targetId: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="timestamp" className="block mb-2 text-sm font-medium text-gray-700">Timestamp</label>
                  <input
                    type="datetime-local"
                    id="timestamp"
                    name="timestamp"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newUserLog.timestamp}
                    onChange={(e) => setNewUserLog({ ...newUserLog, timestamp: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">Description (Optional)</label>
                  <textarea
                    id="description"
                    name="description"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newUserLog.description}
                    onChange={(e) => setNewUserLog({ ...newUserLog, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddUserLog(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-700 hover:to-pink-600 transition-all shadow-md"
                >
                  Create User Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">User Log Details</h2>
              <button
                onClick={() => setShowDetails(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ID</p>
                  <p className="font-medium text-gray-800">{showDetails.id}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">User</p>
                  <p className="font-medium text-gray-800">{getUserDisplayName(showDetails.userId)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Action</p>
                  <p className="font-medium text-gray-800">{showDetails.action}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target Table</p>
                  <p className="font-medium text-gray-800">{showDetails.targetTable || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target ID</p>
                  <p className="font-medium text-gray-800">{showDetails.targetId || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Timestamp</p>
                  <p className="font-medium text-gray-800">{new Date(showDetails.timestamp).toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium text-gray-800">{showDetails.description || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setShowDetails(null)}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}