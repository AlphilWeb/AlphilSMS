// app/dashboard/lecturer/material-views/page.tsx
import { getMaterialViews, getMaterialViewStats } from '@/lib/actions/lecturer.manage.material-views.action';
import LecturerMaterialViewsManager from '@/components/lecturer/lecturer.manage.material-views';
import ErrorMessage from '@/components/ui/error-message';

export default async function LecturerMaterialViewsPage() {
  try {
    // Fetch initial data from the server
    const [initialViews, initialStats] = await Promise.all([
      getMaterialViews(),
      getMaterialViewStats(),
    ]);

    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">Material Views Analytics</h1>
          <p className="text-gray-600">Track student engagement with your course materials</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <LecturerMaterialViewsManager 
            initialViews={initialViews} 
            initialStats={initialStats} 
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering LecturerMaterialViewsPage:', error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage
          title="Failed to load material views"
          message="There was an error loading material view data. Please try again later."
        />
      </div>
    );
  }
}