// 'use client';

// import { useEffect, useState, FormEvent } from 'react';
// import type { z } from 'zod';
// import { staffSchemaClient } from '@/lib/actions/test/student.schema';
// import { addStaff, getStaffFormOptions } from '@/lib/actions/users/users.actions';

// type StaffFormData = z.infer<typeof staffSchemaClient>;

// interface Option {
//   id: number;
//   name: string;
// }

// export default function StaffForm() {
//   const [options, setOptions] = useState<{
//     departments: Option[];
//   }>({ departments: [] });

//   const [formData, setFormData] = useState<Partial<StaffFormData>>({});
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState<string | null>(null);

//   useEffect(() => {
//     async function loadOptions() {
//       const opts = await getStaffFormOptions();
//       setOptions(opts);
//     }
//     loadOptions();
//   }, []);

//   function handleChange(
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: name.endsWith('Id') ? Number(value) : value,
//     }));
//   }

//   function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const { name, files } = e.target;
//     if (files && files.length > 0) {
//       setFormData((prev) => ({
//         ...prev,
//         [name]: files[0],
//       }));
//     }
//   }

//   async function handleSubmit(e: FormEvent) {
//     e.preventDefault();
//     setLoading(true);
//     setMessage(null);

//     try {
//       // Validate before sending
//       const validated = staffSchemaClient.parse(formData);

//       const res = await addStaff(validated);
//       if (res.success) {
//         if (!res.staff) {
//           throw new Error('Staff data not returned');
//         }
//         setMessage(`✅ Staff ${res.staff.firstName} ${res.staff.lastName} added successfully`);
//         setFormData({});
//         (e.target as HTMLFormElement).reset();
//       } else {
//         setMessage(`❌ Error: ${res.error}`);
//       }
//     } catch (err: any) {
//       setMessage(`❌ Validation Error: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
//       <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
//         Add New Staff Member
//       </h2>
//       {message && (
//         <div style={{ 
//           marginBottom: '16px', 
//           padding: '10px', 
//           borderRadius: '4px',
//           backgroundColor: message.startsWith('✅') ? '#d4edda' : '#f8d7da',
//           color: message.startsWith('✅') ? '#155724' : '#721c24',
//           border: `1px solid ${message.startsWith('✅') ? '#c3e6cb' : '#f5c6cb'}`
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
//             onChange={handleChange} 
//             required 
//             style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//           />
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>ID Number (Optional)</label>
//           <input 
//             type="text" 
//             name="idNumber" 
//             onChange={handleChange} 
//             style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//           />
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>Position</label>
//           <input 
//             type="text" 
//             name="position" 
//             onChange={handleChange} 
//             required 
//             style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
//           />
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>Department</label>
//           <select 
//             name="departmentId" 
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
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>Passport Photo</label>
//           <input 
//             type="file" 
//             name="passportPhoto" 
//             accept="image/*" 
//             onChange={handleFileChange} 
//             style={{ padding: '4px' }}
//           />
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>National ID Photo</label>
//           <input 
//             type="file" 
//             name="nationalIdPhoto" 
//             accept="image/*" 
//             onChange={handleFileChange} 
//             style={{ padding: '4px' }}
//           />
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>Academic Certificates</label>
//           <input 
//             type="file" 
//             name="academicCertificates" 
//             accept="image/*,application/pdf" 
//             onChange={handleFileChange} 
//             style={{ padding: '4px' }}
//           />
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           <label style={{ marginBottom: '4px', fontWeight: '500' }}>Employment Documents</label>
//           <input 
//             type="file" 
//             name="employmentDocuments" 
//             accept="image/*,application/pdf" 
//             onChange={handleFileChange} 
//             style={{ padding: '4px' }}
//           />
//         </div>

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
//             fontWeight: '500'
//           }}
//         >
//           {loading ? 'Submitting...' : 'Add Staff Member'}
//         </button>
//       </form>
//     </div>
//   );
// }

