// 'use client';

// // import { getAllStaff } from '@/lib/actions/admin/staff.actions';
// import { staffSchemaClient } from '@/lib/actions/test/student.schema';
// import { getStaffForEdit, updateStaff, getAllStaff } from '@/lib/actions/users/staff.edit.actions';
// import { getStaffFormOptions } from '@/lib/actions/users/users.actions';
// import { useEffect, useState, FormEvent } from 'react';
// import type { z } from 'zod';

// type StaffFormData = z.infer<typeof staffSchemaClient>;

// interface Option {
//   id: number;
//   name: string;
// }

// interface StaffWithRelations {
//   id: number;
//   firstName: string;
//   lastName: string;
//   email: string;
//   idNumber: string | null;
//   position: string;
//   departmentId: number;
//   employmentDocumentsUrl: string | null;
//   nationalIdPhotoUrl: string | null;
//   academicCertificatesUrl: string | null;
//   passportPhotoUrl: string | null;
//   department: {
//     id: number;
//     name: string;
//   };
// }

// interface StaffTableData {
//   id: number;
//   firstName: string;
//   lastName: string;
//   email: string;
//   idNumber: string | null;
//   position: string;
//   department: {
//     id: number;
//     name: string;
//   };
//   createdAt: Date;
//   updatedAt: Date;
// }

// export default function StaffManagement() {
//   const [staffData, setStaffData] = useState<StaffTableData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedStaff, setSelectedStaff] = useState<StaffWithRelations | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [options, setOptions] = useState<{ departments: Option[] }>({ departments: [] });
//   const [formData, setFormData] = useState<Partial<StaffFormData>>({});
//   const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
//   const [message, setMessage] = useState<string | null>(null);
//   const [modalLoading, setModalLoading] = useState(false);

//   // Load all staff data for the table
//   useEffect(() => {
//     async function loadStaffData() {
//       try {
//         setLoading(true);
//         const staff = await getAllStaff();
//         setStaffData(staff);
//       } catch (error) {
//         console.error('Error loading staff:', error);
//         setMessage('Failed to load staff data');
//       } finally {
//         setLoading(false);
//       }
//     }
//     loadStaffData();
//   }, []);

//   // Open modal and load specific staff data for editing
//   const openEditModal = async (staffId: number) => {
//     try {
//       setModalLoading(true);
//       const [opts, staffRes] = await Promise.all([
//         getStaffFormOptions(),
//         getStaffForEdit(staffId)
//       ]);

//       setOptions(opts);

//       if (staffRes.success && staffRes.staff) {
//         setSelectedStaff(staffRes.staff);
//         setFormData({
//           departmentId: staffRes.staff.departmentId,
//           firstName: staffRes.staff.firstName,
//           lastName: staffRes.staff.lastName,
//           email: staffRes.staff.email,
//           idNumber: staffRes.staff.idNumber || '',
//           position: staffRes.staff.position,
//         });

//         // Set file previews
//         const previews: Record<string, string> = {};
//         if (staffRes.staff.passportPhotoUrl) previews.passportPhoto = staffRes.staff.passportPhotoUrl;
//         if (staffRes.staff.nationalIdPhotoUrl) previews.nationalIdPhoto = staffRes.staff.nationalIdPhotoUrl;
//         if (staffRes.staff.academicCertificatesUrl) previews.academicCertificates = staffRes.staff.academicCertificatesUrl;
//         if (staffRes.staff.employmentDocumentsUrl) previews.employmentDocuments = staffRes.staff.employmentDocumentsUrl;
//         setFilePreviews(previews);
        
//         setIsModalOpen(true);
//       } else {
//         setMessage(`❌ Error: ${staffRes.error}`);
//       }
//     } catch (error) {
//       console.error('Error opening edit modal:', error);
//       setMessage('Failed to load staff details');
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setSelectedStaff(null);
//     setFormData({});
//     setFilePreviews({});
//   };

//   function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: name.endsWith('Id') ? Number(value) : value,
//     }));
//   }

//   function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const { name, files } = e.target;
//     if (files && files.length > 0) {
//       const file = files[0];
//       setFormData((prev) => ({
//         ...prev,
//         [name]: file,
//       }));

//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setFilePreviews(prev => ({
//           ...prev,
//           [name]: e.target?.result as string
//         }));
//       };
//       reader.readAsDataURL(file);
//     }
//   }

