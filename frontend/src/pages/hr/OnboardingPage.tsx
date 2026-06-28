import { CheckCircle2, Circle, Clock, ClipboardList, Loader2 } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { useOnboardingTasks, useUpdateOnboardingTaskStatus } from '../../hooks/useHireForce';
import type { OnboardingStatus } from '../../types';

const statusIcon: Record<OnboardingStatus, typeof CheckCircle2> = {
  done: CheckCircle2,
  in_progress: Clock,
  pending: Circle,
};

const statusColor: Record<OnboardingStatus, string> = {
  done: 'text-white',
  in_progress: 'text-white/70',
  pending: 'text-white/35',
};

export function OnboardingPage() {
  const { data: onboardingTasks = [], isLoading, isRefreshing, error, refetch } = useOnboardingTasks();
  const updateStatus = useUpdateOnboardingTaskStatus();

  const grouped = onboardingTasks.reduce<Record<string, typeof onboardingTasks>>((acc, task) => {
    const key = task.candidateApplicationId || task.candidateId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  const changeStatus = async (taskId: string, status: OnboardingStatus) => {
    await updateStatus.mutateAsync({ id: taskId, status });
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/50">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Auto-Onboarding</h1>
        <p className="mt-1 text-white/50">Tasks created automatically when a candidate is marked Hired</p>
      </div>
      {error && (
        <div className="rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm text-white">
          {error instanceof Error ? error.message : 'Could not load onboarding tasks.'}
        </div>
      )}
      {Object.keys(grouped).length === 0 && !error ? (
        <EmptyState icon={ClipboardList} title="No onboarding flows yet" description="Mark a candidate as Hired and their onboarding checklist will appear here." />
      ) : (
        Object.entries(grouped).map(([applicationId, tasks]) => {
          const firstTask = tasks[0];
          const doneCount = tasks.filter((task) => task.status === 'done').length;
          return (
            <section key={applicationId} className="panel p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-white">{firstTask.candidateName}</h2>
                  <p className="text-sm text-white/50">{firstTask.jobTitle} onboarding</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/35">Application {applicationId}</p>
                </div>
                <span className="badge">{doneCount}/{tasks.length} done</span>
              </div>
              <ul className="space-y-3">
                {tasks.map((task) => {
                  const Icon = statusIcon[task.status];
                  return (
                    <li key={task.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${statusColor[task.status]}`} />
                        <div>
                          <p className={`text-sm ${task.status === 'done' ? 'text-white/45 line-through' : 'text-white/80'}`}>{task.title}</p>
                          <p className="text-xs text-white/40">
                            {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : `Triggered ${new Date(task.triggeredAt).toLocaleDateString()}`} - {task.status.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <select
                        value={task.status}
                        disabled={updateStatus.isPending || isRefreshing}
                        onChange={(event) => void changeStatus(task.id, event.target.value as OnboardingStatus)}
                        className="rounded-md border border-white/20 bg-black px-3 py-2 text-xs text-white"
                      >
                        <option value="pending">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
