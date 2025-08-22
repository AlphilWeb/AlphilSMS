// 'use client';

// import { useState, useEffect } from 'react';
// import {
//   createStaffWithUser,
//   createStudentWithUser,
//   updateStaff,
//   updateStudent,
//   deleteStaff,
//   deleteStudent,
//   getStaffList,
//   getStudentList,
//   getStaffById,
//   getStudentById,
//   type CreateStaffInput,
//   type CreateStudentInput,
// } from '@/lib/actions/admin/users.actions';
// import { useForm } from 'react-hook-form';

// import {
//   Button,
//   Modal,
//   Table,
//   Form,
//   Input,
//   Select,
//   Upload,
//   message,
//   Card,
//   Divider,
//   Avatar,
//   Space,
// } from 'antd';
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   UserOutlined,
//   SolutionOutlined,
//   TeamOutlined,
// } from '@ant-design/icons';
// import type { UploadFile, UploadProps } from 'antd';
// import CreateStaffModal from '../Modals/staff.client.update';
// import CreateStudentModal from '../Modals/staff.client.update';
// import UserManagementModal from '../Modals/staff.client.update';

// type Staff = {
//   id: number;
//   userId: number;
//   departmentId: number;
//   firstName: string;
//   lastName: string;
//   email: string;
//   idNumber?: string | null;
//   position: string;
//   passportPhotoUrl?: string | null;
//   nationalIdPhotoUrl?: string | null;
//   academicCertificatesUrl?: string | null;
//   employmentDocumentsUrl?: string | null;
//   department?: {
//     id: number;
//     name: string;
//   };
//   user?: {
//     id: number;
//     roleId: number;
//   };
// };

// type Student = {
//   id: number;
//   userId: number;
//   programId: number;
//   departmentId: number;
//   currentSemesterId: number;
//   firstName: string;
//   lastName: string;
//   email: string;
//   idNumber?: string | null;
//   registrationNumber: string;
//   studentNumber: string;
//   passportPhotoUrl?: string | null;
//   idPhotoUrl?: string | null;
//   certificateUrl?: string | null;
//   program?: {
//     id: number;
//     name: string;
//   };
//   department?: {
//     id: number;
//     name: string;
//   };
//   currentSemester?: {
//     id: number;
//     name: string;
//   };
//   user?: {
//     id: number;
//     roleId: number;
//   };
// };


// type UserManagementProps = {
//   departments: { id: number; name: string }[];
//   programs: { id: number; name: string }[];
//   semesters: { id: number; name: string }[];
//   roles: { id: number; name: string }[];
// };

// export default function UserManagement({
//   departments,
//   programs,
//   semesters,
//   roles,
// }: UserManagementProps) {
//   const [activeTab, setActiveTab] = useState<'staff' | 'students'>('staff');
//   const [staffData, setStaffData] = useState<Staff[]>([]);
//   const [studentData, setStudentData] = useState<Student[]>([]);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
//   const [currentItem, setCurrentItem] = useState<Staff | Student | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
// const [fileList, setFileList] = useState<UploadFile[]>([]);
//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);


//   // Form hooks
//   const staffForm = useForm<CreateStaffInput>({
//     // resolver: zodResolver(staffSchema),
//   });
//   const studentForm = useForm<CreateStudentInput>({
//     // resolver: zodResolver(studentSchema),
//   });

//   // Fetch data
//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     setIsLoading(true);
//     try {
//       const staff = await getStaffList();
//       const students = await getStudentList();
//       setStaffData(staff);
//       setStudentData(students);
//     } catch (_error) {
//       console.log('Failed to fetch data:', _error);
//       message.error('Failed to fetch data');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle file upload
//   const handleUpload: UploadProps['onChange'] = ({ fileList: newFileList }) => {
//     setFileList(newFileList);
//   };

//   // Modal handlers
//   const handleCreateSuccess = () => {
//     fetchData();
//   };

// const showEditModal = async (id: number) => {
//   setIsLoading(true);
//   try {
//     if (activeTab === 'staff') {
//       const staff = await getStaffById(id);
//       if (staff) {
//         setCurrentItem(staff);
//         staffForm.reset({
//           ...staff,
//           roleId: staff.user?.roleId,
//         });
//       }
//     } else {
//       const student = await getStudentById(id);
//       if (student) {
//         setCurrentItem(student);
//         studentForm.reset({
//           ...student,
//           roleId: student.user?.roleId,
//         });
//       }
//     }
//     setIsModalVisible(true);
//   } catch (_error) {
//     console.error('Failed to load data:', _error);
//     message.error('Failed to load data');
//   } finally {
//     setIsLoading(false);
//   }
// };

