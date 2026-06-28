import { CheckCircle2, Circle, Clock, ClipboardList } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { useData } from '../../contexts/DataContext';
import type { OnboardingStatus } from '../../types';

const statusIcon: Record<OnboardingStatus, typeof CheckCircle2> = {
  done: CheckCircle2,
  in_progress: Clock,
  pending: Circle,
};

// Monochrome emphasis: brighter = further along.
const statusColor: Record<OnboardingStatus, string> = {
  done: 'text-white',
  in_progress: 'text-white/70',
  pending: 'text-white/35',
};

export function OnboardingPage() {
  const { onboardingTasks } = useData();

  const grouped = onboardingTasks.reduce(
    (acc, task) => {
      if (!acc[task.candidateName]) acc[task.candidateName] = [];
      acc[task.candidateName].push(task);
      return acc;
    },
    {} as Record<string, typeof onboardingTasks>,
  );

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Auto-Onboarding</h1>
        <p className="mt-1 text-white/50">
          Tasks created automatically when a candidate is marked Hired
        </p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No onboarding flows yet"
          description="Mark a candidate as Hired from their profile and their onboarding checklist will appear here automatically."
        />
      ) : (
        Object.entries(grouped).map(([name, tasks]) => (
          <section key={name} className="panel p-6">
            <h2 className="mb-4 font-semibold text-white">{name}</h2>
            <ul className="space-y-3">
              {tasks.map((task) => {
                const Icon = statusIcon[task.status];
                return (
                  <li key={task.id} className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${statusColor[task.status]}`} />
                    <div>
                      <p className="text-sm text-white/80">{task.title}</p>
                      <p className="text-xs text-white/40">
                        Triggered {new Date(task.triggeredAt).toLocaleDateString()} ·{' '}
                        {task.status.replace('_', ' ')}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
