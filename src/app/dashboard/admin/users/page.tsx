// app/dashboard/users/page.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";
import { getUsers } from "@/lib/actions/user.actions";
import { BsPeopleFill } from "react-icons/bs";
import UsersNav from "@/components/userNav";
import UsersClientComponent from "@/components/users/users-client-component";
import { db } from '@/lib/db'; // Import db to fetch roles
// import { roles } from '@/lib/db/schema'; // Import roles schema

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const usersFromDb = await getUsers();
  const rolesFromDb = await db.query.roles.findMany(); // Fetch roles from the database

  // Ensure roleName is string | null and other fields are as expected by UsersClientComponent
  const initialUsers = usersFromDb.map(user => ({
    ...user,
    roleName: user.roleName || null,
    fullName: user.fullName || null,
    photoUrl: user.photoUrl || null,
  }));

  // Map roles to match the Role interface in UsersClientComponent
  const clientRoles = rolesFromDb.map(role => ({
    id: role.id,
    name: role.name,
  }));

  return (
    <>
      <AdminDashboardHeader />

      <main className="pl-[220px] h-screen bg-gradient-to-b from-emerald-950 to-emerald-900 text-white">
        {/* Sticky header section */}
        <div className="sticky top-[58px] z-30 bg-emerald-800 px-12 py-4 flex flex-wrap justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 px-4 py-3 rounded-lg shadow">
              <BsPeopleFill className="w-6 h-6" />
              <span className="font-bold">Total: {initialUsers.length}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <UsersNav />
          </div>
        </div>

        {/* Pass initial data to the Client Component, including roles */}
        <UsersClientComponent initialUsers={initialUsers} roles={clientRoles} /> {/* <--- HERE IS THE CHANGE */}

        <Footer />
      </main>
    </>
  );
}