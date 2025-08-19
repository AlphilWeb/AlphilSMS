// 'use client';

// import { studentSchemaClient } from '@/lib/actions/test/student.schema';
// import { getStudentFormOptions } from '@/lib/actions/test/test.action';
// import { getStudentForEdit, updateStudent } from '@/lib/actions/users/student.edit.actions';
// import { useEffect, useState, FormEvent } from 'react';
// // import { getStudentForEdit, updateStudent, getStudentFormOptions } from '@/lib/actions/student.action';
// import type { z } from 'zod';
// // import { studentSchemaClient } from '@/lib/actions/student.schema';

// type StudentFormData = z.infer<typeof studentSchemaClient>;

// interface Option {
//   id: number;
//   name: string;
//   code?: string;
//   departmentId?: number;
// }

// interface StudentWithRelations {
//   id: number;
//   firstName: string;
//   lastName: string;
//   email: string;
//   idNumber: string | null;
//   registrationNumber: string;
//   studentNumber: string;
//   programId: number;
//   departmentId: number;
//   currentSemesterId: number;
//   passportPhotoUrl: string | null;
//   idPhotoUrl: string | null;
//   certificateUrl: string | null;
//   program: {
//     id: number;
//     name: string;
//     code: string;
//   };
//   department: {
//     id: number;
//     name: string;
//   };
//   currentSemester: {
//     id: number;
//     name: string;
//   };
// }

// export default function EditStudentForm({ studentId }: { studentId: string }) {
//   const [options, setOptions] = useState<{
//     programs: Option[];
//     departments: Option[];
//     semesters: Option[];
//   }>({ programs: [], departments: [], semesters: [] });

//   const [studentData, setStudentData] = useState<StudentWithRelations | null>(null);
//   const [formData, setFormData] = useState<Partial<StudentFormData>>({});
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState<string | null>(null);
//   const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});

//   useEffect(() => {
//     async function loadData() {
//       const numericId = Number(studentId);
//       if (isNaN(numericId)) {
//         setMessage('❌ Invalid student ID');
//         return;
//       }

      
//   console.log('Fetching data for ID:', numericId);
//       const [opts, studentRes] = await Promise.all([
//         getStudentFormOptions(),
//         getStudentForEdit(numericId)
//       ]);

//           console.log('Options:', opts);
//     console.log('Student response:', studentRes);

//       setOptions(opts);

//       if (studentRes.success && studentRes.student) {
//         setStudentData(studentRes.student);
//         setFormData({
//           programId: studentRes.student.programId,
//           departmentId: studentRes.student.departmentId,
//           currentSemesterId: studentRes.student.currentSemesterId,
//           firstName: studentRes.student.firstName,
//           lastName: studentRes.student.lastName,
//           email: studentRes.student.email,
//           idNumber: studentRes.student.idNumber || '',
//           registrationNumber: studentRes.student.registrationNumber,
//           studentNumber: studentRes.student.studentNumber,
//         });

//         // Set file previews
//         const previews: Record<string, string> = {};
//         if (studentRes.student.passportPhotoUrl) previews.passportPhoto = studentRes.student.passportPhotoUrl;
//         if (studentRes.student.idPhotoUrl) previews.idPhoto = studentRes.student.idPhotoUrl;
//         if (studentRes.student.certificateUrl) previews.certificate = studentRes.student.certificateUrl;
//         setFilePreviews(previews);
//       } else {
//         setMessage(`❌ Error: ${studentRes.error}`);
//       }
//     }
//     loadData();
//   }, [studentId]);

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

//       // Create preview for new file
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
//     setLoading(true);
//     setMessage(null);

//     try {
//       const validated = studentSchemaClient.parse(formData);

//      const numericId = Number(studentId);
//       if (isNaN(numericId)) {
//         throw new Error('Invalid student ID');
//       }
      
//       const shouldDeleteFiles = {
//         certificate: !formData.certificate && !filePreviews.certificate,
//         idPhoto: !formData.idPhoto && !filePreviews.idPhoto,
//         passportPhoto: !formData.passportPhoto && !filePreviews.passportPhoto,
//       };

//       const res = await updateStudent(numericId, { ...validated, shouldDeleteFiles });
      
