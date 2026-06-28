import { FileText } from 'lucide-react';
import { StageStepper } from '../../components/candidate/StageStepper';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

export function MyApplicationPage() {
  const { user } = useAuth();
  const { candidates } = useData();
  const applications = candidates.filter((c) => user && c.email === user.email);

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">My Applications</h1>
        <p className="mt-1 text-white/50">Track your progress through the hiring pipeline</p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="When you apply to a role, you'll be able to track its progress through the pipeline here."
          action={{ label: 'Browse Jobs', to: '/apply' }}
        />
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application.id} className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-white">{application.roleApplied}</h2>
                  <p className="text-sm text-white/50">
                    Applied {new Date(application.appliedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-5 overflow-x-auto">
                <StageStepper currentStage={application.stage} readonly />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