// const showDeleteModal = (item: Staff | Student) => {
//   setCurrentItem(item);
//   setIsDeleteModalVisible(true);
// };

//   const handleCancel = () => {
//     setIsModalVisible(false);
//     setCurrentItem(null);
//   };

//   const handleDeleteCancel = () => {
//     setIsDeleteModalVisible(false);
//     setCurrentItem(null);
//   };

//   // Form submit handlers
// const handleStaffSubmit = async (values: CreateStaffInput) => {
//   setIsLoading(true);
//   try {
//     const formData = new FormData();
//     Object.entries(values).forEach(([key, value]) => {
//       if (value !== undefined && value !== null) {
//         if (typeof value === 'object' && value instanceof File) {
//           formData.append(key, value);
//         } else {
//           formData.append(key, String(value));
//         }
//       }
//     });

//     fileList.forEach(file => {
//       if (file.originFileObj) {
//         formData.append('passportPhoto', file.originFileObj);
//       }
//     });

//     if (currentItem) {
//       await updateStaff(currentItem.id, values);
//       message.success('Staff updated successfully');
//     } else {
//       await createStaffWithUser(values);
//       message.success('Staff created successfully');
//     }
//     fetchData();
//     setIsModalVisible(false);
//   } catch (_error) {
//     console.error('Operation failed:', _error);
//     message.error('Operation failed');
//   } finally {
//     setIsLoading(false);
//   }
// };

// const handleStudentSubmit = async (values: CreateStudentInput) => {
//   setIsLoading(true);
//   try {
//     const formData = new FormData();
//     Object.entries(values).forEach(([key, value]) => {
//       if (value !== undefined && value !== null) {
//         if (typeof value === 'object' && value instanceof File) {
//           formData.append(key, value);
//         } else {
//           formData.append(key, String(value));
//         }
//       }
//     });

//     // Append files - specify the field name directly since we know it
//     fileList.forEach(file => {
//       if (file.originFileObj) {
//         formData.append('passportPhoto', file.originFileObj); // Changed from file.field
//       }
//     });

//     if (currentItem) {
//       await updateStudent(currentItem.id, values);
//       message.success('Student updated successfully');
//     } else {
//       await createStudentWithUser(values);
//       message.success('Student created successfully');
//     }
//     fetchData();
//     setIsModalVisible(false);
//   } catch (_error) {
//     message.error('Operation failed');
//     console.error('Operation failed:', _error);
//   } finally {
//     setIsLoading(false);
//   }
// };

// const handleDelete = async () => {
//   if (!currentItem) return;
  
//   setIsLoading(true);
//   try {
//     if (activeTab === 'staff') {
//       await deleteStaff(currentItem.id);
//       message.success('Staff deleted successfully');
//     } else {
//       await deleteStudent(currentItem.id);
//       message.success('Student deleted successfully');
//     }
//     fetchData();
//     setIsDeleteModalVisible(false);
//   } catch (_error) {
//     console.error('Delete failed:', _error);
//     message.error('Delete failed');
//   } finally {
//     setIsLoading(false);
//   }
// };

//   // Table columns
// const staffColumns = [
//   {
//     title: 'Photo',
//     dataIndex: 'passportPhotoUrl',
//     key: 'photo',
//     render: (url?: string) => (
//       <Avatar src={url} icon={<UserOutlined />} size="large" />
//     ),
//   },
//   {
//     title: 'Name',
//     key: 'name',
//     render: (record: Staff) => `${record.firstName} ${record.lastName}`,
//   },
//   {
//     title: 'Email',
//     dataIndex: 'email',
//     key: 'email',
//   },
//   {
//     title: 'Department',
//     key: 'department',
//     render: (record: Staff) => record.department?.name || 'N/A',
//   },
//   {
//     title: 'Position',
//     dataIndex: 'position',
//     key: 'position',
//   },
//   {
//     title: 'Actions',
//     key: 'actions',
//     render: (record: Staff) => (
//       <Space size="middle">
//         <Button
//           type="text"
//           icon={<EditOutlined />}
//           onClick={() => showEditModal(record.id)}
//           className="text-blue-500 hover:text-blue-700"
//         />
//         <Button
//           type="text"
//           icon={<DeleteOutlined />}
//           onClick={() => showDeleteModal(record)}
//           className="text-pink-500 hover:text-pink-700"
//         />
//       </Space>
//     ),
//   },
// ];

