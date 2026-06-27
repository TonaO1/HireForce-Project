import { Briefcase, Users, Video, UserCheck } from 'lucide-react';
import type { Candidate, JobOpening } from '../../types';

interface PipelineStatsProps {
  jobs: JobOpening[];
  candidates: Candidate[];
}

export function PipelineStats({ jobs, candidates }: PipelineStatsProps) {
  const openRoles = jobs.filter((j) => j.status === 'open').length;
  const inInterview = candidates.filter((c) => c.stage === 'interview').length;
  const offers = candidates.filter((c) => c.stage === 'offer').length;
  const hired = candidates.filter((c) => c.stage === 'hired').length;

  const stats = [
    { label: 'Open Roles', value: openRoles, icon: Briefcase, color: 'text-indigo-400' },
    { label: 'Active Candidates', value: candidates.filter((c) => !['hired', 'rejected'].includes(c.stage)).length, icon: Users, color: 'text-violet-400' },
    { label: 'In Interview', value: inInterview, icon: Video, color: 'text-amber-400' },
    { label: 'Hired', value: hired, icon: UserCheck, color: 'text-green-400' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur"
        >
          <div className="flex items-center justify-between">
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="text-2xl font-bold text-slate-100">{value}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{label}</p>
          {label === 'In Interview' && offers > 0 && (
            <p className="mt-1 text-xs text-emerald-400">{offers} pending offer</p>
          )}
        </div>
      ))}
    </div>
  );
}
