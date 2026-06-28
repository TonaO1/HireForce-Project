import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  mockCandidates,
  mockInterviewers,
  mockJobs,
  mockOnboardingTasks,
} from '../data/mockData';
import type {
  BookSchedulerInput,
  Candidate,
  CreateInterviewInput,
  CreateJobInput,
  Interview,
  JobOpening,
  OnboardingTask,
  PipelineStage,
  SchedulerSlot,
  SubmitApplicationInput,
} from '../types';

interface DataContextValue {
  jobs: JobOpening[];
  candidates: Candidate[];
  onboardingTasks: OnboardingTask[];
  interviewers: typeof mockInterviewers;
  addJob: (input: CreateJobInput) => JobOpening;
  applyToJob: (input: SubmitApplicationInput) => Candidate | null;
  updateCandidateStage: (candidateId: string, stage: PipelineStage) => void;
  hasAppliedTo: (jobId: string, email: string) => boolean;
  getCandidate: (id: string) => Candidate | undefined;
  getInterviews: () => Array<Interview & { candidateName?: string }>;
  getCalendarInterviews: (from?: string, to?: string) => Interview[];
  createInterview: (input: CreateInterviewInput) => Interview;
  updateInterview: (
    id: string,
    input: Partial<
      Pick<
        Interview,
        | 'status'
        | 'outcome'
        | 'score'
        | 'feedback'
        | 'strengths'
        | 'concerns'
        | 'evidence'
        | 'scheduledAt'
        | 'durationMinutes'
      >
    >,
  ) => Interview;
  getSchedulerSlots: (input: { start?: string; end?: string }) => {
    slots: SchedulerSlot[];
    schedulerConfigured: boolean;
  };
  bookSchedulerSlot: (input: BookSchedulerInput) => Interview;
}

interface PersistShape {
  jobs: JobOpening[];
  candidates: Candidate[];
  onboardingTasks: OnboardingTask[];
}

const DataContext = createContext<DataContextValue | null>(null);
const STORAGE_KEY = 'hireforce_data';

const SEED: PersistShape = {
  jobs: mockJobs,
  candidates: mockCandidates,
  onboardingTasks: mockOnboardingTasks,
};

