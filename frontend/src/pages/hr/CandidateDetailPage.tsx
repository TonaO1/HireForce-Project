import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Mail, Star, CheckCircle2 } from 'lucide-react';
import { StageBadge } from '../../components/candidate/StageBadge';
import { StageStepper } from '../../components/candidate/StageStepper';
import { mockCandidates } from '../../data/mockData';
import type { PipelineStage } from '../../types';

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const candidate = mockCandidates.find((c) => c.id === id);
  const [stage, setStage] = useState<PipelineStage | undefined>(candidate?.stage);
  const [showOnboardingToast, setShowOnboardingToast] = useState(false);

  if (!candidate) {
    return (
      <div className="text-center">
        <p className="text-slate-400">Candidate not found</p>
        <Link to="/hr" className="mt-4 inline-block text-indigo-400 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const currentStage = stage ?? candidate.stage;

  const handleStageChange = (newStage: PipelineStage) => {
    setStage(newStage);
    if (newStage === 'hired') {
      setShowOnboardingToast(true);
      setTimeout(() => setShowOnboardingToast(false), 4000);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to="/hr"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to pipeline
      </Link>

      {showOnboardingToast && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Auto-onboarding triggered — 3 tasks created for {candidate.name}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white">
            {candidate.avatarInitials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{candidate.name}</h1>
            <p className="text-indigo-300">{candidate.roleApplied}</p>
            <StageBadge stage={currentStage} />
          </div>
        </div>
        <Link
          to="/hr/interviews"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Schedule interview
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <Mail className="h-4 w-4 text-slate-500" />
          <p className="mt-2 text-sm text-slate-400">Email</p>
          <p className="text-slate-200">{candidate.email}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <Calendar className="h-4 w-4 text-slate-500" />
          <p className="mt-2 text-sm text-slate-400">Applied</p>
          <p className="text-slate-200">{new Date(candidate.appliedAt).toLocaleDateString()}</p>
        </div>
        {candidate.score != null && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <Star className="h-4 w-4 text-amber-400" />
            <p className="mt-2 text-sm text-slate-400">Screen Score</p>
            <p className="text-slate-200">{candidate.score}/100</p>
          </div>
        )}
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Pipeline Stage
        </h2>
        <StageStepper currentStage={currentStage} onStageChange={handleStageChange} />
      </section>

      {candidate.notes && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-400">Notes</h2>
          <p className="text-slate-300">{candidate.notes}</p>
        </section>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Interview History
        </h2>
        {candidate.interviews.length === 0 ? (
          <p className="text-sm text-slate-500">No interviews logged yet</p>
        ) : (
          <ul className="space-y-4">
            {candidate.interviews.map((interview) => (
              <li
                key={interview.id}
                className="rounded-lg border border-slate-800 bg-slate-950/50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-200">{interview.type}</p>
                    <p className="text-sm text-slate-500">
                      with {interview.interviewer} ·{' '}
                      {new Date(interview.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                  {interview.outcome && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        interview.outcome === 'pass'
                          ? 'bg-green-500/20 text-green-300'
                          : interview.outcome === 'fail'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {interview.outcome}
                    </span>
                  )}
                </div>
                {interview.feedback && (
                  <p className="mt-2 text-sm text-slate-400">{interview.feedback}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
