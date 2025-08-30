// app/dashboard/admin/layout.tsx
import AdminDashboardHeader from "@/components/adminDashboardHeader";
import Footer from "@/components/footer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>

      <AdminDashboardHeader />

      <main className="md:pl-64 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800">
        {/* Sticky header section from your original page. It's part of the persistent layout. */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        {children}

        <Footer />
      </main>
    </>
  );
}