// const studentColumns = [
//   {
//     title: 'Photo',
//     dataIndex: 'passportPhotoUrl',
//     key: 'photo',
//     render: (url?: string) => (
//       <Avatar src={url} icon={<UserOutlined />} size="large" />
//     ),
//   },
//   {
//     title: 'Name',
//     key: 'name',
//     render: (record: Student) => `${record.firstName} ${record.lastName}`,
//   },
//   {
//     title: 'Student Number',
//     dataIndex: 'studentNumber',
//     key: 'studentNumber',
//   },
//   {
//     title: 'Program',
//     key: 'program',
//     render: (record: Student) => record.program?.name || 'N/A',
//   },
//   {
//     title: 'Semester',
//     key: 'semester',
//     render: (record: Student) => record.currentSemester?.name || 'N/A',
//   },
//   {
//     title: 'Actions',
//     key: 'actions',
//     render: (record: Student) => (
//       <Space size="middle">
//         <Button
//           type="text"
//           icon={<EditOutlined />}
//           onClick={() => showEditModal(record.id)}
//           className="text-blue-500 hover:text-blue-700"
//         />
//         <Button
//           type="text"
//           icon={<DeleteOutlined />}
//           onClick={() => showDeleteModal(record)}
//           className="text-pink-500 hover:text-pink-700"
//         />
//       </Space>
//     ),
//   },
// ];

//   return (
//     <div className="p-6">
//       <Card
//         title={
//           <div className="flex items-center justify-between">
//             <div className="flex items-center">
//               <TeamOutlined className="mr-2 text-emerald-600" />
//               <span className="text-xl font-semibold">User Management</span>
//             </div>
//       <Button
//         type="primary"
//         icon={<PlusOutlined />}
//         onClick={() => setIsCreateModalOpen(true)}
//         className="bg-emerald-600 hover:bg-emerald-700"
//       >
//         Add {activeTab === 'staff' ? 'Staff' : 'Student'}
//       </Button>
//           </div>
//         }
//         bordered={false}
//       >
//         <div className="mb-6">
//           <div className="flex border-b">
//             <button
//               className={`px-4 py-2 font-medium ${
//                 activeTab === 'staff'
//                   ? 'text-emerald-600 border-b-2 border-emerald-600'
//                   : 'text-gray-500'
//               }`}
//               onClick={() => setActiveTab('staff')}
//             >
//               <SolutionOutlined className="mr-2" />
//               Staff Members
//             </button>
//             <button
//               className={`px-4 py-2 font-medium ${
//                 activeTab === 'students'
//                   ? 'text-emerald-600 border-b-2 border-emerald-600'
//                   : 'text-gray-500'
//               }`}
//               onClick={() => setActiveTab('students')}
//             >
//               <UserOutlined className="mr-2" />
//               Students
//             </button>
//           </div>
//         </div>

// <UserManagementModal
//   open={isCreateModalOpen}
//   onCancel={() => setIsCreateModalOpen(false)}
//   onSuccess={handleCreateSuccess}
//   type={activeTab === 'students' ? 'student' : 'staff'}
//   departments={departments}
//   programs={programs}
//   semesters={semesters}
//   roles={roles}
// />

// {activeTab === 'staff' ? (
//   <Table<Staff>
//     columns={staffColumns}
//     dataSource={staffData}
//     rowKey="id"
//     loading={isLoading}
//     pagination={{ pageSize: 10 }}
//   />
// ) : (
//   <Table<Student>
//     columns={studentColumns}
//     dataSource={studentData}
//     rowKey="id"
//     loading={isLoading}
//     pagination={{ pageSize: 10 }}
//   />
// )}

//       </Card>

