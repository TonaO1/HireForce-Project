import { PIPELINE_STAGES, STAGE_LABELS, type PipelineStage } from '../../types';

interface StageFilterProps {
  selected: PipelineStage | 'all';
  onChange: (stage: PipelineStage | 'all') => void;
  counts: Record<PipelineStage | 'all', number>;
}

const FILTERS: (PipelineStage | 'all')[] = ['all', ...PIPELINE_STAGES];

export function StageFilter({ selected, onChange, counts }: StageFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((stage) => (
        <button
          key={stage}
          type="button"
          onClick={() => onChange(stage)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            selected === stage
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
              : 'border border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200'
          }`}
        >
          {stage === 'all' ? 'All' : STAGE_LABELS[stage]} ({counts[stage]})
        </button>
      ))}
    </div>
  );
}