//   function removeFile(fieldName: string) {
//     setFormData(prev => ({ ...prev, [fieldName]: undefined }));
//     setFilePreviews(prev => {
//       const newPreviews = { ...prev };
//       delete newPreviews[fieldName];
//       return newPreviews;
//     });
//   }

//   async function handleSubmit(e: FormEvent) {
//     e.preventDefault();
//     if (!selectedStaff) return;

//     setModalLoading(true);
//     setMessage(null);

//     try {
//       const validated = staffSchemaClient.parse(formData);
      
//       const shouldDeleteFiles = {
//         employmentDocuments: !formData.employmentDocuments && !filePreviews.employmentDocuments,
//         nationalIdPhoto: !formData.nationalIdPhoto && !filePreviews.nationalIdPhoto,
//         academicCertificates: !formData.academicCertificates && !filePreviews.academicCertificates,
//         passportPhoto: !formData.passportPhoto && !filePreviews.passportPhoto,
//       };

//       const res = await updateStaff(selectedStaff.id, { ...validated, shouldDeleteFiles });
      
//       if (res.success && res.staff) {
//         setMessage(`✅ Staff ${res.staff.firstName} ${res.staff.lastName} updated successfully`);
//         // Refresh the table data
//         const updatedStaff = await getAllStaff();
//         setStaffData(updatedStaff);
//         closeModal();
//       } else {
//         setMessage(`❌ Error: ${res.error}`);
//       }
//     } catch (err: any) {
//       setMessage(`❌ Validation Error: ${err.message}`);
//     } finally {
//       setModalLoading(false);
//     }
//   }

//   if (loading) {
//     return <div>Loading staff data...</div>;
//   }

//   return (
//     <div style={{ padding: '20px' }}>
//       <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
//         Staff Management
//       </h2>
      
//       {message && (
//         <div style={{ 
//           marginBottom: '16px', 
//           padding: '10px', 
//           borderRadius: '4px',
//           backgroundColor: message.startsWith('✅') ? '#d4edda' : '#f8d7da',
//           color: message.startsWith('✅') ? '#155724' : '#721c24',
//         }}>
//           {message}
//         </div>
//       )}

//       {/* Staff Table */}
//       <div style={{ overflowX: 'auto' }}>
//         <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
//           <thead>
//             <tr style={{ backgroundColor: '#f5f5f5' }}>
//               <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>First Name</th>
//               <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Last Name</th>
//               <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
//               <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Position</th>
//               <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Department</th>
//               <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {staffData.map((staff) => (
//               <tr key={staff.id}>
//                 <td style={{ padding: '12px', border: '1px solid #ddd' }}>{staff.firstName}</td>
//                 <td style={{ padding: '12px', border: '1px solid #ddd' }}>{staff.lastName}</td>
//                 <td style={{ padding: '12px', border: '1px solid #ddd' }}>{staff.email}</td>
//                 <td style={{ padding: '12px', border: '1px solid #ddd' }}>{staff.position}</td>
//                 <td style={{ padding: '12px', border: '1px solid #ddd' }}>{staff.department.name}</td>
//                 <td style={{ padding: '12px', border: '1px solid #ddd' }}>
//                   <button
//                     onClick={() => openEditModal(staff.id)}
//                     style={{
//                       padding: '6px 12px',
//                       backgroundColor: '#007bff',
//                       color: 'white',
//                       border: 'none',
//                       borderRadius: '4px',
//                       cursor: 'pointer',
//                     }}
//                   >
//                     Edit
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Edit Modal */}
//       {isModalOpen && (
//         <div style={{
//           position: 'fixed',
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           backgroundColor: 'rgba(0, 0, 0, 0.5)',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           zIndex: 1000,
//         }}>
//           <div style={{
//             backgroundColor: 'white',
//             padding: '20px',
//             borderRadius: '8px',
//             maxWidth: '600px',
//             maxHeight: '90vh',
//             overflowY: 'auto',
//             width: '100%',
//           }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//               <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
//                 Edit Staff Member: {selectedStaff?.firstName} {selectedStaff?.lastName}
//               </h3>
//               <button
//                 onClick={closeModal}
//                 style={{
//                   background: 'none',
//                   border: 'none',
//                   fontSize: '20px',
//                   cursor: 'pointer',
//                 }}
//               >
//                 ×
//               </button>
//             </div>

