import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { CandidateCardStack } from '../../components/dashboard/CandidateCardStack';
import { PipelineStats } from '../../components/dashboard/PipelineStats';
import { StageFilter } from '../../components/dashboard/StageFilter';
import { mockCandidates, mockJobs } from '../../data/mockData';
import { getCandidates, getJobs } from '../../lib/api';
import { PIPELINE_STAGES, type Candidate, type JobOpening, type PipelineStage } from '../../types';

export function HRDashboardPage() {
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'all'>('all');
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [jobs, setJobs] = useState<JobOpening[]>(mockJobs);
  const [source, setSource] = useState<'salesforce' | 'mock'>('mock');

  useEffect(() => {
    let active = true;
    Promise.all([getCandidates(), getJobs()])
      .then(([remoteCandidates, remoteJobs]) => {
        if (!active) return;
        setCandidates(remoteCandidates);
        setJobs(remoteJobs);
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

  const counts = useMemo(() => {
    const result = { all: candidates.length } as Record<PipelineStage | 'all', number>;
    for (const stage of PIPELINE_STAGES) {
      result[stage] = candidates.filter((c) => c.stage === stage).length;
    }
    return result;
  }, [candidates]);

  const filtered = useMemo(
    () =>
      stageFilter === 'all'
        ? candidates
        : candidates.filter((c) => c.stage === stageFilter),
    [stageFilter, candidates],
  );

  const recentActivity = useMemo(
    () =>
      candidates
        .flatMap((c) =>
          c.interviews.map((i) => ({
            candidate: c.name,
            action: i.outcome === 'pending' ? 'Interview scheduled' : 'Interview completed',
            date: i.scheduledAt,
          })),
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [candidates],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">HR Dashboard</h1>
        <p className="mt-1 text-slate-500">
          Real-time view of your hiring pipeline ({source === 'salesforce' ? 'Salesforce' : 'mock fallback'})
        </p>
      </div>

      <PipelineStats jobs={jobs} candidates={candidates} />

      <StageFilter selected={stageFilter} onChange={setStageFilter} counts={counts} />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
            Candidate Pipeline
          </h2>
          <CandidateCardStack candidates={filtered} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Activity className="h-4 w-4 text-indigo-400" />
              Recent Activity
            </h3>
            <ul className="mt-4 space-y-3">
              {recentActivity.length === 0 ? (
                <li className="text-sm text-slate-500">No recent activity</li>
              ) : (
                recentActivity.map((item, i) => (
                  <li key={i} className="flex items-start justify-between text-sm">
                    <div>
                      <p className="text-slate-300">{item.candidate}</p>
                      <p className="text-slate-500">{item.action}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-600">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-slate-300">Quick Links</h3>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                to="/hr/jobs"
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 transition hover:border-indigo-500/40 hover:text-indigo-300"
              >
                Manage job openings →
              </Link>
              <Link
                to="/hr/interviews"
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 transition hover:border-indigo-500/40 hover:text-indigo-300"
              >
                Log interview feedback →
              </Link>
              <Link
                to="/hr/onboarding"
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 transition hover:border-indigo-500/40 hover:text-indigo-300"
              >
                View onboarding tasks →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
