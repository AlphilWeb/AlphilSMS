import LecturerDashboardHeader from '@/components/lecturerDashboardHeader';
import Footer from '@/components/footer';
// import ErrorMessage from '@/components/ui/error-message';

export default function LecturerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LecturerDashboardHeader />
      <main className="md:pl-64 pt-2 h-[calc(100vh-4rem)] overflow-y-auto bg-emerald-800 text-white">

        {children}
        <Footer />
      </main>
    </>
  );
}
