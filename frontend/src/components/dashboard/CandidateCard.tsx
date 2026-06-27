import { Calendar, Mail, Star } from 'lucide-react';
import type { Candidate } from '../../types';
import { StageBadge } from '../candidate/StageBadge';

interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const stageProgress =
    candidate.stage === 'rejected'
      ? 0
      : ['applied', 'screened', 'interview', 'offer', 'hired'].indexOf(candidate.stage) + 1;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-lg">
          {candidate.avatarInitials}
        </div>
        <StageBadge stage={candidate.stage} />
      </div>

      <h3 className="text-xl font-semibold text-slate-100">{candidate.name}</h3>
      <p className="mt-1 text-sm text-indigo-300">{candidate.roleApplied}</p>

      <div className="mt-4 space-y-2 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 shrink-0" />
          <span className="truncate">{candidate.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Applied {new Date(candidate.appliedAt).toLocaleDateString()}</span>
        </div>
        {candidate.score != null && (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Screen score: {candidate.score}/100</span>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Pipeline progress</span>
          <span>{stageProgress}/5</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
            style={{ width: `${(stageProgress / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
