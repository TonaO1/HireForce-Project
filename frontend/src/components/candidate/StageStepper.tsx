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
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                active
                  ? 'bg-white text-black ring-1 ring-white'
                  : done
                    ? 'bg-white/10 text-white/80'
                    : 'bg-black text-white/40 hover:bg-white/10 hover:text-white/80'
              } ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  active
                    ? 'bg-black text-white'
                    : done
                      ? 'bg-white text-black'
                      : 'bg-white/15 text-white/60'
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {STAGE_LABELS[stage]}
            </button>
            {i < stages.length - 1 && (
              <div className={`h-px w-4 ${done ? 'bg-white/50' : 'bg-white/15'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
