// app/dashboard/student/layout.tsx
import StudentDashboardHeader from '@/components/studentDashboardHeader';
import Footer from '@/components/footer';

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StudentDashboardHeader />
      <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {children}
          <Footer />
        </div>
      </main>
    </>
  );
}