import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mockCandidates } from '../../data/mockData';
import { getInterviews } from '../../lib/api';

const allInterviews = mockCandidates.flatMap((c) =>
  c.interviews.map((i) => ({ ...i, candidateName: c.name, candidateId: c.id })),
);

export function InterviewsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'pass' | 'fail'>('all');
  const [interviews, setInterviews] = useState(allInterviews);
  const [source, setSource] = useState<'salesforce' | 'mock'>('mock');

  useEffect(() => {
    let active = true;
    getInterviews()
      .then((remoteInterviews) => {
        if (!active) return;
        setInterviews(remoteInterviews.map((interview) => ({ ...interview, candidateName: interview.candidateName || 'Candidate' })));
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

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Interview Tracking</h1>
        <p className="mt-1 text-white/50">
          Log feedback and outcomes per candidate ({source === 'salesforce' ? 'Salesforce' : 'mock fallback'})
        </p>
      </div>

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
          filtered.map((interview) => (
            <div key={interview.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/hr/candidates/${interview.candidateId}`}
                    className="font-medium text-white underline-offset-4 hover:underline"
                  >
                    {interview.candidateName}
                  </Link>
                  <p className="text-sm text-white/50">
                    {interview.type} · {interview.interviewer}
                  </p>
                  <p className="text-xs text-white/40">
                    {new Date(interview.scheduledAt).toLocaleString()}
                  </p>
                </div>
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
              {interview.feedback ? (
                <p className="mt-3 text-sm text-white/60">{interview.feedback}</p>
              ) : (
                <div className="mt-3 flex gap-2">
                  <textarea
                    placeholder="Add interview feedback..."
                    rows={2}
                    className="flex-1 rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                  <button
                    type="button"
                    className="btn-mono btn-mono-solid self-end !px-3 !py-2 !text-xs"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-white/60">
          Calendly / Salesforce Scheduler integration — candidates can self-book slots
        </p>
        <p className="mt-1 text-xs text-white/40">
          Embed scheduling widget on candidate detail page
        </p>
      </div>
    </div>
  );
}
