import { PIPELINE_STAGES, STAGE_LABELS } from '../../types';

const demoStage = 'interview';
const currentIndex = PIPELINE_STAGES.indexOf(demoStage);

export function MyApplicationPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">My Application</h1>
        <p className="mt-1 text-white/50">Track your progress through the hiring pipeline</p>
      </div>

      <div className="panel p-6">
        <h2 className="font-semibold text-white">Senior Frontend Engineer</h2>
        <p className="text-sm text-white/50">Applied June 10, 2026</p>

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
                        ? 'bg-white text-black'
                        : active
                          ? 'bg-white text-black ring-4 ring-white/20'
                          : 'border border-white/20 bg-black text-white/40'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  {i < 4 && (
                    <div className={`h-10 w-0.5 ${done ? 'bg-white/40' : 'bg-white/15'}`} />
                  )}
                </div>
                <div className="pb-8">
                  <p className={`font-medium ${active ? 'text-white' : 'text-white/50'}`}>
                    {STAGE_LABELS[stage]}
                  </p>
                  {active && (
                    <p className="text-sm text-white/50">You are currently in this stage</p>
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
