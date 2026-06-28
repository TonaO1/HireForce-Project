import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Briefcase, Loader2, RefreshCw, Users } from 'lucide-react';
import { InteractiveCanvas } from '../../components/workspace/InteractiveCanvas';
import { EmptyState } from '../../components/ui/EmptyState';
import { useCandidates, useJobs } from '../../hooks/useHireForce';
import { STAGE_LABELS } from '../../types';
import type { Candidate, JobOpening } from '../../types';

function lastUpdatedFor(c: Candidate): string {
  const latest = c.interviews.map((i) => i.scheduledAt).sort().at(-1) ?? c.appliedAt;
  return new Date(latest).toLocaleDateString();
}

function JobCard({
  job,
  applicantCount,
  onOpen,
}: {
  job: JobOpening;
  applicantCount: number;
  onOpen: () => void;
}) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-mono text-sm font-semibold leading-tight text-white">{job.title}</h3>
          <p className="mt-0.5 truncate text-xs text-white/50">{job.department || 'No department'}</p>
        </div>
        <span className="shrink-0 rounded border border-white/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/70">
          {job.status}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
        <span>{applicantCount} applicants</span>
        <span>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}</span>
      </div>
      <div className="mt-auto pt-3">
        <button type="button" data-no-drag onClick={onOpen} className="btn-mono btn-mono-solid w-full !px-3 !py-2 !text-xs">
          Go to Job
        </button>
      </div>
    </div>
  );
}

function ApplicantCard({ candidate, onOpen }: { candidate: Candidate; onOpen: () => void }) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-mono text-sm font-semibold text-white">{candidate.name}</h3>
          <p className="mt-0.5 text-xs text-white/50">{STAGE_LABELS[candidate.stage]}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-lg font-semibold leading-none text-white">{candidate.resumeMatchScore ?? 'N/A'}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-white/40">resume match</div>
        </div>
      </div>
      <p className="mt-3 truncate text-xs text-white/50">{candidate.email}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <span className="text-[11px] text-white/40">updated {lastUpdatedFor(candidate)}</span>
        <button type="button" data-no-drag onClick={onOpen} className="btn-mono btn-mono-outline !px-3 !py-1.5 !text-[11px]">
          View
        </button>
      </div>
    </div>
  );
}

export function HRDashboardPage() {
  const {
    data: jobs = [],
    isLoading: jobsLoading,
    isRefreshing: jobsRefreshing,
    error: jobsError,
    updatedAt: jobsUpdatedAt,
    refetch: refetchJobs,
  } = useJobs();
  const {
    data: candidates = [],
    isLoading: candidatesLoading,
    isRefreshing: candidatesRefreshing,
    updatedAt: candidatesUpdatedAt,
    refetch: refetchCandidates,
  } = useCandidates();
  const navigate = useNavigate();
  const [activeJob, setActiveJob] = useState<JobOpening | null>(null);
  const refreshing = jobsRefreshing || candidatesRefreshing;
  const lastUpdated = candidatesUpdatedAt || jobsUpdatedAt;

  const refreshDashboard = useCallback(() => {
    refetchJobs();
    refetchCandidates();
  }, [refetchCandidates, refetchJobs]);

  useEffect(() => {
    const interval = window.setInterval(refreshDashboard, 15000);
    window.addEventListener('focus', refreshDashboard);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshDashboard);
    };
  }, [refreshDashboard]);

  const countByJob = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of candidates) map[c.jobId] = (map[c.jobId] ?? 0) + 1;
    return map;
  }, [candidates]);

  const applicants = useMemo(
    () => (activeJob ? candidates.filter((c) => c.jobId === activeJob.id) : []),
    [activeJob, candidates],
  );

  if (jobsLoading || candidatesLoading) {
    return (
      <div className="flex h-[calc(100vh-7rem)] items-center justify-center text-white/50">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[520px] flex-col text-white">
      {jobsError && (
        <div className="mb-4 rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm text-white">
          {jobsError instanceof Error ? jobsError.message : 'Could not load dashboard data.'}
        </div>
      )}
      <div className="mb-4 flex items-center justify-between gap-4">
        <AnimatePresence mode="wait" initial={false}>
          {activeJob ? (
            <motion.div key="applicants-header" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
              <h1 className="font-mono text-xl font-semibold tracking-tight">{activeJob.title}</h1>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">{applicants.length} applicants</p>
            </motion.div>
          ) : (
            <motion.div key="jobs-header" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
              <h1 className="font-mono text-xl font-semibold tracking-tight">Jobs</h1>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">interactive workspace</p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {lastUpdated && (
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/40">
              Updated {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <button type="button" onClick={refreshDashboard} disabled={refreshing} className="btn-mono btn-mono-outline !px-4 !py-2 !text-xs">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
          {activeJob && (
            <button type="button" onClick={() => setActiveJob(null)} className="btn-mono btn-mono-outline !px-4 !py-2 !text-xs">
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </button>
          )}
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/15">
        <AnimatePresence mode="wait" initial={false}>
          {activeJob ? (
            <motion.div key={`applicants-${activeJob.id}`} className="absolute inset-0" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
              {applicants.length > 0 ? (
                <InteractiveCanvas items={applicants} cardWidth={252} cardHeight={180} renderCard={(c) => <ApplicantCard candidate={c} onOpen={() => navigate(`/hr/candidates/${c.id}`)} />} />
              ) : (
                <div className="flex h-full items-center justify-center p-8">
                  <EmptyState icon={Users} className="max-w-md" title="No applicants yet" description={`Applications for ${activeJob.title} will appear here as candidates apply.`} action={{ label: 'Back to Jobs', onClick: () => setActiveJob(null) }} />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="jobs" className="absolute inset-0" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              {jobs.length > 0 ? (
                <InteractiveCanvas items={jobs} cardWidth={252} cardHeight={176} renderCard={(job) => <JobCard job={job} applicantCount={countByJob[job.id] ?? 0} onOpen={() => setActiveJob(job)} />} />
              ) : (
                <div className="flex h-full items-center justify-center p-8">
                  <EmptyState icon={Briefcase} className="max-w-md" title="No job openings yet" description="Create your first role to start building a candidate pipeline." action={{ label: 'New Role', to: '/hr/jobs' }} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
