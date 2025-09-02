'use client';

import { FiEdit, FiSave, FiUser, FiMail, FiBriefcase, FiCalendar, FiFileText, FiX, FiCamera } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { updateLecturerProfile, updateLecturerProfilePhoto } from '@/lib/actions/lecturer.profile.actions';
import { useFormState, useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { getClientImageUrl } from '@/lib/image-client';

type ProfileState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    firstName?: string[];
    lastName?: string[];
    position?: string[];
  };
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
  
  // States for form fields
  const [firstName, setFirstName] = useState(profileData.firstName);
  const [lastName, setLastName] = useState(profileData.lastName);
  const [position, setPosition] = useState(profileData.position);
  
  // Profile form state
  const [profileState, profileAction] = useFormState<ProfileState, FormData>(
    updateLecturerProfile, 
    {}
  );
  
  const { pending: isProfilePending } = useFormStatus();

  // States for images with loading and error handling
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(true);
  
  const [nationalIdUrl, setNationalIdUrl] = useState<string | null>(null);
  const [nationalIdLoading, setNationalIdLoading] = useState(true);
  
  const [academicCertificatesUrl, setAcademicCertificatesUrl] = useState<string | null>(null);
  const [academicCertificatesLoading, setAcademicCertificatesLoading] = useState(true);
  
  const [employmentDocumentsUrl, setEmploymentDocumentsUrl] = useState<string | null>(null);
  const [employmentDocumentsLoading, setEmploymentDocumentsLoading] = useState(true);

  // Reset form when editing is toggled
  useEffect(() => {
    if (!isEditing) {
      setFirstName(profileData.firstName);
      setLastName(profileData.lastName);
      setPosition(profileData.position);
    }
  }, [isEditing, profileData]);

  // Fetch all images using the consistent pattern
  useEffect(() => {
    const fetchImages = async () => {
      try {
        // Fetch passport photo
        const passportUrl = await getClientImageUrl(profileData.id, 'lecturer-passport');
        setAvatarUrl(passportUrl || profileData.passportPhotoUrl || null);
        
        // Fetch national ID photo
        const nationalIdUrl = await getClientImageUrl(profileData.id, 'staff-national-id');
        setNationalIdUrl(nationalIdUrl || profileData.nationalIdPhotoUrl || null);
        
        // Fetch academic certificates
        const academicUrl = await getClientImageUrl(profileData.id, 'staff-academic-certificates');
        setAcademicCertificatesUrl(academicUrl || profileData.academicCertificatesUrl || null);
        
        // Fetch employment documents
        const employmentUrl = await getClientImageUrl(profileData.id, 'staff-academic-certificates');
        setEmploymentDocumentsUrl(employmentUrl || profileData.employmentDocumentsUrl || null);
        
      } catch (error) {
        console.error("Error fetching profile images:", error);
        // Fallback to URLs from profileData
        setAvatarUrl(profileData.passportPhotoUrl || null);
        setNationalIdUrl(profileData.nationalIdPhotoUrl || null);
        setAcademicCertificatesUrl(profileData.academicCertificatesUrl || null);
        setEmploymentDocumentsUrl(profileData.employmentDocumentsUrl || null);
      } finally {
        setAvatarLoading(false);
        setNationalIdLoading(false);
        setAcademicCertificatesLoading(false);
        setEmploymentDocumentsLoading(false);
      }
    };

    if (profileData?.id) {
      fetchImages();
    }
  }, [profileData]);

  const handleFileUpload = async (fileType: 'passport' | 'nationalId' | 'academic' | 'employment', file: File) => {
    try {
      // Set loading state for the specific image type
      if (fileType === 'passport') setAvatarLoading(true);
      if (fileType === 'nationalId') setNationalIdLoading(true);
      if (fileType === 'academic') setAcademicCertificatesLoading(true);
      if (fileType === 'employment') setEmploymentDocumentsLoading(true);
      
      const result = await updateLecturerProfilePhoto(fileType, file);
      
      if (result.success && result.fileUrl) {
        // Update the specific image URL
        switch (fileType) {
          case 'passport':
            setAvatarUrl(result.fileUrl);
            break;
          case 'nationalId':
            setNationalIdUrl(result.fileUrl);
            break;
          case 'academic':
            setAcademicCertificatesUrl(result.fileUrl);
            break;
          case 'employment':
            setEmploymentDocumentsUrl(result.fileUrl);
            break;
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      // Reset loading state for the specific image type
      if (fileType === 'passport') setAvatarLoading(false);
      if (fileType === 'nationalId') setNationalIdLoading(false);
      if (fileType === 'academic') setAcademicCertificatesLoading(false);
      if (fileType === 'employment') setEmploymentDocumentsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
              {avatarLoading ? (
                <Skeleton className="w-full h-full rounded-full" />
              ) : avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile photo"
                  fill
                  className="object-cover"
                  onLoad={() => setAvatarLoading(false)}
                  onError={() => {
                    console.error("Profile image failed to load");
                    setAvatarLoading(false);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <FiUser className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* File upload for passport photo */}
            <div className="mb-4">
              <label className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center cursor-pointer">
                <FiCamera className="mr-1" /> Change Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload('passport', file);
                    }
                  }}
                  className="hidden"
                />
              </label>
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
            <input type="hidden" name="id" value={profileData.id} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                {isEditing ? (
                  <input
                    name="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
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
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
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
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
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
                    onClick={() => setIsEditing(false)}
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FiFileText className="mr-2" /> Manage Documents
            </h3>
            <button
              onClick={() => setIsEditingDocuments(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Passport Photo */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Passport Photo</label>
              <div className="relative w-full h-48 border border-gray-300 rounded-md overflow-hidden bg-gray-100">
                {avatarLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Passport photo"
                    fill
                    className="object-contain"
                    onLoad={() => setAvatarLoading(false)}
                    onError={() => setAvatarLoading(false)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <FiCamera className="w-8 h-8 mb-2" />
                    <span className="text-sm">No passport photo</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload('passport', file);
                  }
                }}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* National ID Photo */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">National ID Photo</label>
              <div className="relative w-full h-48 border border-gray-300 rounded-md overflow-hidden bg-gray-100">
                {nationalIdLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : nationalIdUrl ? (
                  <Image
                    src={nationalIdUrl}
                    alt="National ID photo"
                    fill
                    className="object-contain"
                    onLoad={() => setNationalIdLoading(false)}
                    onError={() => setNationalIdLoading(false)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <FiCamera className="w-8 h-8 mb-2" />
                    <span className="text-sm">No national ID photo</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload('nationalId', file);
                  }
                }}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Academic Certificates */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Academic Certificates</label>
              <div className="relative w-full h-48 border border-gray-300 rounded-md overflow-hidden bg-gray-100">
                {academicCertificatesLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : academicCertificatesUrl ? (
                  <Image
                    src={academicCertificatesUrl}
                    alt="Academic certificates"
                    fill
                    className="object-contain"
                    onLoad={() => setAcademicCertificatesLoading(false)}
                    onError={() => setAcademicCertificatesLoading(false)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <FiFileText className="w-8 h-8 mb-2" />
                    <span className="text-sm">No academic certificates</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload('academic', file);
                  }
                }}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Employment Documents */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Employment Documents</label>
              <div className="relative w-full h-48 border border-gray-300 rounded-md overflow-hidden bg-gray-100">
                {employmentDocumentsLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : employmentDocumentsUrl ? (
                  <Image
                    src={employmentDocumentsUrl}
                    alt="Employment documents"
                    fill
                    className="object-contain"
                    onLoad={() => setEmploymentDocumentsLoading(false)}
                    onError={() => setEmploymentDocumentsLoading(false)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <FiFileText className="w-8 h-8 mb-2" />
                    <span className="text-sm">No employment documents</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload('employment', file);
                  }
                }}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}