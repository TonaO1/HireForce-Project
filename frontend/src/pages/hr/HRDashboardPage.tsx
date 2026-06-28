import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { InteractiveCanvas } from '../../components/workspace/InteractiveCanvas';
import { mockCandidates, mockJobs } from '../../data/mockData';
import { getCandidates, getJobs } from '../../lib/api';
import { STAGE_LABELS } from '../../types';
import type { Candidate, JobOpening } from '../../types';

const SKILLS_BY_ROLE: Record<string, string[]> = {
  'Senior Frontend Engineer': ['React', 'TypeScript', 'CSS', 'Testing'],
  'Product Designer': ['Figma', 'Prototyping', 'UX', 'Systems'],
  'Recruiting Coordinator': ['ATS', 'Scheduling', 'Comms', 'Sourcing'],
};

function skillsFor(c: Candidate): string[] {
  return SKILLS_BY_ROLE[c.roleApplied] ?? ['Communication', 'Ownership', 'Collaboration'];
}

function lastUpdatedFor(c: Candidate): string {
  const latest = c.interviews.map((i) => i.scheduledAt).sort().at(-1) ?? c.appliedAt;
  return new Date(latest).toLocaleDateString();
}

function JobCard({ job, onOpen }: { job: JobOpening; onOpen: () => void }) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-mono text-sm font-semibold leading-tight text-white">
            {job.title}
          </h3>
          <p className="mt-0.5 truncate text-xs text-white/50">{job.department}</p>
        </div>
        <span className="shrink-0 rounded border border-white/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/70">
          {job.status}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
        <span>{job.applicantCount} applicants</span>
        <span>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}</span>
      </div>

      <div className="mt-auto pt-3">
        <button
          type="button"
          data-no-drag
          onClick={onOpen}
          className="btn-mono btn-mono-solid w-full !px-3 !py-2 !text-xs"
        >
          Go to Job
        </button>
      </div>
    </div>
  );
}

function ApplicantCard({ candidate }: { candidate: Candidate }) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-mono text-sm font-semibold text-white">{candidate.name}</h3>
          <p className="mt-0.5 text-xs text-white/50">{STAGE_LABELS[candidate.stage]}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-lg font-semibold leading-none text-white">
            {candidate.score ?? '—'}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-white/40">match</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {skillsFor(candidate).slice(0, 4).map((s) => (
          <span
            key={s}
            className="rounded border border-white/20 px-2 py-0.5 text-[10px] text-white/60"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-white/40">
        <span>updated {lastUpdatedFor(candidate)}</span>
        <span className="font-mono uppercase tracking-wider">{candidate.stage}</span>
      </div>
    </div>
  );
}

export function HRDashboardPage() {
  const [activeJob, setActiveJob] = useState<JobOpening | null>(null);
  const [jobs, setJobs] = useState<JobOpening[]>(mockJobs);
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [source, setSource] = useState<'salesforce' | 'mock'>('mock');

  useEffect(() => {
    let active = true;
    Promise.all([getJobs(), getCandidates()])
      .then(([remoteJobs, remoteCandidates]) => {
        if (!active) return;
        setJobs(remoteJobs);
        setCandidates(remoteCandidates);
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

  const applicants = useMemo(
    () => (activeJob ? candidates.filter((c) => c.jobId === activeJob.id) : []),
    [activeJob, candidates],
  );

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[520px] flex-col text-white">
      <div className="mb-4 flex items-center justify-between gap-4">
        <AnimatePresence mode="wait" initial={false}>
          {activeJob ? (
            <motion.div
              key="applicants-header"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-mono text-xl font-semibold tracking-tight">{activeJob.title}</h1>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
                {applicants.length} applicants
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="jobs-header"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-mono text-xl font-semibold tracking-tight">Jobs</h1>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
                {source === 'salesforce' ? 'salesforce workspace' : 'mock workspace'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {activeJob && (
          <button
            type="button"
            onClick={() => setActiveJob(null)}
            className="btn-mono btn-mono-outline !px-4 !py-2 !text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </button>
        )}
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/15">
        <AnimatePresence mode="wait" initial={false}>
          {activeJob ? (
            <motion.div
              key={`applicants-${activeJob.id}`}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <InteractiveCanvas
                items={applicants}
                cardWidth={252}
                cardHeight={190}
                renderCard={(c) => <ApplicantCard candidate={c} />}
              />
            </motion.div>
          ) : (
            <motion.div
              key="jobs"
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <InteractiveCanvas
                items={jobs}
                cardWidth={252}
                cardHeight={176}
                renderCard={(job) => <JobCard job={job} onOpen={() => setActiveJob(job)} />}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
