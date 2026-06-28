import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Mail, Star, CheckCircle2 } from 'lucide-react';
import { StageBadge } from '../../components/candidate/StageBadge';
import { StageStepper } from '../../components/candidate/StageStepper';
import { EmptyState } from '../../components/ui/EmptyState';
import { useData } from '../../contexts/DataContext';
import type { PipelineStage } from '../../types';

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { candidates, updateCandidateStage } = useData();
  const candidate = candidates.find((c) => c.id === id);
  const [showOnboardingToast, setShowOnboardingToast] = useState(false);

  if (!candidate) {
    return (
      <EmptyState
        title="Candidate not found"
        description="This candidate may have been removed, or the link is no longer valid."
        action={{ label: 'Back to dashboard', to: '/hr' }}
      />
    );
  }

  const handleStageChange = (newStage: PipelineStage) => {
    updateCandidateStage(candidate.id, newStage);
    if (newStage === 'hired') {
      setShowOnboardingToast(true);
      setTimeout(() => setShowOnboardingToast(false), 4000);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 text-white">
      <Link
        to="/hr"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to pipeline
      </Link>

      {showOnboardingToast && (
        <div className="flex items-center gap-3 rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-white">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Auto-onboarding triggered — 3 tasks created for {candidate.name}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/5 text-xl font-bold text-white">
            {candidate.avatarInitials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{candidate.name}</h1>
            <p className="text-white/60">{candidate.roleApplied}</p>
            <div className="mt-1">
              <StageBadge stage={candidate.stage} />
            </div>
          </div>
        </div>
        <Link to="/hr/interviews" className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm">
          View interviews
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-4">
          <Mail className="h-4 w-4 text-white/50" />
          <p className="mt-2 text-sm text-white/50">Email</p>
          <p className="truncate text-white">{candidate.email}</p>
        </div>
        <div className="panel p-4">
          <Calendar className="h-4 w-4 text-white/50" />
          <p className="mt-2 text-sm text-white/50">Applied</p>
          <p className="text-white">{new Date(candidate.appliedAt).toLocaleDateString()}</p>
        </div>
        {candidate.score != null && (
          <div className="panel p-4">
            <Star className="h-4 w-4 text-white" />
            <p className="mt-2 text-sm text-white/50">Screen Score</p>
            <p className="text-white">{candidate.score}/100</p>
          </div>
        )}
      </div>

      <section className="panel p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
          Pipeline Stage
        </h2>
        <StageStepper currentStage={candidate.stage} onStageChange={handleStageChange} />
      </section>

      {candidate.notes && (
        <section className="panel p-6">
          <h2 className="mb-2 text-sm font-semibold text-white/60">Notes</h2>
          <p className="text-white/80">{candidate.notes}</p>
        </section>
      )}

      <section className="panel p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
          Interview History
        </h2>
        {candidate.interviews.length === 0 ? (
          <p className="text-sm text-white/40">No interviews logged yet</p>
        ) : (
          <ul className="space-y-4">
            {candidate.interviews.map((interview) => (
              <li
                key={interview.id}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{interview.type}</p>
                    <p className="text-sm text-white/50">
                      with {interview.interviewer} ·{' '}
                      {new Date(interview.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                  {interview.outcome && (
                    <span
                      className={
                        interview.outcome === 'pass'
                          ? 'badge-strong capitalize'
                          : interview.outcome === 'fail'
                            ? 'badge-dim capitalize'
                            : 'badge capitalize'
                      }
                    >
                      {interview.outcome}
                    </span>
                  )}
                </div>
                {interview.feedback && (
                  <p className="mt-2 text-sm text-white/60">{interview.feedback}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
