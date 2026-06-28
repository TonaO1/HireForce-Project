import { Calendar, CheckCircle2, Circle, Clock, FileText, Loader2 } from 'lucide-react';
import { StageStepper } from '../../components/candidate/StageStepper';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useMyApplications, useMyOnboardingTasks } from '../../hooks/useHireForce';
import type { OnboardingStatus } from '../../types';

const onboardingIcon: Record<OnboardingStatus, typeof CheckCircle2> = {
  done: CheckCircle2,
  in_progress: Clock,
  pending: Circle,
};

export function MyApplicationPage() {
  const { user } = useAuth();
  const { data: applications = [], isLoading, error } = useMyApplications(user?.email);
  const { data: onboardingTasks = [], isLoading: onboardingLoading } = useMyOnboardingTasks(user?.email);

  if (isLoading || onboardingLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/50">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">My Applications</h1>
        <p className="mt-1 text-white/50">Track your progress through the hiring pipeline</p>
      </div>
      {error && (
        <div className="rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm text-white">
          {error instanceof Error ? error.message : 'Could not load applications.'}
        </div>
      )}
      {applications.length === 0 && !error ? (
        <EmptyState icon={FileText} title="No applications yet" description="When you apply to a role, you'll be able to track its progress here." action={{ label: 'Browse Jobs', to: '/apply' }} />
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application.id} className="panel p-6">
              <h2 className="font-semibold text-white">{application.roleApplied}</h2>
              <p className="text-sm text-white/50">Applied {new Date(application.appliedAt).toLocaleDateString()}</p>
              <div className="mt-5 overflow-x-auto">
                <StageStepper currentStage={application.stage} readonly />
              </div>
              {application.interviews.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
                    <Calendar className="h-4 w-4" />
                    Interviews
                  </h3>
                  <ul className="space-y-2">
                    {application.interviews.map((interview) => (
                      <li key={interview.id} className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm">
                        <p className="font-medium text-white">{interview.type}</p>
                        <p className="text-white/50">{new Date(interview.scheduledAt).toLocaleString()} with {interview.interviewer}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {onboardingTasks.filter((task) => task.candidateApplicationId === application.id).length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">Onboarding Checklist</h3>
                  <ul className="space-y-2">
                    {onboardingTasks
                      .filter((task) => task.candidateApplicationId === application.id)
                      .map((task) => {
                        const Icon = onboardingIcon[task.status];
                        return (
                          <li key={task.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm">
                            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${task.status === 'done' ? 'text-white' : 'text-white/40'}`} />
                            <div>
                              <p className={task.status === 'done' ? 'text-white/45 line-through' : 'text-white'}>{task.title}</p>
                              <p className="text-xs text-white/40">
                                {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'} - {task.status.replace('_', ' ')}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
