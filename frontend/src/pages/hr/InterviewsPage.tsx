import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mockCandidates } from '../../data/mockData';
import { getInterviews, updateInterview } from '../../lib/api';
import type { Interview, InterviewOutcome } from '../../types';

type InterviewRow = Interview & { candidateName?: string };

type FeedbackDraft = {
  status: string;
  outcome: InterviewOutcome;
  score: string;
  feedback: string;
  strengths: string;
  concerns: string;
  evidence: string;
};

const allInterviews: InterviewRow[] = mockCandidates.flatMap((c) =>
  c.interviews.map((i) => ({ ...i, candidateName: c.name, candidateId: c.id })),
);

function draftFromInterview(interview: InterviewRow): FeedbackDraft {
  return {
    status: interview.status || (interview.outcome && interview.outcome !== 'pending' ? 'Completed' : 'Scheduled'),
    outcome: interview.outcome || 'pending',
    score: interview.score == null ? '' : String(interview.score),
    feedback: interview.feedback || '',
    strengths: interview.strengths || '',
    concerns: interview.concerns || '',
    evidence: interview.evidence || '',
  };
}

function draftsFromInterviews(interviews: InterviewRow[]) {
  return Object.fromEntries(interviews.map((interview) => [interview.id, draftFromInterview(interview)]));
}

export function InterviewsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'pass' | 'fail'>('all');
  const [interviews, setInterviews] = useState<InterviewRow[]>(allInterviews);
  const [drafts, setDrafts] = useState<Record<string, FeedbackDraft>>(draftsFromInterviews(allInterviews));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [source, setSource] = useState<'salesforce' | 'mock'>('mock');

  useEffect(() => {
    let active = true;
    getInterviews()
      .then((remoteInterviews) => {
        if (!active) return;
        const rows = remoteInterviews.map((interview) => ({
          ...interview,
          candidateName: interview.candidateName || 'Candidate',
        }));
        setInterviews(rows);
        setDrafts(draftsFromInterviews(rows));
        setSource('salesforce');
      })
      .catch(() => {
        if (!active) return;
        setSource('mock');
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = interviews.filter((i) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return i.outcome === 'pending' || !i.outcome;
    return i.outcome === filter;
  });

  const updateDraft = (id: string, field: keyof FeedbackDraft, value: string) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  };

  const saveInterview = async (interview: InterviewRow) => {
    const draft = drafts[interview.id] || draftFromInterview(interview);
    setSavingId(interview.id);
    setError('');
    try {
      const updated = await updateInterview(interview.id, {
        status: draft.status,
        outcome: draft.outcome,
        score: draft.score ? Number(draft.score) : undefined,
        feedback: draft.feedback,
        strengths: draft.strengths,
        concerns: draft.concerns,
        evidence: draft.evidence,
      });
      const next = {
        ...updated,
        candidateName: updated.candidateName || interview.candidateName,
      };
      setInterviews((current) => current.map((item) => (item.id === interview.id ? next : item)));
      setDrafts((current) => ({ ...current, [interview.id]: draftFromInterview(next) }));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save interview.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Interview Tracking</h1>
        <p className="mt-1 text-white/50">
          Log feedback and outcomes per candidate ({source === 'salesforce' ? 'Salesforce' : 'mock fallback'})
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm text-white">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'pass', 'fail'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-white text-black'
                : 'border border-white/25 text-white/60 hover:border-white/50 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-white/40">No interviews match this filter</p>
        ) : (
          filtered.map((interview) => {
            const draft = drafts[interview.id] || draftFromInterview(interview);
            const requiresCompletedFeedback = draft.status === 'Completed';
            return (
              <div key={interview.id} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {interview.candidateId ? (
                      <Link
                        to={`/hr/candidates/${interview.candidateId}`}
                        className="font-medium text-white underline-offset-4 hover:underline"
                      >
                        {interview.candidateName}
                      </Link>
                    ) : (
                      <p className="font-medium text-white">{interview.candidateName}</p>
                    )}
                    <p className="text-sm text-white/50">
                      {interview.type} - {interview.interviewer}
                    </p>
                    <p className="text-xs text-white/40">
                      {new Date(interview.scheduledAt).toLocaleString()} - {interview.candidateId}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge capitalize">{interview.status || 'Scheduled'}</span>
                    <span
                      className={
                        interview.outcome === 'pass'
                          ? 'badge-strong capitalize'
                          : interview.outcome === 'fail'
                            ? 'badge-dim capitalize'
                            : 'badge capitalize'
                      }
                    >
                      {interview.outcome ?? 'pending'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <select
                    value={draft.status}
                    onChange={(event) => updateDraft(interview.id, 'status', event.target.value)}
                    className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                  >
                    <option>Scheduled</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                  <select
                    value={draft.outcome}
                    onChange={(event) => updateDraft(interview.id, 'outcome', event.target.value)}
                    className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                  >
                    <option value="pending">Needs Follow-up</option>
                    <option value="pass">Hire</option>
                    <option value="fail">No Hire</option>
                  </select>
                  <input
                    min={1}
                    max={100}
                    required={requiresCompletedFeedback}
                    type="number"
                    value={draft.score}
                    onChange={(event) => updateDraft(interview.id, 'score', event.target.value)}
                    placeholder="Score"
                    className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                  <textarea
                    value={draft.feedback}
                    onChange={(event) => updateDraft(interview.id, 'feedback', event.target.value)}
                    placeholder="Feedback summary"
                    rows={2}
                    className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white md:col-span-3"
                  />
                  <textarea
                    required={requiresCompletedFeedback}
                    value={draft.strengths}
                    onChange={(event) => updateDraft(interview.id, 'strengths', event.target.value)}
                    placeholder="Strengths"
                    rows={2}
                    className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                  <textarea
                    required={requiresCompletedFeedback}
                    value={draft.concerns}
                    onChange={(event) => updateDraft(interview.id, 'concerns', event.target.value)}
                    placeholder="Concerns"
                    rows={2}
                    className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                  <textarea
                    required={requiresCompletedFeedback}
                    value={draft.evidence}
                    onChange={(event) => updateDraft(interview.id, 'evidence', event.target.value)}
                    placeholder="Job-related evidence"
                    rows={2}
                    className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    disabled={savingId === interview.id || source !== 'salesforce'}
                    onClick={() => void saveInterview(interview)}
                    className="btn-mono btn-mono-solid !px-3 !py-2 !text-xs disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingId === interview.id ? 'Saving...' : 'Save Feedback'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-white/60">
          Salesforce Scheduler can replace this manual scheduling surface later.
        </p>
        <p className="mt-1 text-xs text-white/40">
          Feedback here updates Interview__c and appears on the related candidate record.
        </p>
      </div>
    </div>
  );
}
