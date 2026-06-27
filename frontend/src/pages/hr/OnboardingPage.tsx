import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { mockOnboardingTasks } from '../../data/mockData';
import type { OnboardingStatus } from '../../types';

const statusIcon: Record<OnboardingStatus, typeof CheckCircle2> = {
  done: CheckCircle2,
  in_progress: Clock,
  pending: Circle,
};

const statusColor: Record<OnboardingStatus, string> = {
  done: 'text-green-400',
  in_progress: 'text-amber-400',
  pending: 'text-slate-500',
};

export function OnboardingPage() {
  const grouped = mockOnboardingTasks.reduce(
    (acc, task) => {
      if (!acc[task.candidateName]) acc[task.candidateName] = [];
      acc[task.candidateName].push(task);
      return acc;
    },
    {} as Record<string, typeof mockOnboardingTasks>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Auto-Onboarding</h1>
        <p className="mt-1 text-slate-500">
          Tasks triggered automatically when a candidate is marked Hired
        </p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-slate-500">No onboarding flows active</p>
      ) : (
        Object.entries(grouped).map(([name, tasks]) => (
          <section
            key={name}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
          >
            <h2 className="mb-4 font-semibold text-slate-200">{name}</h2>
            <ul className="space-y-3">
              {tasks.map((task) => {
                const Icon = statusIcon[task.status];
                return (
                  <li key={task.id} className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${statusColor[task.status]}`} />
                    <div>
                      <p className="text-sm text-slate-300">{task.title}</p>
                      <p className="text-xs text-slate-500">
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
