'use client';

import { 
  FiUser, FiMail, FiCalendar, 
  FiLock, FiX, FiCheck, FiEdit2, FiSave, FiTrash2,
  FiActivity, FiBriefcase, FiInfo, FiFileText, FiAward, FiCamera
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminProfileData, UpdateAdminProfileParams, updateAdminProfile, updateAdminProfilePhoto, deleteAdminAccount } from '@/lib/actions/admin/profile.action';
import { getClientImageUrl } from '@/lib/image-client';

interface FormState {
  success?: boolean;
  message?: string;
  errors?: {
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    idNumber?: string[];
    position?: string[];
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States for form fields
  const [firstName, setFirstName] = useState(profileData.staff.firstName);
  const [lastName, setLastName] = useState(profileData.staff.lastName);
  const [email, setEmail] = useState(profileData.user.email);
  const [idNumber, setIdNumber] = useState(profileData.staff.idNumber || '');
  const [position, setPosition] = useState(profileData.staff.position || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // States for images
  const [passportPhotoUrl, setPassportPhotoUrl] = useState<string | null>(null);
  const [nationalIdPhotoUrl, setNationalIdPhotoUrl] = useState<string | null>(null);
  const [academicCertificatesUrl, setAcademicCertificatesUrl] = useState<string | null>(null);
  const [employmentDocumentsUrl, setEmploymentDocumentsUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState({
    passport: true,
    nationalId: true,
    academic: true,
    employment: true
  });

  // Load all profile images
  useEffect(() => {
    const loadImages = async () => {
      try {
        const [
          passportUrl,
          nationalIdUrl,
          academicUrl,
          employmentUrl
        ] = await Promise.all([
          getClientImageUrl(profileData.staff.id, 'staff-passport'),
          getClientImageUrl(profileData.staff.id, 'staff-national-id'),
          getClientImageUrl(profileData.staff.id, 'staff-passport'),
          getClientImageUrl(profileData.staff.id, 'staff-passport')
        ]);

        setPassportPhotoUrl(passportUrl ?? null);
        setNationalIdPhotoUrl(nationalIdUrl ?? null);
        setAcademicCertificatesUrl(academicUrl ?? null);
        setEmploymentDocumentsUrl(employmentUrl ?? null);
      } catch (error) {
        console.error("Error fetching profile images:", error);
      } finally {
        setImageLoading({
          passport: false,
          nationalId: false,
          academic: false,
          employment: false
        });
      }
    };

    if (profileData?.staff?.id) {
      loadImages();
    }
  }, [profileData.staff.id]);

  // Reset form when editing is toggled
  useEffect(() => {
    if (!isEditing) {
      setFirstName(profileData.staff.firstName);
      setLastName(profileData.staff.lastName);
      setEmail(profileData.user.email);
      setIdNumber(profileData.staff.idNumber || '');
      setPosition(profileData.staff.position || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFormState({});
    }
  }, [isEditing, profileData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Client-side validation
    if (isChangingPassword && newPassword !== confirmPassword) {
      setFormState({
        errors: {
          confirmPassword: ['Passwords do not match']
        }
      });
      setIsSubmitting(false);
      return;
    }
    
    const formData: UpdateAdminProfileParams = {
      firstName,
      lastName,
      email,
      idNumber: idNumber || undefined,
      position: position || undefined,
      ...(isChangingPassword && {
        currentPassword,
        newPassword
      })
    };
    
    try {
      const result = await updateAdminProfile(formData);
      
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (fileType: 'passport' | 'nationalId' | 'academic' | 'employment', file: File) => {
    try {
      // Show loading state for the specific image
      setImageLoading(prev => ({ ...prev, [fileType]: true }));
      
      const result = await updateAdminProfilePhoto(fileType, file);
      
      if (result.success && result.fileUrl) {
        // Update the specific image URL
        switch (fileType) {
          case 'passport':
            setPassportPhotoUrl(result.fileUrl);
            break;
          case 'nationalId':
            setNationalIdPhotoUrl(result.fileUrl);
            break;
          case 'academic':
            setAcademicCertificatesUrl(result.fileUrl);
            break;
          case 'employment':
            setEmploymentDocumentsUrl(result.fileUrl);
            break;
        }
        
        setFormState({
          success: true,
          message: `${fileType} updated successfully`
        });
      } else {
        setFormState({
          success: false,
          message: result.message || 'Failed to upload file'
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setFormState({
        success: false,
        message: 'Failed to upload file'
      });
    } finally {
      setImageLoading(prev => ({ ...prev, [fileType]: false }));
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation === 'DELETE MY ACCOUNT') {
      try {
        const result = await deleteAdminAccount(deleteConfirmation);
        
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

  const renderImageSection = (title: string, type: 'passport' | 'nationalId' | 'academic' | 'employment', 
                              imageUrl: string | null, isLoading: boolean, icon: React.ReactNode) => {
    return (
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          {icon} {title}
        </label>
        <div className="relative w-full h-48 border border-gray-300 rounded-md overflow-hidden bg-gray-100">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <FiCamera className="w-8 h-8 mb-2" />
              <span className="text-sm">No {title.toLowerCase()}</span>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileUpload(type, file);
            }
          }}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side: Profile Images */}
        <div className="w-full lg:w-1/3 space-y-6">
          {renderImageSection('Passport Photo', 'passport', passportPhotoUrl, imageLoading.passport, <FiUser className="mr-2" />)}
          {renderImageSection('National ID', 'nationalId', nationalIdPhotoUrl, imageLoading.nationalId, <FiInfo className="mr-2" />)}
          {renderImageSection('Academic Certificates', 'academic', academicCertificatesUrl, imageLoading.academic, <FiAward className="mr-2" />)}
          {renderImageSection('Employment Documents', 'employment', employmentDocumentsUrl, imageLoading.employment, <FiFileText className="mr-2" />)}
        </div>

        {/* Right side: Profile Info + Forms */}
        <div className="w-full lg:w-2/3">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-sm bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center"
              >
                <FiEdit2 className="mr-1" /> Edit Profile
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-sm bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 flex items-center"
              >
                Cancel
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className={`text-sm py-2 px-4 rounded-md flex items-center ${
                isEditing 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
              disabled={isEditing}
            >
              <FiLock className="mr-1" /> 
              {isChangingPassword ? 'Cancel Password Change' : 'Change Password'}
            </button>
            
            <button
              type="button"
              onClick={() => setIsDeletingAccount(!isDeletingAccount)}
              className={`text-sm py-2 px-4 rounded-md flex items-center ${
                isEditing 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'text-red-600 hover:text-red-800'
              }`}
              disabled={isEditing}
            >
              <FiTrash2 className="mr-1" /> 
              {isDeletingAccount ? 'Cancel Deletion' : 'Delete Account'}
            </button>
          </div>

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
                  Type <span className="font-bold">DELETE MY ACCOUNT</span> to confirm
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
                  onClick={() => {
                    setIsDeletingAccount(false);
                    setDeleteConfirmation('');
                  }}
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
              {formState && !formState.success && formState.message && (
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
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}

          {/* Profile Information Form */}
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* First Name */}
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
                  <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">
                    {profileData.staff.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
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
                  <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">
                    {profileData.staff.lastName}
                  </p>
                )}
              </div>

              {/* Email */}
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
                  <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">
                    {profileData.user.email}
                  </p>
                )}
              </div>

              {/* ID Number */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiInfo className="mr-2" /> ID Number
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {formState?.errors?.idNumber && (
                      <p className="text-sm text-red-600">{formState.errors.idNumber[0]}</p>
                    )}
                  </>
                ) : (
                  <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">
                    {profileData.staff.idNumber || 'Not set'}
                  </p>
                )}
              </div>

              {/* Position */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiBriefcase className="mr-2" /> Position
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {formState?.errors?.position && (
                      <p className="text-sm text-red-600">{formState.errors.position[0]}</p>
                    )}
                  </>
                ) : (
                  <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">
                    {profileData.staff.position || 'Not set'}
                  </p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiBriefcase className="mr-2" /> Department
                </label>
                <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">
                  {profileData.department?.name || 'Not assigned'}
                </p>
              </div>

              {/* Member Since */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiCalendar className="mr-2" /> Member Since
                </label>
                <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">
                  {new Date(profileData.user.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Role (Non-editable) */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiActivity className="mr-2" /> Role
                </label>
                <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md capitalize">
                  {profileData.user.roleId}
                </p>
              </div>
            </div>

            {/* Buttons only show when editing */}
            {isEditing && (
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-sm bg-green-600 text-white py-2 px-4 rounded-md 
                            hover:bg-green-700 disabled:bg-green-400 flex items-center justify-center"
                >
                  <FiSave className="mr-1" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-sm bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Success/Error messages */}
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