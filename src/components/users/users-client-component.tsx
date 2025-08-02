'use client';

import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave, FiCheck } from "react-icons/fi";
import { createUser, updateUser, deleteUser, getUsers } from "@/lib/actions/user.actions";
import Image from "next/image";
interface Role {
  id: number;
  name: string;
}

interface ApiUser {
  id: number;
  email: string;
  roleId: number;
  roleName: string | null;
  fullName: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  email: string;
  roleId: number;
  roleName: string | null;
  fullName: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UsersClientComponentProps {
  initialUsers: ApiUser[];
  roles: Role[];
}

const transformApiUser = (apiUser: ApiUser): User => {
  return {
    id: apiUser.id,
    email: apiUser.email,
    roleId: apiUser.roleId,
    roleName: apiUser.roleName,
    fullName: apiUser.fullName,
    photoUrl: apiUser.photoUrl,
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt
  };
};

export default function UsersClientComponent({ initialUsers, roles }: UsersClientComponentProps) {
  const [users, setUsers] = useState<User[]>(initialUsers.map(transformApiUser));
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState<"email" | "fullName" | "roleName">("email");
  const [editId, setEditId] = useState<number | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [showDetails, setShowDetails] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    roleId: "",
    password: ""
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const filteredUsers = users.filter((user: User) => {
    const value = filterBy === "fullName" 
      ? user.fullName ?? "" 
      : filterBy === "roleName" 
      ? user.roleName ?? "" 
      : user.email;
    return value.toLowerCase().includes(search.toLowerCase());
  });

  // const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   setFilterBy(e.target.value as "email" | "fullName" | "roleName");
  // };

  const handleEdit = (user: User) => {
    setEditId(user.id);
    setEditedUser({
      ...user,
      fullName: user.fullName ?? '',
      roleName: user.roleName ?? ''
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSave = async (id: number, formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await updateUser(id, formData);
      if ('error' in result) {
        setFormError(result.error ?? "Failed to update user.");
        return;
      }
      setFormSuccess('User updated successfully!');
      setEditId(null);
      
      const updatedUsers = await getUsers();
      setUsers(updatedUsers.map(transformApiUser));
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Failed to update user.");
    }
  };

  const handleAddUser = async (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await createUser(formData);
      if ('error' in result) {
        setFormError(result.error ?? "Failed to create user.");
        return;
      }
      setFormSuccess('User created successfully!');
      setShowAddUser(false);
      setNewUser({ email: "", roleId: "", password: "" });

      const updatedUsers = await getUsers();
      setUsers(updatedUsers.map(transformApiUser));
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Failed to create user.");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setFormError(null);
    setFormSuccess(null);
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const result = await deleteUser(userId);
      if ('error' in result) {
        setFormError(result.error ?? "Failed to delete user.");
        return;
      }
      setFormSuccess('User deleted successfully!');
      setUsers(users.filter(user => user.id !== userId));
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Failed to delete user.");
    }
  };

  // JSX portion remains the same...

  return (
    <>
      {/* Search and filter bar */}
      <div className="sticky top-[150px] z-20 px-12 py-4 bg-emerald-800 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search users..."
            className="px-4 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 border border-emerald-600"
            value={filterBy}
            onChange={(e) =>
              setFilterBy(e.target.value as "email" | "fullName" | "roleName")
            }
          >
            <option className="bg-emerald-800" value="email">
              Email
            </option>
            <option className="bg-emerald-800" value="fullName">
              Full Name
            </option>
            <option className="bg-emerald-800" value="roleName">
              Role
            </option>
          </select>
        </div>
        <button
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all shadow-md"
          onClick={() => setShowAddUser(true)}
        >
          <FiPlus /> Add User
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
      <div className="px-12 py-6 h-[calc(100vh-300px)] overflow-hidden">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col border border-white/20">
          <div className="overflow-x-auto h-full">
            <div className="h-full">
              <div className="overflow-y-auto max-h-full">
                <table className="min-w-full table-fixed text-gray-800">
                  <thead className="sticky top-0 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white z-10">
                    <tr>
                      <th className="p-4 text-left w-24">ID</th>
                      <th className="p-4 text-left w-48">Photo</th>
                      <th className="p-4 text-left">Full Name</th>
                      <th className="p-4 text-left w-48">Role</th>
                      <th className="p-4 text-left w-48">Email</th>
                      <th className="p-4 text-left w-48">Created At</th>
                      <th className="p-4 text-left w-48">Updated At</th>
                      <th className="p-4 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredUsers.map((user: User) => (
                      <tr
                        key={user.id}
                        className="hover:bg-emerald-50/50 transition-colors"
                      >
                        <td className="p-4 font-medium">{user.id}</td>
                        <td className="p-4">
{user.photoUrl ? (
  <div className="w-10 h-10 rounded-full overflow-hidden">
    <Image
      src={user.photoUrl}
      alt={`${user.fullName || user.email} photo`}
      width={40}
      height={40}
      className="object-cover"
    />
  </div>
) : (
  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm">
    N/A
  </div>
)}
                        </td>
                        <td className="p-4 font-medium">
                          {editId === user.id ? (
                            <input
                              type="text"
                              name="fullName" // Name for FormData
                              className="px-2 py-1.5 border border-gray-300 rounded-md text-gray-800 w-full"
                              // Fix: Coalesce to an empty string if null or undefined
                              value={editedUser.fullName ?? user.fullName ?? ''} 
                              onChange={(e) =>
                                setEditedUser({ ...editedUser, fullName: e.target.value })
                              }
                            />
                          ) : (
                            user.fullName || "—"
                          )}
                        </td>
                        {/* Role Column (with editable select) */}
                        <td className="p-4">
                          {editId === user.id ? (
                            <select
                              name="roleId" // This name is crucial for FormData
                              className="px-2 py-1.5 border border-gray-300 rounded-md text-gray-800 w-full"
                              value={editedUser.roleId !== undefined ? editedUser.roleId : user.roleId}
                              onChange={(e) => {
                                const newRoleId = parseInt(e.target.value);
                                const newRoleName = roles.find(role => role.id === newRoleId)?.name || null;
                                setEditedUser(prev => ({
                                  ...prev,
                                  roleId: newRoleId,
                                  roleName: newRoleName,
                                }));
                              }}
                            >
                              <option value="">Select Role</option>
                              {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            user.roleName
                          )}
                        </td>
                        <td className="p-4">
                          {editId === user.id ? (
                            <input
                              type="email"
                              name="email" // Name for FormData
                              className="px-2 py-1.5 border border-gray-300 rounded-md text-gray-800 w-full"
                              value={editedUser.email !== undefined ? editedUser.email : user.email || ''}
                              onChange={(e) =>
                                setEditedUser({ ...editedUser, email: e.target.value })
                              }
                            />
                          ) : (
                            user.email
                          )}
                        </td>
                        <td className="p-4 text-gray-600">
                          {new Date(user.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 text-gray-600">
                          {new Date(user.updatedAt).toLocaleString()}
                        </td>
                        <td className="p-4 flex gap-3 items-center">
                          {editId === user.id ? (
                            <>
                              <button
                                className="text-white bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shadow"
                                onClick={() => {
                                  // Create FormData from the current editedUser state
                                  const formData = new FormData();
                                  if (editedUser.email !== undefined) formData.append("email", editedUser.email);
                                  if (editedUser.roleId !== undefined) formData.append("roleId", String(editedUser.roleId));
                                  // You can add other editable fields here too (e.g., fullName if you make it editable)
                                  handleSave(user.id, formData);
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
                                onClick={() => handleEdit(user)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                className="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-50 transition-colors"
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
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl">
            <div className="flex justify-between items-center border-b p-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Create New User
              </h2>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <form
              action={handleAddUser}
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const password = formData.get("password")?.toString();
                const confirmPassword = (e.currentTarget.querySelector(
                  '#confirmPassword'
                ) as HTMLInputElement)?.value;

                if (password !== confirmPassword) {
                  setFormError("Passwords do not match.");
                  return;
                }
                handleAddUser(formData);
              }}
            >
              <div className="grid grid-cols-2 gap-6 p-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="roleId"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Role
                  </label>
                  <select
                    id="roleId"
                    name="roleId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newUser.roleId}
                    onChange={(e) =>
                      setNewUser({ ...newUser, roleId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full">
                    <label
                      htmlFor="confirmPassword"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 bg-white"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg hover:from-pink-700 hover:to-pink-600 transition-all shadow-md"
                >
                  Create User
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
              <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
              <button
                onClick={() => setShowDetails(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
{showDetails.photoUrl ? (
  <div className="w-10 h-10 rounded-full overflow-hidden">
    <Image
      src={showDetails.photoUrl}
      alt={`${showDetails} photo`}
      width={40}
      height={40}
      className="object-cover"
    />
  </div>
) : (
  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm">
    N/A
  </div>
)}

                <div>
                  <p className="text-xl font-semibold">
                    {showDetails.fullName || "No Name"}
                  </p>
                  <p className="text-gray-600">{showDetails.email}</p>
                  <p className="text-gray-600 font-medium">{showDetails.roleName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ID</p>
                  <p className="font-medium">{showDetails.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium">
                    {new Date(showDetails.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Updated At</p>
                  <p className="font-medium">
                    {new Date(showDetails.updatedAt).toLocaleString()}
                  </p>
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