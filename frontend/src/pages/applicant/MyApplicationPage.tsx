import { PIPELINE_STAGES, STAGE_LABELS } from '../../types';

const demoStage = 'interview';
const currentIndex = PIPELINE_STAGES.indexOf(demoStage);

export function MyApplicationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">My Application</h1>
        <p className="mt-1 text-slate-500">Track your progress through the hiring pipeline</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="font-semibold text-slate-200">Senior Frontend Engineer</h2>
        <p className="text-sm text-slate-500">Applied June 10, 2026</p>

        <div className="mt-8 space-y-0">
          {PIPELINE_STAGES.filter((s) => s !== 'rejected').map((stage, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <div key={stage} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      done
                        ? 'bg-green-500 text-white'
                        : active
                          ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/30'
                          : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  {i < 4 && (
                    <div className={`h-10 w-0.5 ${done ? 'bg-green-500/50' : 'bg-slate-700'}`} />
                  )}
                </div>
                <div className="pb-8">
                  <p className={`font-medium ${active ? 'text-indigo-300' : 'text-slate-400'}`}>
                    {STAGE_LABELS[stage]}
                  </p>
                  {active && (
                    <p className="text-sm text-slate-500">You are currently in this stage</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
