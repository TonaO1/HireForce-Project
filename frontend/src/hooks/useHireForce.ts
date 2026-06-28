import { useCallback, useEffect, useMemo, useState, type DependencyList } from 'react';
import {
  bookSchedulerSlot,
  createInterview,
  createJob,
  getCalendarInterviews,
  getCandidate,
  getCandidates,
  getInterviewers,
  getInterviews,
  getJobs,
  getMyApplications,
  getOnboardingTasks,
  getSchedulerSlots,
  submitApplication,
  updateCandidateStage,
  updateInterview,
} from '../lib/api';
import type {
  BookSchedulerInput,
  Candidate,
  CreateInterviewInput,
  CreateJobInput,
  Interview,
  Interviewer,
  JobOpening,
  OnboardingTask,
  PipelineStage,
  SchedulerSlot,
  SubmitApplicationInput,
} from '../types';

const DATA_CHANGED = 'hireforce:data-changed';

interface QueryState<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
}

function notifyDataChanged() {
  window.dispatchEvent(new Event(DATA_CHANGED));
}

function useApiQuery<T>(
  loader: () => Promise<T>,
  deps: DependencyList,
  enabled = true,
): QueryState<T> {
  const [data, setData] = useState<T>();
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener(DATA_CHANGED, refresh);
    return () => window.removeEventListener(DATA_CHANGED, refresh);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    setError(null);
    loader()
      .then((result) => {
        if (!active) return;
        setData(result);
      })
      .catch((queryError) => {
        if (!active) return;
        setError(queryError instanceof Error ? queryError : new Error('API request failed.'));
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version, enabled]);

  return { data, isLoading, error };
}

function useMutation<TInput, TResult>(
  action: (input: TInput) => Promise<TResult>,
  options: { notify?: boolean; success?: boolean } = {},
) {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const mutateAsync = useCallback(
    async (input: TInput) => {
      setIsPending(true);
      setIsSuccess(false);
      try {
        const result = await action(input);
        if (options.notify !== false) notifyDataChanged();
        if (options.success) setIsSuccess(true);
        return result;
      } finally {
        setIsPending(false);
      }
    },
    [action, options.notify, options.success],
  );
  return { isPending, isSuccess, mutateAsync };
}

export function useJobs() {
  return useApiQuery<JobOpening[]>(getJobs, []);
}

export function useCreateJob() {
  return useMutation<CreateJobInput, JobOpening>(createJob);
}

export function useCandidates() {
  return useApiQuery<Candidate[]>(getCandidates, []);
}

export function useCandidate(id: string | undefined) {
  return useApiQuery<Candidate>(() => getCandidate(id || ''), [id], Boolean(id));
}

export function useUpdateCandidateStage() {
  return useMutation<{ id: string; stage: PipelineStage }, Candidate>(({ id, stage }) =>
    updateCandidateStage(id, stage),
  );
}

export function useSubmitApplication() {
  return useMutation<SubmitApplicationInput, Candidate>(
    (input) =>
      submitApplication({
        jobId: input.jobId,
        name: input.name,
        email: input.email,
        phone: undefined,
        answers: input.answers,
        resumeFileName: input.resumeFileName,
        resumeFileBase64: input.resumeFileBase64,
        resumeMimeType: input.resumeMimeType,
      }),
    { success: true },
  );
}

export function useMyApplications(email: string | undefined) {
  return useApiQuery<Candidate[]>(() => getMyApplications(email || ''), [email], Boolean(email));
}

export function useInterviews() {
  return useApiQuery<Array<Interview & { candidateName?: string }>>(getInterviews, []);
}

export function useCreateInterview() {
  return useMutation<CreateInterviewInput, Interview>(createInterview);
}

export function useUpdateInterview() {
  return useMutation<
    {
      id: string;
      input: Parameters<typeof updateInterview>[1];
    },
    Interview
  >(({ id, input }) => updateInterview(id, input));
}

export function useInterviewers() {
  return useApiQuery<Interviewer[]>(getInterviewers, []);
}

export function useCalendarInterviews(from?: string, to?: string) {
  return useApiQuery<Interview[]>(() => getCalendarInterviews(from, to), [from, to]);
}

export function useOnboardingTasks() {
  return useApiQuery<OnboardingTask[]>(getOnboardingTasks, []);
}

export function useSchedulerSlots(input: { start?: string; end?: string; interviewerId?: string; enabled?: boolean }) {
  const enabled = input.enabled ?? true;
  const key = useMemo(() => JSON.stringify(input), [input]);
  return useApiQuery<{ slots: SchedulerSlot[]; schedulerConfigured: boolean }>(
    () => getSchedulerSlots(input),
    [key],
    enabled,
  );
}

export function useBookSchedulerSlot() {
  return useMutation<BookSchedulerInput, Interview>(bookSchedulerSlot);
}