//       if (res.success && res.student) {
//         setMessage(`✅ Student ${res.student.firstName} ${res.student.lastName} updated successfully`);
//       } else {
//         setMessage(`❌ Error: ${res.error}`);
//       }
//     } catch (err: any) {
//       setMessage(`❌ Validation Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }

//   if (!studentData) {
//     return <div>Loading student data...</div>;
//   }

//   return (
//     <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
//       <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
//         Edit Student: {studentData.firstName} {studentData.lastName}
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

//       <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>First Name</label>
//           <input 
//             type="text" 
//             name="firstName" 
//             value={formData.firstName || ''}
//             onChange={handleChange} 
//             required 
//             style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//           />
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>Last Name</label>
//           <input 
//             type="text" 
//             name="lastName" 
//             value={formData.lastName || ''}
//             onChange={handleChange} 
//             required 
//             style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//           />
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>Email</label>
//           <input 
//             type="email" 
//             name="email" 
//             value={formData.email || ''}
//             onChange={handleChange} 
//             required 
//             style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//           />
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>ID Number</label>
//           <input 
//             type="text" 
//             name="idNumber" 
//             value={formData.idNumber || ''}
//             onChange={handleChange} 
//             required 
//             style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//           />
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>Registration Number</label>
//           <input 
//             type="text" 
//             name="registrationNumber" 
//             value={formData.registrationNumber || ''}
//             onChange={handleChange} 
//             required 
//             style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//           />
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>Student Number</label>
//           <input 
//             type="text" 
//             name="studentNumber" 
//             value={formData.studentNumber || ''}
//             onChange={handleChange} 
//             required 
//             style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//           />
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>Department</label>
//           <select 
//             name="departmentId" 
//             value={formData.departmentId || ''}
//             onChange={handleChange} 
//             required 
//             style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//           >
//             <option value="">Select Department</option>
//             {options.departments.map((d) => (
//               <option key={d.id} value={d.id}>{d.name}</option>
//             ))}
//           </select>
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>Program</label>
//           <select 
//             name="programId" 
//             value={formData.programId || ''}
//             onChange={handleChange} 
//             required 
//             style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//           >
//             <option value="">Select Program</option>
//             {options.programs.map((p) => (
//               <option key={p.id} value={p.id}>
//                 {p.code ? `${p.code} - ${p.name}` : p.name}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>Current Semester</label>
//           <select 
//             name="currentSemesterId" 
//             value={formData.currentSemesterId || ''}
//             onChange={handleChange} 
//             required 
//             style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//           >
//             <option value="">Select Semester</option>
//             {options.semesters.map((s) => (
//               <option key={s.id} value={s.id}>{s.name}</option>
//             ))}
//           </select>
//         </div>

//         {/* File upload sections with previews */}
//         {['passportPhoto', 'idPhoto', 'certificate'].map((field) => (
//           <div key={field} style={{ display: 'flex', flexDirection: 'column' }}>
//             <label style={{ marginBottom: '4px', fontWeight: '500' }}>
//               {field.split(/(?=[A-Z])/).join(' ')}
//             </label>
            
//             {filePreviews[field] && (
//               <div style={{ marginBottom: '8px' }}>
//                 <img 
//                   src={filePreviews[field]} 
//                   alt={`Current ${field}`} 
//                   style={{ maxWidth: '100px', maxHeight: '100px', marginRight: '10px' }}
//                 />
//                 <button 
//                   type="button" 
//                   onClick={() => removeFile(field)}
//                   style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
//                 >
//                   Remove
//                 </button>
//               </div>
//             )}
            
//             <input 
//               type="file" 
//               name={field}
//               accept={field === 'certificate' ? "image/*,application/pdf" : "image/*"}
//               onChange={handleFileChange}
//               style={{ padding: '4px' }}
//             />
//           </div>
//         ))}

//         <button 
//           type="submit" 
//           disabled={loading}
//           style={{
//             padding: '10px 16px',
//             backgroundColor: loading ? '#6c757d' : '#007bff',
//             color: 'white',
//             border: 'none',
//             borderRadius: '4px',
//             cursor: loading ? 'not-allowed' : 'pointer',
//           }}
//         >
//           {loading ? 'Updating...' : 'Update Student'}
//         </button>
//       </form>
//     </div>
//   );
// }