//       {/* Create/Edit Modal */}
//       <Modal
//         title={`${currentItem ? 'Edit' : 'Create'} ${
//           activeTab === 'staff' ? 'Staff' : 'Student'
//         }`}
//         open={isModalVisible}
//         onCancel={handleCancel}
//         footer={null}
//         width={800}
//         centered
//         className="backdrop-blur-sm"
//       >
//         {activeTab === 'staff' ? (
//           <Form
//             layout="vertical"
//             onFinish={staffForm.handleSubmit(handleStaffSubmit)}
//             initialValues={currentItem || {}}
//           >
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <Form.Item
//                 label="First Name"
//                 name="firstName"
//                 rules={[{ required: true, message: 'Please input first name!' }]}
//               >
//                 <Input />
//               </Form.Item>
//               <Form.Item
//                 label="Last Name"
//                 name="lastName"
//                 rules={[{ required: true, message: 'Please input last name!' }]}
//               >
//                 <Input />
//               </Form.Item>
//               <Form.Item
//                 label="Email"
//                 name="email"
//                 rules={[{ required: true, message: 'Please input email!' }]}
//               >
//                 <Input type="email" />
//               </Form.Item>
//               {!currentItem && (
//                 <Form.Item
//                   label="Password"
//                   name="password"
//                   rules={[
//                     { required: true, message: 'Please input password!' },
//                     { min: 8, message: 'Password must be at least 8 characters' },
//                   ]}
//                 >
//                   <Input.Password />
//                 </Form.Item>
//               )}
//               <Form.Item
//                 label="ID Number"
//                 name="idNumber"
//               >
//                 <Input />
//               </Form.Item>
//               <Form.Item
//                 label="Department"
//                 name="departmentId"
//                 rules={[{ required: true, message: 'Please select department!' }]}
//               >
//                 <Select>
//                   {departments.map(dept => (
//                     <Select.Option key={dept.id} value={dept.id}>
//                       {dept.name}
//                     </Select.Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//               <Form.Item
//                 label="Position"
//                 name="position"
//                 rules={[{ required: true, message: 'Please input position!' }]}
//               >
//                 <Input />
//               </Form.Item>
//               <Form.Item
//                 label="Role"
//                 name="roleId"
//                 rules={[{ required: true, message: 'Please select role!' }]}
//               >
//                 <Select>
//                   {roles.map(role => (
//                     <Select.Option key={role.id} value={role.id}>
//                       {role.name}
//                     </Select.Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </div>

//             <Divider orientation="left" className="text-emerald-600">
//               Documents
//             </Divider>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <Form.Item label="Passport Photo" name="passportPhoto">
//                 <Upload
//                   listType="picture-card"
//                   fileList={fileList}
//                   onChange={handleUpload}
//                   beforeUpload={() => false}
//                   accept="image/*"
//                 >
//                   {fileList.length < 1 && '+ Upload'}
//                 </Upload>
//               </Form.Item>
//               <Form.Item label="National ID" name="nationalIdPhoto">
//                 <Upload
//                   listType="picture-card"
//                   fileList={fileList}
//                   onChange={handleUpload}
//                   beforeUpload={() => false}
//                   accept="image/*,.pdf"
//                 >
//                   {fileList.length < 1 && '+ Upload'}
//                 </Upload>
//               </Form.Item>
//             </div>

