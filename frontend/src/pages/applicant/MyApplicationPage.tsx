import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PIPELINE_STAGES, STAGE_LABELS } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getCandidates } from '../../lib/api';
import type { Candidate } from '../../types';

export function MyApplicationPage() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const application = useMemo(
    () => candidates.find((candidate) => candidate.email.toLowerCase() === user?.email.toLowerCase()),
    [candidates, user?.email],
  );
  const stage = application?.stage || 'applied';
  const currentIndex = PIPELINE_STAGES.indexOf(stage);

  useEffect(() => {
    let active = true;
    getCandidates()
      .then((remoteCandidates) => {
        if (!active) return;
        setCandidates(remoteCandidates);
      })
      .catch(() => {
        if (!active) return;
        setCandidates([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">My Application</h1>
        <p className="mt-1 text-slate-500">Track your progress through the hiring pipeline</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        {application ? (
          <>
            <h2 className="font-semibold text-slate-200">{application.roleApplied}</h2>
            <p className="text-sm text-slate-500">
              Applied {new Date(application.appliedAt).toLocaleDateString()}
            </p>
          </>
        ) : (
          <>
            <h2 className="font-semibold text-slate-200">No Salesforce application found</h2>
            <p className="text-sm text-slate-500">
              Apply to a role with the same email you used to sign in.
            </p>
            <Link to="/apply" className="mt-3 inline-block text-sm text-indigo-300 hover:underline">
              Browse open jobs
            </Link>
          </>
        )}

        <div className="mt-8 space-y-0">
          {PIPELINE_STAGES.filter((s) => s !== 'rejected').map((stage, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <div key={stage} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      done
                        ? 'bg-green-500 text-white'
                        : active
                          ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/30'
                          : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  {i < 4 && (
                    <div className={`h-10 w-0.5 ${done ? 'bg-green-500/50' : 'bg-slate-700'}`} />
                  )}
                </div>
                <div className="pb-8">
                  <p className={`font-medium ${active ? 'text-indigo-300' : 'text-slate-400'}`}>
                    {STAGE_LABELS[stage]}
                  </p>
                  {active && (
                    <p className="text-sm text-slate-500">You are currently in this stage</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
