// src/components/registrar/graduation-list/graduation-candidate-card.tsx
import { Badge } from '@/components/ui/badge';

type Candidate = {
  id: number;
  name: string;
  registrationNumber: string;
  studentNumber: string;
  program: string;
  programCode: string;
  department: string;
  currentSemester: string;
  creditsCompleted: number;
  totalCredits: number;
  completionPercentage: string;
  semestersCompleted: number;
  programDuration: number;
  status: 'pending' | 'approved' | 'completed';
  gpa: string | null;
  cgpa: string | null;
  transcriptGenerated: boolean;
  transcriptUrl: string | null;
};

export function GraduationCandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <div className="border rounded-xl p-4 shadow-sm hover:shadow transition bg-white">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{candidate.name}</h3>
        <Badge
          variant={
            candidate.status === 'completed'
              ? 'success'
              : candidate.status === 'approved'
              ? 'warning'
              : 'default'
          }
        >
          {candidate.status.toUpperCase()}
        </Badge>
      </div>

      <p className="text-sm text-gray-600">{candidate.registrationNumber} • {candidate.programCode}</p>
      <p className="text-sm text-gray-600">Program: {candidate.program} ({candidate.department})</p>
      <p className="text-sm text-gray-600">Credits: {candidate.creditsCompleted}/{candidate.totalCredits} ({candidate.completionPercentage}%)</p>
      <p className="text-sm text-gray-600">Semesters: {candidate.semestersCompleted}/{candidate.programDuration}</p>
      <p className="text-sm text-gray-600">GPA: {candidate.gpa ?? 'N/A'} • CGPA: {candidate.cgpa ?? 'N/A'}</p>
      {candidate.transcriptUrl && (
        <a
          href={candidate.transcriptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 text-sm underline mt-2 inline-block"
        >
          View Transcript
        </a>
      )}
    </div>
  );
}
