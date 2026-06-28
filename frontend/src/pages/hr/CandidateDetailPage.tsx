import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle2, Mail, Star } from 'lucide-react';
import { StageBadge } from '../../components/candidate/StageBadge';
import { StageStepper } from '../../components/candidate/StageStepper';
import { mockCandidates } from '../../data/mockData';
import { getCandidate, updateCandidateStage } from '../../lib/api';
import type { Candidate, PipelineStage } from '../../types';

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const fallbackCandidate = mockCandidates.find((c) => c.id === id);
  const [candidate, setCandidate] = useState<Candidate | undefined>(fallbackCandidate);
  const [stage, setStage] = useState<PipelineStage | undefined>(fallbackCandidate?.stage);
  const [showOnboardingToast, setShowOnboardingToast] = useState(false);
  const [savingStage, setSavingStage] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    getCandidate(id)
      .then((remoteCandidate) => {
        if (!active) return;
        setCandidate(remoteCandidate);
        setStage(remoteCandidate.stage);
      })
      .catch(() => {
        if (!active) return;
        setCandidate(fallbackCandidate);
        setStage(fallbackCandidate?.stage);
      });
    return () => {
      active = false;
    };
  }, [id, fallbackCandidate]);

  if (!candidate) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-white/15 bg-black p-8 text-center">
        <p className="text-white/60">Candidate not found</p>
        <Link
          to="/hr"
          className="mt-4 inline-block text-sm text-white/80 underline-offset-4 hover:text-white hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const currentStage = stage ?? candidate.stage;

  const handleStageChange = async (newStage: PipelineStage) => {
    if (!id || !candidate) return;
    setSavingStage(true);
    setError('');
    setStage(newStage);
    try {
      const updated = await updateCandidateStage(id, newStage);
      setCandidate(updated);
      setStage(updated.stage);
      if (updated.stage === 'hired') {
        setShowOnboardingToast(true);
        setTimeout(() => setShowOnboardingToast(false), 4000);
      }
    } catch (stageError) {
      setStage(candidate.stage);
      setError(stageError instanceof Error ? stageError.message : 'Could not update stage.');
    } finally {
      setSavingStage(false);
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
          <p className="text-sm">Salesforce Flow triggered onboarding tasks for {candidate.name}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm text-white">
          {error}
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
              <StageBadge stage={currentStage} />
            </div>
          </div>
        </div>
        <Link to="/hr/interviews" className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm">
          Schedule interview
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-4">
          <Mail className="h-4 w-4 text-white/50" />
          <p className="mt-2 text-sm text-white/50">Email</p>
          <p className="text-white">{candidate.email}</p>
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
          Pipeline Stage {savingStage ? '(saving to Salesforce...)' : ''}
        </h2>
        <StageStepper currentStage={currentStage} onStageChange={handleStageChange} readonly={savingStage} />
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
                      with {interview.interviewer} - {new Date(interview.scheduledAt).toLocaleString()}
                    </p>
                    {interview.score != null && (
                      <p className="text-xs text-white/40">Score {interview.score}/100</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge capitalize">{interview.status || 'Scheduled'}</span>
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
                </div>
                {interview.feedback && (
                  <p className="mt-2 text-sm text-white/60">{interview.feedback}</p>
                )}
                {(interview.strengths || interview.concerns || interview.evidence) && (
                  <dl className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                    {interview.strengths && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-white/35">Strengths</dt>
                        <dd className="mt-1 text-white/65">{interview.strengths}</dd>
                      </div>
                    )}
                    {interview.concerns && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-white/35">Concerns</dt>
                        <dd className="mt-1 text-white/65">{interview.concerns}</dd>
                      </div>
                    )}
                    {interview.evidence && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-white/35">Evidence</dt>
                        <dd className="mt-1 text-white/65">{interview.evidence}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
