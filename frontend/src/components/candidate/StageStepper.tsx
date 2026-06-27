import { Check } from 'lucide-react';
import { PIPELINE_STAGES, STAGE_LABELS, type PipelineStage } from '../../types';

interface StageStepperProps {
  currentStage: PipelineStage;
  onStageChange?: (stage: PipelineStage) => void;
  readonly?: boolean;
}

const ACTIVE_STAGES = PIPELINE_STAGES.filter((s) => s !== 'rejected');

export function StageStepper({ currentStage, onStageChange, readonly }: StageStepperProps) {
  const isRejected = currentStage === 'rejected';
  const stages: PipelineStage[] = isRejected ? [...ACTIVE_STAGES, 'rejected'] : ACTIVE_STAGES;
  const currentIndex = stages.indexOf(currentStage);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {stages.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const isTerminal = stage === 'rejected';

        return (
          <div key={stage} className="flex items-center gap-2">
            <button
              type="button"
              disabled={readonly || isTerminal}
              onClick={() => onStageChange?.(stage)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all ${
                active
                  ? isTerminal
                    ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40'
                    : 'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/40'
                  : done
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-slate-900 text-slate-600 hover:bg-slate-800 hover:text-slate-400'
              } ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  done ? 'bg-indigo-500 text-white' : active ? 'bg-indigo-400 text-white' : 'bg-slate-700'
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {STAGE_LABELS[stage]}
            </button>
            {i < stages.length - 1 && (
              <div className={`h-px w-4 ${done ? 'bg-indigo-500/50' : 'bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
