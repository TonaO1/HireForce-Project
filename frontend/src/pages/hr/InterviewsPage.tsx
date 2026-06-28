import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { useData } from '../../contexts/DataContext';

export function InterviewsPage() {
  const { candidates } = useData();
  const [filter, setFilter] = useState<'all' | 'pending' | 'pass' | 'fail'>('all');

  const allInterviews = useMemo(
    () =>
      candidates.flatMap((c) =>
        c.interviews.map((i) => ({ ...i, candidateName: c.name, candidateId: c.id })),
      ),
    [candidates],
  );

  const filtered = allInterviews.filter((i) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return i.outcome === 'pending' || !i.outcome;
    return i.outcome === filter;
  });

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Interview Tracking</h1>
        <p className="mt-1 text-white/50">Feedback and outcomes per candidate</p>
      </div>

      {allInterviews.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No interviews yet"
          description="As candidates move through the pipeline, their interviews and outcomes will be tracked here."
        />
      ) : (
        <>
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
                  {interview.feedback && (
                    <p className="mt-3 text-sm text-white/60">{interview.feedback}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
