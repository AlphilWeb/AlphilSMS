"use client";

import AdminDashboardHeader from "@/components/adminDashboardHeader";
import { useEffect, useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX } from "react-icons/fi";
import { fetchAPI } from "@/lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("email");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editedUser, setEditedUser] = useState<any>({});
  const [showDetails, setShowDetails] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    roleId: "",
    password: ""
  });

  useEffect(() => {
    async function loadUsers() {
      const response = await fetchAPI("/api/users");
      setUsers(response.data);
    }
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user: any) =>
    user[filterBy]?.toString().toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (user: any) => {
    setEditId(user.id);
    setEditedUser(user);
  };

  const handleSave = async (id: number) => {
    await fetchAPI(`/api/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(editedUser),
    });
    setEditId(null);
    // Refresh users
    const response = await fetchAPI("/api/users");
    setUsers(response.data);
  };

  const handleAddUser = async () => {
    await fetchAPI("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newUser),
    });
    setShowAddUser(false);
    setNewUser({ email: "", roleId: "", password: "" });
    // Refresh users
    const response = await fetchAPI("/api/users");
    setUsers(response.data);
  };

  return (
    <>
      <AdminDashboardHeader />

      <main className="pl-[230px] min-h-screen bg-emerald-950 text-white">
        {/* Sticky filter/search section */}
        <div className="sticky top-[58px] z-30 bg-emerald-900 px-6 py-4 border-b border-emerald-700 flex flex-wrap justify-between items-center">
          <div className="text-lg font-semibold">Total Users: {users.length}</div>
          <div className="flex flex-wrap gap-4 items-center">
            <button 
              className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-white font-medium flex items-center gap-2 transition-colors"
              onClick={() => setShowAddUser(true)}
            >
              <FiPlus /> Add User
            </button>
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1.5 text-black rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="px-3 py-1.5 text-black rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
            >
              <option value="email">Email</option>
              <option value="id">ID</option>
              <option value="roleId">Role ID</option>
            </select>
          </div>
        </div>

        {/* Table section */}
        <div className="px-6 py-4">
          <div className="bg-white rounded shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-emerald-800 text-white sticky top-[106px] z-20">
                  <tr>
                    <th className="p-3 text-left w-12">Select</th>
                    <th className="p-3 text-left w-24">ID</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left w-24">Role ID</th>
                    <th className="p-3 text-left w-48">Created At</th>
                    <th className="p-3 text-left w-48">Updated At</th>
                    <th className="p-3 text-left w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 max-h-[calc(100vh-180px)] overflow-y-auto block">
                  {filteredUsers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-emerald-50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          checked={selectedUserId === user.id}
                          onChange={() =>
                            setSelectedUserId(selectedUserId === user.id ? null : user.id)
                          }
                        />
                      </td>
                      <td className="p-3">{user.id}</td>
                      <td className="p-3">
                        {editId === user.id ? (
                          <input
                            className="px-2 py-1 border rounded w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            value={editedUser.email}
                            onChange={(e) =>
                              setEditedUser({ ...editedUser, email: e.target.value })
                            }
                          />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td className="p-3">
                        {editId === user.id ? (
                          <input
                            className="px-2 py-1 border rounded w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            value={editedUser.roleId}
                            onChange={(e) =>
                              setEditedUser({ ...editedUser, roleId: e.target.value })
                            }
                          />
                        ) : (
                          user.roleId
                        )}
                      </td>
                      <td className="p-3">{new Date(user.createdAt).toLocaleString()}</td>
                      <td className="p-3">{new Date(user.updatedAt).toLocaleString()}</td>
                      <td className="p-3 flex gap-2 items-center">
                        {editId === user.id ? (
                          <>
                            <button
                              className="text-green-700 hover:text-green-900 transition-colors"
                              onClick={() => handleSave(user.id)}
                            >
                              Save
                            </button>
                            <button
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                              onClick={() => setEditId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              onClick={() => handleEdit(user)}
                              title="Edit"
                            >
                              <FiEdit />
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                            <button
                              className="text-emerald-600 hover:text-emerald-800 transition-colors"
                              onClick={() => setShowDetails(user)}
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

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex justify-between items-center border-b p-4">
                <h2 className="text-xl font-bold text-gray-800">Add New User</h2>
                <button 
                  onClick={() => setShowAddUser(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Role ID</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={newUser.roleId}
                    onChange={(e) => setNewUser({...newUser, roleId: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 p-4 border-t">
                <button
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex justify-between items-center border-b p-4">
                <h2 className="text-xl font-bold text-gray-800">User Details</h2>
                <button 
                  onClick={() => setShowDetails(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID:</span>
                  <span className="font-medium">{showDetails.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{showDetails.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role ID:</span>
                  <span className="font-medium">{showDetails.roleId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created At:</span>
                  <span className="font-medium">{new Date(showDetails.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated At:</span>
                  <span className="font-medium">{new Date(showDetails.updatedAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-end p-4 border-t">
                <button
                  onClick={() => setShowDetails(null)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}