// app/dashboard/admin/students/page.tsx
import DocumentsClient from '@/components/admin/document-generation.client';
import ErrorMessage from '@/components/ui/error-message';

export default async function AdminStudentsPage() {
  try {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Main Students Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <DocumentsClient />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering AdminStudentsPage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load students"
          message="There was an error loading student data. Please try again later."
        />
      </div>
    );
  }
}