function load(): PersistShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistShape;
      if (parsed.jobs?.length || parsed.candidates?.length) return parsed;
    }
  } catch {
    /* ignore malformed storage */
  }
  return SEED;
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function interviewerName(id?: string): string {
  return mockInterviewers.find((i) => i.id === id)?.name ?? 'Assigned interviewer';
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

  const addJob = useCallback((input: CreateJobInput): JobOpening => {
    const job: JobOpening = {
      id: uid('job'),
      title: input.title.trim(),
      department: input.department?.trim() ?? '',
      location: input.location?.trim() ?? 'Remote / Hybrid',
      description: input.description?.trim() ?? '',
      status: 'open',
      applicantCount: 0,
      createdAt: new Date().toISOString(),
      applicationQuestions: input.applicationQuestions?.filter((q) => q.prompt.trim()) ?? [],
    };
    setData((d) => ({ ...d, jobs: [job, ...d.jobs] }));
    return job;
  }, []);

  const applyToJob = useCallback((input: SubmitApplicationInput): Candidate | null => {
    let created: Candidate | null = null;
    setData((d) => {
      const job = d.jobs.find((j) => j.id === input.jobId);
      if (!job || d.candidates.some((c) => c.jobId === input.jobId && c.email === input.email)) {
        return d;
      }
      created = {
        id: uid('c'),
        name: input.name,
        email: input.email,
        roleApplied: job.title,
        jobId: input.jobId,
        stage: 'applied',
        appliedAt: new Date().toISOString(),
        avatarInitials: initials(input.name),
        interviews: [],
        applicationAnswers: input.answers,
        resumeFileName: input.resumeFileName,
        resumeUrl: input.resumeUrl,
      };
      return { ...d, candidates: [created, ...d.candidates] };
    });
    return created;
  }, []);

  const updateCandidateStage = useCallback((candidateId: string, stage: PipelineStage) => {
    setData((d) => {
      const candidate = d.candidates.find((c) => c.id === candidateId);
      const candidates = d.candidates.map((c) => (c.id === candidateId ? { ...c, stage } : c));

      let onboardingTasks = d.onboardingTasks;
      const alreadyOnboarding = d.onboardingTasks.some((t) => t.candidateId === candidateId);
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
  }, []);

  const hasAppliedTo = useCallback(
    (jobId: string, email: string) =>
      data.candidates.some((c) => c.jobId === jobId && c.email === email),
    [data.candidates],
  );

  const getCandidate = useCallback(
    (id: string) => data.candidates.find((c) => c.id === id),
    [data.candidates],
  );

  const getInterviews = useCallback((): Array<Interview & { candidateName?: string }> => {
    return data.candidates.flatMap((c) =>
      c.interviews.map((i) => ({ ...i, candidateName: c.name, candidateId: c.id })),
    );
  }, [data.candidates]);

  const getCalendarInterviews = useCallback(
    (from?: string, to?: string): Interview[] => {
      const fromTime = from ? new Date(from).getTime() : Date.now();
      const toTime = to ? new Date(to).getTime() : fromTime + 14 * 86400000;
      return getInterviews().filter((i) => {
        if (!i.scheduledAt || i.status === 'Cancelled') return false;
        const t = new Date(i.scheduledAt).getTime();
        return t >= fromTime && t <= toTime;
      });
    },
    [getInterviews],
  );

  const createInterview = useCallback((input: CreateInterviewInput): Interview => {
    const candidate = data.candidates.find((c) => c.id === input.candidateId);
    const interview: Interview = {
      id: uid('i'),
      candidateId: input.candidateId,
      candidateName: candidate?.name,
      scheduledAt: input.scheduledAt,
      interviewer: interviewerName(input.interviewerId),
      interviewerId: input.interviewerId,
      type: input.type ?? 'Interview',
      status: input.status ?? 'Scheduled',
      outcome: 'pending',
      durationMinutes: input.durationMinutes ?? 45,
      calendarSynced: Boolean(input.interviewerId),
    };

    setData((d) => ({
      ...d,
      candidates: d.candidates.map((c) =>
        c.id === input.candidateId ? { ...c, interviews: [interview, ...c.interviews] } : c,
      ),
    }));
    return interview;
  }, [data.candidates]);

  const updateInterview = useCallback(
    (
      id: string,
      input: Partial<
        Pick<
          Interview,
          | 'status'
          | 'outcome'
          | 'score'
          | 'feedback'
          | 'strengths'
          | 'concerns'
          | 'evidence'
          | 'scheduledAt'
          | 'durationMinutes'
        >
      >,
    ): Interview => {
      let updated: Interview | undefined;
      setData((d) => ({
        ...d,
        candidates: d.candidates.map((c) => ({
          ...c,
          interviews: c.interviews.map((i) => {
            if (i.id !== id) return i;
            updated = { ...i, ...input };
            return updated;
          }),
        })),
      }));
      if (!updated) throw new Error('Interview not found.');
      return updated;
    },
    [],
  );

  const getSchedulerSlots = useCallback(
    (_input: { start?: string; end?: string }) => {
      const slots: SchedulerSlot[] = [];
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      for (let day = 0; day < 7; day += 1) {
        const date = new Date(start);
        date.setDate(date.getDate() + day);
        for (const hour of [9, 10, 11, 14, 15, 16]) {
          for (const interviewer of mockInterviewers.slice(0, 2)) {
            const slotStart = new Date(date);
            slotStart.setHours(hour, 0, 0, 0);
            const slotEnd = new Date(slotStart.getTime() + 45 * 60000);
            slots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              interviewerId: interviewer.id,
              interviewerName: interviewer.name,
            });
          }
        }
      }

      return { slots: slots.slice(0, 24), schedulerConfigured: false };
    },
    [],
  );

  const bookSchedulerSlot = useCallback(
    (input: BookSchedulerInput): Interview => {
      if (input.interviewId) {
        return updateInterview(input.interviewId, {
          scheduledAt: input.start,
          status: 'Scheduled',
        });
      }
      return createInterview({
        candidateId: input.candidateId,
        scheduledAt: input.start,
        interviewerId: input.interviewerId,
        type: input.type,
        durationMinutes: 45,
        status: 'Scheduled',
      });
    },
    [createInterview, updateInterview],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      jobs: data.jobs,
      candidates: data.candidates,
      onboardingTasks: data.onboardingTasks,
      interviewers: mockInterviewers,
      addJob,
      applyToJob,
      updateCandidateStage,
      hasAppliedTo,
      getCandidate,
      getInterviews,
      getCalendarInterviews,
      createInterview,
      updateInterview,
      getSchedulerSlots,
      bookSchedulerSlot,
    }),
    [
      data,
      addJob,
      applyToJob,
      updateCandidateStage,
      hasAppliedTo,
      getCandidate,
      getInterviews,
      getCalendarInterviews,
      createInterview,
      updateInterview,
      getSchedulerSlots,
      bookSchedulerSlot,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
