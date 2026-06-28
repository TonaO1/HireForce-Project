import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { mockCandidates } from '../../data/mockData';
import { getInterviews } from '../../lib/api';
import type { Interview } from '../../types';

const mockInterviews = mockCandidates.flatMap((c) =>
  c.interviews.map((i) => ({ ...i, candidateName: c.name, candidateId: c.id })),
);

export function InterviewsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'pass' | 'fail'>('all');
  const [interviews, setInterviews] = useState<Array<Interview & { candidateName?: string }>>(mockInterviews);
  const [source, setSource] = useState<'salesforce' | 'mock'>('mock');

  useEffect(() => {
    let active = true;
    getInterviews()
      .then((remoteInterviews) => {
        if (!active) return;
        setInterviews(remoteInterviews);
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

  const filtered = useMemo(
    () =>
      interviews.filter((i) => {
        if (filter === 'all') return true;
        if (filter === 'pending') return i.outcome === 'pending' || !i.outcome;
        return i.outcome === filter;
      }),
    [filter, interviews],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Interview Tracking</h1>
        <p className="mt-1 text-slate-500">
          Log feedback and outcomes per candidate ({source === 'salesforce' ? 'Salesforce' : 'mock fallback'})
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'pass', 'fail'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
              filter === f
                ? 'bg-indigo-500 text-white'
                : 'border border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-slate-500">No interviews match this filter</p>
        ) : (
          filtered.map((interview) => (
            <div
              key={interview.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/hr/candidates/${interview.candidateId}`}
                    className="font-medium text-indigo-300 hover:underline"
                  >
                    {interview.candidateName || 'Candidate'}
                  </Link>
                  <p className="text-sm text-slate-400">
                    {interview.type} · {interview.interviewer}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(interview.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    interview.outcome === 'pass'
                      ? 'bg-green-500/20 text-green-300'
                      : interview.outcome === 'fail'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {interview.outcome ?? 'pending'}
                </span>
              </div>
              {interview.feedback ? (
                <p className="mt-3 text-sm text-slate-400">{interview.feedback}</p>
              ) : (
                <div className="mt-3 flex gap-2">
                  <textarea
                    placeholder="Add interview feedback..."
                    rows={2}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="self-end rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-6 text-center">
        <p className="text-sm text-slate-400">
          Calendly / Salesforce Scheduler integration — candidates can self-book slots
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Embed scheduling widget on candidate detail page
        </p>
      </div>
    </div>
  );
}
