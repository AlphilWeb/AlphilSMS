'use client';

import { 
  FiUser, FiMail, FiBook, FiHash, FiCalendar, 
  FiLock, FiX, FiCheck 
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { updateStudentPassword } from '@/lib/actions/studentProfile.action';
import { useFormState, useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { getClientImageUrl } from '@/lib/image-client';

export default function ProfileSection({ profileData }: {
  profileData: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    idNumber: string | null;
    registrationNumber: string;
    studentNumber: string;
    programName: string;
    programCode: string;
    departmentName: string;
    createdAt: string;
  }
}) {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordState, passwordAction] = useFormState(updateStudentPassword, null);
  const { pending } = useFormStatus();

  // 🔑 States for avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const url = await getClientImageUrl(profileData.id, 'student-passport');
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

    if (profileData?.id) {
      fetchAvatar();
    }
  }, [profileData.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Image + Change Password Toggle */}
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

            <button
              type="button"
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <FiLock className="mr-1" /> 
              {isChangingPassword ? 'Cancel Password Change' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* Right side: Profile Info + Password Change Form */}
        <div className="w-full md:w-2/3">
          {/* Password Change Form */}
          {isChangingPassword && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 text-black">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FiLock className="mr-2" /> Change Password
              </h3>
              <form action={passwordAction}>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      name="currentPassword"
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {passwordState?.fieldErrors?.currentPassword && (
                      <p className="text-sm text-red-600">
                        {passwordState.fieldErrors.currentPassword[0]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      name="newPassword"
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {passwordState?.fieldErrors?.newPassword && (
                      <p className="text-sm text-red-600">
                        {passwordState.fieldErrors.newPassword[0]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      name="confirmPassword"
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {passwordState?.fieldErrors?.confirmPassword && (
                      <p className="text-sm text-red-600">
                        {passwordState.fieldErrors.confirmPassword[0]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-400"
                  >
                    {pending ? 'Updating...' : 'Update Password'}
                  </button>
                </div>

                {passwordState?.success && (
                  <p className="mt-4 text-sm text-emerald-600 flex items-center">
                    <FiCheck className="mr-1" /> {passwordState.success}
                  </p>
                )}
                {passwordState?.error && (
                  <p className="mt-4 text-sm text-red-600 flex items-center">
                    <FiX className="mr-1" /> {passwordState.error}
                  </p>
                )}
              </form>
            </div>
          )}

          {/* Profile Information (Read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <p className="px-3 py-2 text-pink-500 bg-gray-50 rounded-md">{profileData.firstName}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <p className="px-3 py-2 text-pink-500 bg-gray-50 rounded-md">{profileData.lastName}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">ID Number</label>
              <p className="px-3 py-2 text-pink-500 bg-gray-50 rounded-md">
                {profileData.idNumber || 'Not provided'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FiMail className="mr-2" /> Email
              </label>
              <p className="px-3 py-2 text-pink-500 bg-gray-50 rounded-md">{profileData.email}</p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FiHash className="mr-2" /> Registration Number
              </label>
              <p className="px-3 py-2 text-pink-500 bg-gray-50 rounded-md">{profileData.registrationNumber}</p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FiHash className="mr-2" /> Student Number
              </label>
              <p className="px-3 py-2 text-pink-500 bg-gray-50 rounded-md">{profileData.studentNumber}</p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FiBook className="mr-2" /> Program
              </label>
              <p className="px-3 py-2 text-pink-500 bg-gray-50 rounded-md">
                {profileData.programName} ({profileData.programCode})
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FiUser className="mr-2" /> Department
              </label>
              <p className="px-3 py-2 text-pink-500 bg-gray-50 rounded-md">{profileData.departmentName}</p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FiCalendar className="mr-2" /> Member Since
              </label>
              <p className="px-3 py-2 text-pink-500 bg-gray-50 rounded-md">
                {new Date(profileData.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-500 italic">
            <p>Note: Personal information (name and ID number) cannot be modified. Please contact administration for any corrections.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
