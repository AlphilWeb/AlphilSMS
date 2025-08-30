// app/dashboard/bursar/layout.tsx
import BursarDashboardHeader from '@/components/bursar/bursarDashboardHeader';
import Footer from '@/components/footer';

export default function BursarDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BursarDashboardHeader />
      <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {children}
          <Footer />
        </div>
      </main>
    </>
  );
}