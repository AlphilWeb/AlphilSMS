'use client';

import { FiEdit, FiSave, FiUser, FiMail, FiBriefcase, FiCalendar, FiFileText } from 'react-icons/fi';
import { useState } from 'react';
import { updateLecturerProfile, updateLecturerDocuments } from '@/lib/actions/lecturer.profile.actions';
import { useFormState, useFormStatus } from 'react-dom';
import Image from 'next/image';

type ProfileState = {
  success?: string;
  error?: string;
  fieldErrors?: {
    firstName?: string[];
    lastName?: string[];
    position?: string[];
  };
};

type DocumentsState = {
  success?: string;
  error?: string;
};

export default function LecturerProfileSection({ profileData }: {
  profileData: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    departmentName: string;
    createdAt: string;
    passportPhotoUrl: string;
    nationalIdPhotoUrl: string;
    academicCertificatesUrl: string;
    employmentDocumentsUrl: string;
  }
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDocuments, setIsEditingDocuments] = useState(false);
  
  // Properly typed form states
  const [profileState, profileAction] = useFormState<ProfileState, FormData>(
    updateLecturerProfile, 
    {}
  );
  
  const [documentsState, documentsAction] = useFormState<DocumentsState, FormData>(
    updateLecturerDocuments, 
    {}
  );
  
  const { pending: isProfilePending } = useFormStatus();

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
              <Image
                src={profileData.passportPhotoUrl}
                alt="Profile photo"
                fill
                className="object-cover"
              />
            </div>
            <button 
              onClick={() => setIsEditingDocuments(true)}
              className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center"
            >
              <FiEdit className="mr-1" /> Manage Documents
            </button>
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <form action={profileAction}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                {isEditing ? (
                  <input
                    name="firstName"
                    defaultValue={profileData.firstName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="px-3 py-2 text-pink-600 bg-gray-50 rounded-md">{profileData.firstName}</p>
                )}
                {profileState?.fieldErrors?.firstName?.map((error, i) => (
                  <p key={`firstName-error-${i}`} className="text-sm text-red-600">{error}</p>
                ))}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                {isEditing ? (
                  <input
                    name="lastName"
                    defaultValue={profileData.lastName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="px-3 py-2 text-pink-600 bg-gray-50 rounded-md">{profileData.lastName}</p>
                )}
                {profileState?.fieldErrors?.lastName?.map((error, i) => (
                  <p key={`lastName-error-${i}`} className="text-sm text-red-600">{error}</p>
                ))}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiMail className="mr-2" /> Email
                </label>
                <p className="px-3 py-2 text-pink-600 bg-gray-50 rounded-md">{profileData.email}</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiBriefcase className="mr-2" /> Position
                </label>
                {isEditing ? (
                  <>
                    <input
                      name="position"
                      defaultValue={profileData.position}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {profileState?.fieldErrors?.position?.map((error, i) => (
                      <p key={`position-error-${i}`} className="text-sm text-red-600">{error}</p>
                    ))}
                  </>
                ) : (
                  <p className="px-3 py-2 text-pink-600 bg-gray-50 rounded-md">{profileData.position}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiUser className="mr-2" /> Department
                </label>
                <p className="px-3 py-2 text-pink-600 bg-gray-50 rounded-md">{profileData.departmentName}</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiCalendar className="mr-2" /> Member Since
                </label>
                <p className="px-3 py-2 text-pink-600 bg-gray-50 rounded-md">
                  {new Date(profileData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProfilePending}
                    className="px-4 py-2 bg-pink-600 text-white rounded-md disabled:bg-pink-400"
                  >
                    {isProfilePending ? 'Saving...' : (
                      <>
                        <FiSave className="inline mr-1" /> Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-pink-600 text-white rounded-md"
                >
                  <FiEdit className="inline mr-1" /> Edit Profile
                </button>
              )}
            </div>

            {profileState?.success && (
              <p className="mt-4 text-sm text-emerald-600">{profileState.success}</p>
            )}
            {profileState?.error && !profileState.fieldErrors && (
              <p className="mt-4 text-sm text-red-600">{profileState.error}</p>
            )}
          </form>
        </div>
      </div>

      {/* Documents Section - Only shown when editing documents */}
      {isEditingDocuments && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiFileText className="mr-2" /> Manage Documents
          </h3>
          
          <form action={documentsAction}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Passport Photo URL</label>
                <input
                  name="passportPhotoUrl"
                  defaultValue={profileData.passportPhotoUrl}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">National ID Photo URL</label>
                <input
                  name="nationalIdPhotoUrl"
                  defaultValue={profileData.nationalIdPhotoUrl}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Academic Certificates URL</label>
                <input
                  name="academicCertificatesUrl"
                  defaultValue={profileData.academicCertificatesUrl}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Employment Documents URL</label>
                <input
                  name="employmentDocumentsUrl"
                  defaultValue={profileData.employmentDocumentsUrl}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditingDocuments(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-pink-600 text-white rounded-md"
              >
                <FiSave className="inline mr-1" /> Save Documents
              </button>
            </div>

            {documentsState?.success && (
              <p className="mt-4 text-sm text-emerald-600">{documentsState.success}</p>
            )}
            {documentsState?.error && (
              <p className="mt-4 text-sm text-red-600">{documentsState.error}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}