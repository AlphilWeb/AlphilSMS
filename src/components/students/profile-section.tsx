'use client';

import { FiEdit, FiSave, FiUser, FiMail, FiBook, FiHash, FiCalendar } from 'react-icons/fi';
import { useState } from 'react';
import { updateStudentProfile } from '@/lib/actions/studentProfile.action';
import { useFormState, useFormStatus } from 'react-dom';
import Image from 'next/image';

export default function ProfileSection({ profileData }: {
  profileData: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    registrationNumber: string;
    studentNumber: string;
    programName: string;
    programCode: string;
    departmentName: string;
    createdAt: string;
    passportPhotoUrl: string;
  }
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction] = useFormState(updateStudentProfile, null);
  const { pending } = useFormStatus();

  return (
    <div className="space-y-6">
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
            <button className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center">
              <FiEdit className="mr-1" /> Change Photo
            </button>
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <form action={formAction}>
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
                  <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">{profileData.firstName}</p>
                )}
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
                  <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">{profileData.lastName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiMail className="mr-2" /> Email
                </label>
                <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">{profileData.email}</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiHash className="mr-2" /> Student Number
                </label>
                <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">{profileData.studentNumber}</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiBook className="mr-2" /> Program
                </label>
                <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">
                  {profileData.programName} ({profileData.programCode})
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiUser className="mr-2" /> Department
                </label>
                <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">{profileData.departmentName}</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FiCalendar className="mr-2" /> Member Since
                </label>
                <p className="px-3 py-2 text-blue-600 bg-gray-50 rounded-md">
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
                    disabled={pending}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md disabled:bg-emerald-400"
                  >
                    {pending ? 'Saving...' : (
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
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md"
                >
                  <FiEdit className="inline mr-1" /> Edit Profile
                </button>
              )}
            </div>

            {state?.success && (
              <p className="mt-4 text-sm text-emerald-600">{state.success}</p>
            )}
            {state?.error && (
              <p className="mt-4 text-sm text-red-600">{state.error}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}