//             <div className="flex justify-end gap-4 mt-6">
//               <Button onClick={handleCancel}>Cancel</Button>
//               <Button
//                 type="primary"
//                 htmlType="submit"
//                 loading={isLoading}
//                 className="bg-emerald-600 hover:bg-emerald-700"
//               >
//                 {currentItem ? 'Update' : 'Create'}
//               </Button>
//             </div>
//           </Form>
//         ) : (
//           <Form
//             layout="vertical"
//             onFinish={studentForm.handleSubmit(handleStudentSubmit)}
//             initialValues={currentItem || {}}
//           >
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <Form.Item
//                 label="First Name"
//                 name="firstName"
//                 rules={[{ required: true, message: 'Please input first name!' }]}
//               >
//                 <Input />
//               </Form.Item>
//               <Form.Item
//                 label="Last Name"
//                 name="lastName"
//                 rules={[{ required: true, message: 'Please input last name!' }]}
//               >
//                 <Input />
//               </Form.Item>
//               <Form.Item
//                 label="Email"
//                 name="email"
//                 rules={[{ required: true, message: 'Please input email!' }]}
//               >
//                 <Input type="email" />
//               </Form.Item>
//               {!currentItem && (
//                 <Form.Item
//                   label="Password"
//                   name="password"
//                   rules={[
//                     { required: true, message: 'Please input password!' },
//                     { min: 8, message: 'Password must be at least 8 characters' },
//                   ]}
//                 >
//                   <Input.Password />
//                 </Form.Item>
//               )}
//               <Form.Item
//                 label="ID Number"
//                 name="idNumber"
//               >
//                 <Input />
//               </Form.Item>
//               <Form.Item
//                 label="Registration Number"
//                 name="registrationNumber"
//                 rules={[
//                   { required: true, message: 'Please input registration number!' },
//                 ]}
//               >
//                 <Input />
//               </Form.Item>
//               <Form.Item
//                 label="Student Number"
//                 name="studentNumber"
//                 rules={[
//                   { required: true, message: 'Please input student number!' },
//                 ]}
//               >
//                 <Input />
//               </Form.Item>
//               <Form.Item
//                 label="Program"
//                 name="programId"
//                 rules={[{ required: true, message: 'Please select program!' }]}
//               >
//                 <Select>
//                   {programs.map(program => (
//                     <Select.Option key={program.id} value={program.id}>
//                       {program.name}
//                     </Select.Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//               <Form.Item
//                 label="Department"
//                 name="departmentId"
//                 rules={[{ required: true, message: 'Please select department!' }]}
//               >
//                 <Select>
//                   {departments.map(dept => (
//                     <Select.Option key={dept.id} value={dept.id}>
//                       {dept.name}
//                     </Select.Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//               <Form.Item
//                 label="Current Semester"
//                 name="currentSemesterId"
//                 rules={[
//                   { required: true, message: 'Please select current semester!' },
//                 ]}
//               >
//                 <Select>
//                   {semesters.map(semester => (
//                     <Select.Option key={semester.id} value={semester.id}>
//                       {semester.name}
//                     </Select.Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//               <Form.Item
//                 label="Role"
//                 name="roleId"
//                 rules={[{ required: true, message: 'Please select role!' }]}
//               >
//                 <Select>
//                   {roles.map(role => (
//                     <Select.Option key={role.id} value={role.id}>
//                       {role.name}
//                     </Select.Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </div>

//             <Divider orientation="left" className="text-emerald-600">
//               Documents
//             </Divider>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <Form.Item label="Passport Photo" name="passportPhoto">
//                 <Upload
//                   listType="picture-card"
//                   fileList={fileList}
//                   onChange={handleUpload}
//                   beforeUpload={() => false}
//                   accept="image/*"
//                 >
//                   {fileList.length < 1 && '+ Upload'}
//                 </Upload>
//               </Form.Item>
//               <Form.Item label="ID Photo" name="idPhoto">
//                 <Upload
//                   listType="picture-card"
//                   fileList={fileList}
//                   onChange={handleUpload}
//                   beforeUpload={() => false}
//                   accept="image/*,.pdf"
//                 >
//                   {fileList.length < 1 && '+ Upload'}
//                 </Upload>
//               </Form.Item>
//             </div>

//             <div className="flex justify-end gap-4 mt-6">
//               <Button onClick={handleCancel}>Cancel</Button>
//               <Button
//                 type="primary"
//                 htmlType="submit"
//                 loading={isLoading}
//                 className="bg-emerald-600 hover:bg-emerald-700"
//               >
//                 {currentItem ? 'Update' : 'Create'}
//               </Button>
//             </div>
//           </Form>
//         )}
//       </Modal>

//       {/* Delete Confirmation Modal */}
//       <Modal
//         title={`Delete ${activeTab === 'staff' ? 'Staff' : 'Student'}`}
//         open={isDeleteModalVisible}
//         onCancel={handleDeleteCancel}
//         footer={[
//           <Button key="cancel" onClick={handleDeleteCancel}>
//             Cancel
//           </Button>,
//           <Button
//             key="delete"
//             danger
//             onClick={handleDelete}
//             loading={isLoading}
//             className="bg-pink-500 hover:bg-pink-600"
//           >
//             Delete
//           </Button>,
//         ]}
//         centered
//         className="backdrop-blur-sm"
//       >
//         <p>
//           Are you sure you want to delete{' '}
//           {currentItem
//             ? `${currentItem.firstName} ${currentItem.lastName}`
//             : 'this record'}
//           ? This action cannot be undone.
//         </p>
//       </Modal>
//     </div>
//   );
// }