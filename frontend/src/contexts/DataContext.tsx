import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Candidate, JobOpening, OnboardingTask, PipelineStage } from '../types';

interface NewJobInput {
  title: string;
  department: string;
  location: string;
  description: string;
}

interface DataContextValue {
  jobs: JobOpening[];
  candidates: Candidate[];
  onboardingTasks: OnboardingTask[];
  addJob: (input: NewJobInput) => void;
  applyToJob: (jobId: string, applicant: { name: string; email: string }) => void;
  updateCandidateStage: (candidateId: string, stage: PipelineStage) => void;
  hasAppliedTo: (jobId: string, email: string) => boolean;
}

interface PersistShape {
  jobs: JobOpening[];
  candidates: Candidate[];
  onboardingTasks: OnboardingTask[];
}

const DataContext = createContext<DataContextValue | null>(null);
const STORAGE_KEY = 'hireforce_data';
const EMPTY: PersistShape = { jobs: [], candidates: [], onboardingTasks: [] };

function load(): PersistShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as PersistShape) };
  } catch {
    /* ignore malformed storage */
  }
  return EMPTY;
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const result = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return result.toUpperCase() || '?';
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PersistShape>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore quota errors */
    }
  }, [data]);

  const addJob = useCallback((input: NewJobInput) => {
    setData((d) => ({
      ...d,
      jobs: [
        {
          id: uid('job'),
          title: input.title.trim(),
          department: input.department.trim(),
          location: input.location.trim(),
          description: input.description.trim(),
          status: 'open',
          applicantCount: 0,
          createdAt: new Date().toISOString(),
        },
        ...d.jobs,
      ],
    }));
  }, []);

  const applyToJob = useCallback(
    (jobId: string, applicant: { name: string; email: string }) => {
      setData((d) => {
        const job = d.jobs.find((j) => j.id === jobId);
        if (!job) return d;
        if (d.candidates.some((c) => c.jobId === jobId && c.email === applicant.email)) {
          return d;
        }
        const candidate: Candidate = {
          id: uid('c'),
          name: applicant.name,
          email: applicant.email,
          roleApplied: job.title,
          jobId,
          stage: 'applied',
          appliedAt: new Date().toISOString(),
          avatarInitials: initials(applicant.name),
          interviews: [],
        };
        return { ...d, candidates: [candidate, ...d.candidates] };
      });
    },
    [],
  );

  const updateCandidateStage = useCallback(
    (candidateId: string, stage: PipelineStage) => {
      setData((d) => {
        const candidate = d.candidates.find((c) => c.id === candidateId);
        const candidates = d.candidates.map((c) =>
          c.id === candidateId ? { ...c, stage } : c,
        );

        let onboardingTasks = d.onboardingTasks;
        const alreadyOnboarding = d.onboardingTasks.some(
          (t) => t.candidateId === candidateId,
        );
        if (stage === 'hired' && candidate && !alreadyOnboarding) {
          const triggeredAt = new Date().toISOString();
          const titles = [
            'Send offer letter & collect signed documents',
            'Provision laptop & email account',
            'Schedule Day 1 orientation',
          ];
          onboardingTasks = [
            ...titles.map((title) => ({
              id: uid('o'),
              candidateId,
              candidateName: candidate.name,
              title,
              status: 'pending' as const,
              triggeredAt,
            })),
            ...d.onboardingTasks,
          ];
        }

        return { ...d, candidates, onboardingTasks };
      });
    },
    [],
  );

  const hasAppliedTo = useCallback(
    (jobId: string, email: string) =>
      data.candidates.some((c) => c.jobId === jobId && c.email === email),
    [data.candidates],
  );

  return (
    <DataContext.Provider
      value={{
        jobs: data.jobs,
        candidates: data.candidates,
        onboardingTasks: data.onboardingTasks,
        addJob,
        applyToJob,
        updateCandidateStage,
        hasAppliedTo,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
