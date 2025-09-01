'use client';

import { 
  FiUser, FiMail, FiCalendar, 
  FiLock, FiX, FiCheck, FiEdit2, FiSave, FiTrash2,
  FiActivity, FiBriefcase
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { getClientImageUrl } from '@/lib/image-client';
import { AdminProfileData, UpdateAdminProfileParams, updateAdminProfile, deleteAdminAccount } from '@/lib/actions/admin/profile.action';

interface FormState {
  success?: boolean;
  message?: string;
  errors?: {
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    currentPassword?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
  };
}

export default function AdminProfileSection({ profileData }: {
  profileData: AdminProfileData
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  const [formState, setFormState] = useState<FormState>({});
  const { pending } = useFormStatus();
  
  // States for form fields
  const [firstName, setFirstName] = useState(profileData.staff.firstName);
  const [lastName, setLastName] = useState(profileData.staff.lastName);
  const [email, setEmail] = useState(profileData.user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // States for avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const url = await getClientImageUrl(profileData.staff.id, 'staff-passport');
        if (url) {
          setAvatarUrl(url);
        } else {
          setAvatarUrl(null);
        }
      } catch (error) {
        console.error("Error fetching profile image:", error);
        setAvatarUrl(null);
      } finally {
        setImageLoading(false);
      }
    };

    if (profileData?.staff?.id) {
      fetchAvatar();
    }
  }, [profileData.staff.id]);

  // Reset form when editing is toggled
  useEffect(() => {
    if (!isEditing) {
      setFirstName(profileData.staff.firstName);
      setLastName(profileData.staff.lastName);
      setEmail(profileData.user.email);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      setFormState({});
    }
  }, [isEditing, profileData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (isChangingPassword && newPassword !== confirmPassword) {
      setFormState({
        errors: {
          confirmPassword: ['Passwords do not match']
        }
      });
      return;
    }
    
    const formData: UpdateAdminProfileParams = {
      firstName,
      lastName,
      email,
      ...(isChangingPassword && {
        currentPassword,
        newPassword
      })
    };
    
    try {
      const result = await updateAdminProfile(
        profileData.user.id, 
        profileData.staff.id, 
        formData
      );
      
      setFormState(result);
      
      if (result.success) {
        setIsEditing(false);
        setIsChangingPassword(false);
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setFormState({
        success: false,
        message: 'An unexpected error occurred'
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation === 'DELETE MY ACCOUNT') {
      try {
        const result = await deleteAdminAccount(
          profileData.user.id, 
          profileData.staff.id, 
          deleteConfirmation
        );
        
        if (!result.success) {
          setFormState(result);
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        setFormState({
          success: false,
          message: 'An unexpected error occurred while deleting your account'
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Image + Action Buttons */}
        <div className="w-full md:w-1/3">
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
              {imageLoading ? (
                <Skeleton className="w-full h-full rounded-full" />
              ) : avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile photo"
                  fill
                  className="object-cover"
                  onLoad={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <FiUser className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 w-full">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-sm bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center"
                >
                  <FiEdit2 className="mr-1" /> Edit Profile
                </button>
              ) : (
                <button
                  type="submit"
                  form="profile-form"
                  disabled={pending}
                  className="text-sm bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-green-400 flex items-center justify-center"
                >
                  <FiSave className="mr-1" /> {pending ? 'Saving...' : 'Save Changes'}
                </button>
              )}
              
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-sm bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 flex items-center justify-center"
                >
                  Cancel
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
              >
                <FiLock className="mr-1" /> 
                {isChangingPassword ? 'Cancel Password Change' : 'Change Password'}
              </button>
              
              <button
                type="button"
                onClick={() => setIsDeletingAccount(!isDeletingAccount)}
                className="text-sm text-red-600 hover:text-red-800 flex items-center justify-center mt-4"
              >
                <FiTrash2 className="mr-1" /> 
                {isDeletingAccount ? 'Cancel Deletion' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>

        {/* Right side: Profile Info + Forms */}
        <div className="w-full md:w-2/3">
          {/* Account Deletion Confirmation */}
          {isDeletingAccount && (
            <div className="mb-6 p-4 border border-red-200 rounded-lg bg-red-50 text-black">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-red-700">
                <FiTrash2 className="mr-2" /> Delete Account
              </h3>
              <p className="mb-3 text-red-600">
                Warning: This action is irreversible. All your data will be permanently deleted.
              </p>
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-red-700">
                  Type "DELETE MY ACCOUNT" to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-md"
                  placeholder="DELETE MY ACCOUNT"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDeletingAccount(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'DELETE MY ACCOUNT'}
                  className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-red-400 disabled:cursor-not-allowed"
                >
                  Delete Account Permanently
                </button>
              </div>
              {formState && !formState.success && (
                <p className="mt-3 text-sm text-red-600 flex items-center">
                  <FiX className="mr-1" /> {formState.message}
                </p>
              )}
            </div>
          )}

          {/* Password Change Form */}
          {isChangingPassword && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 text-black">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FiLock className="mr-2" /> Change Password
              </h3>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {formState?.errors?.currentPassword && (
                    <p className="text-sm text-red-600">
                      {formState.errors.currentPassword[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {formState?.errors?.newPassword && (
                    <p className="text-sm text-red-600">
                      {formState.errors.newPassword[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {formState?.errors?.confirmPassword && (
                    <p className="text-sm text-red-600">
                      {formState.errors.confirmPassword[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Profile Information (Editable when isEditing is true) */}
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                    {formState?.errors?.firstName && (
                      <p className="text-sm text-red-600">{formState.errors.firstName[0]}</p>
                    )}
                  </>
                ) : (
                  <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">{profileData.staff.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                    {formState?.errors?.lastName && (
                      <p className="text-sm text-red-600">{formState.errors.lastName[0]}</p>
                    )}
                  </>
                ) : (
                  <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">{profileData.staff.lastName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiMail className="mr-2" /> Email
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                    {formState?.errors?.email && (
                      <p className="text-sm text-red-600">{formState.errors.email[0]}</p>
                    )}
                  </>
                ) : (
                  <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">{profileData.user.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiBriefcase className="mr-2" /> Department
                </label>
                <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">
                  {profileData.department?.name || 'Not assigned'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiCalendar className="mr-2" /> Member Since
                </label>
                <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">
                  {new Date(profileData.user.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiActivity className="mr-2" /> Role
                </label>
                <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md capitalize">
                  {profileData.user.roleId}
                </p>
              </div>
            </div>

            {formState?.success && (
              <p className="mt-4 text-sm text-emerald-600 flex items-center">
                <FiCheck className="mr-1" /> {formState.message}
              </p>
            )}
            {formState && !formState.success && formState.message && (
              <p className="mt-4 text-sm text-red-600 flex items-center">
                <FiX className="mr-1" /> {formState.message}
              </p>
            )}
          </form>

          {/* Recent Activity Section */}
          {profileData.recentActivity && profileData.recentActivity.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FiActivity className="mr-2" /> Recent Activity
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-3">
                  {profileData.recentActivity.map((activity, index) => (
                    <li key={index} className="text-sm border-b border-gray-200 pb-2 last:border-b-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{activity.description}</span>
                        <span className="text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}