//             {modalLoading && !selectedStaff ? (
//               <div>Loading staff data...</div>
//             ) : (
//               <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
//                 <div style={{ display: 'flex', flexDirection: 'column' }}>
//                   <label style={{ marginBottom: '4px', fontWeight: '500' }}>First Name</label>
//                   <input 
//                     type="text" 
//                     name="firstName" 
//                     value={formData.firstName || ''}
//                     onChange={handleChange} 
//                     required 
//                     style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//                   />
//                 </div>

//                 <div style={{ display: 'flex', flexDirection: 'column' }}>
//                   <label style={{ marginBottom: '4px', fontWeight: '500' }}>Last Name</label>
//                   <input 
//                     type="text" 
//                     name="lastName" 
//                     value={formData.lastName || ''}
//                     onChange={handleChange} 
//                     required 
//                     style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//                   />
//                 </div>

//                 <div style={{ display: 'flex', flexDirection: 'column' }}>
//                   <label style={{ marginBottom: '4px', fontWeight: '500' }}>Email</label>
//                   <input 
//                     type="email" 
//                     name="email" 
//                     value={formData.email || ''}
//                     onChange={handleChange} 
//                     required 
//                     style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//                   />
//                 </div>

//                 <div style={{ display: 'flex', flexDirection: 'column' }}>
//                   <label style={{ marginBottom: '4px', fontWeight: '500' }}>ID Number</label>
//                   <input 
//                     type="text" 
//                     name="idNumber" 
//                     value={formData.idNumber || ''}
//                     onChange={handleChange} 
//                     style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//                   />
//                 </div>

//                 <div style={{ display: 'flex', flexDirection: 'column' }}>
//                   <label style={{ marginBottom: '4px', fontWeight: '500' }}>Position</label>
//                   <input 
//                     type="text" 
//                     name="position" 
//                     value={formData.position || ''}
//                     onChange={handleChange} 
//                     required 
//                     style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//                   />
//                 </div>

//                 <div style={{ display: 'flex', flexDirection: 'column' }}>
//                   <label style={{ marginBottom: '4px', fontWeight: '500' }}>Department</label>
//                   <select 
//                     name="departmentId" 
//                     value={formData.departmentId || ''}
//                     onChange={handleChange} 
//                     required 
//                     style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//                   >
//                     <option value="">Select Department</option>
//                     {options.departments.map((d) => (
//                       <option key={d.id} value={d.id}>{d.name}</option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* File upload sections with previews */}
//                 {['passportPhoto', 'nationalIdPhoto', 'academicCertificates', 'employmentDocuments'].map((field) => (
//                   <div key={field} style={{ display: 'flex', flexDirection: 'column' }}>
//                     <label style={{ marginBottom: '4px', fontWeight: '500' }}>
//                       {field.split(/(?=[A-Z])/).join(' ')}
//                     </label>
                    
//                     {filePreviews[field] && (
//                       <div style={{ marginBottom: '8px' }}>
//                         <img 
//                           src={filePreviews[field]} 
//                           alt={`Current ${field}`} 
//                           style={{ maxWidth: '100px', maxHeight: '100px', marginRight: '10px' }}
//                         />
//                         <button 
//                           type="button" 
//                           onClick={() => removeFile(field)}
//                           style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
//                         >
//                           Remove
//                         </button>
//                       </div>
//                     )}
                    
//                     <input 
//                       type="file" 
//                       name={field}
//                       accept={field.includes('Certificate') || field.includes('Document') ? "image/*,application/pdf" : "image/*"}
//                       onChange={handleFileChange}
//                       style={{ padding: '4px' }}
//                     />
//                   </div>
//                 ))}

//                 <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
//                   <button 
//                     type="button"
//                     onClick={closeModal}
//                     style={{
//                       padding: '10px 16px',
//                       backgroundColor: '#6c757d',
//                       color: 'white',
//                       border: 'none',
//                       borderRadius: '4px',
//                       cursor: 'pointer',
//                       flex: 1,
//                     }}
//                   >
//                     Cancel
//                   </button>
//                   <button 
//                     type="submit" 
//                     disabled={modalLoading}
//                     style={{
//                       padding: '10px 16px',
//                       backgroundColor: modalLoading ? '#6c757d' : '#007bff',
//                       color: 'white',
//                       border: 'none',
//                       borderRadius: '4px',
//                       cursor: modalLoading ? 'not-allowed' : 'pointer',
//                       flex: 1,
//                     }}
//                   >
//                     {modalLoading ? 'Updating...' : 'Update Staff'}
//                   </button>
//                 </div>
//               </form>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }