import { useCallback, useState } from 'react';
import { useData } from '../contexts/DataContext';
import type {
  BookSchedulerInput,
  CreateInterviewInput,
  CreateJobInput,
  PipelineStage,
  SubmitApplicationInput,
} from '../types';

/** Mock-data hooks — no backend API calls. */

const NO_ERROR = null as Error | null;

export function useJobs() {
  const { jobs } = useData();
  return { data: jobs, isLoading: false, error: NO_ERROR };
}

export function useCreateJob() {
  const { addJob } = useData();
  const [isPending, setIsPending] = useState(false);
  const mutateAsync = useCallback(
    async (input: CreateJobInput) => {
      setIsPending(true);
      try {
        return addJob(input);
      } finally {
        setIsPending(false);
      }
    },
    [addJob],
  );
  return { isPending, mutateAsync };
}

export function useCandidates() {
  const { candidates } = useData();
  return { data: candidates, isLoading: false, error: NO_ERROR };
}

export function useCandidate(id: string | undefined) {
  const { getCandidate } = useData();
  const candidate = id ? getCandidate(id) : undefined;
  return {
    data: candidate,
    isLoading: false,
    error: id && !candidate ? new Error('Candidate not found.') : null,
  };
}

export function useUpdateCandidateStage() {
  const { updateCandidateStage, getCandidate } = useData();
  const [isPending, setIsPending] = useState(false);
  const mutateAsync = useCallback(
    async ({ id, stage }: { id: string; stage: PipelineStage }) => {
      setIsPending(true);
      try {
        updateCandidateStage(id, stage);
        const candidate = getCandidate(id);
        if (!candidate) throw new Error('Candidate not found.');
        return candidate;
      } finally {
        setIsPending(false);
      }
    },
    [updateCandidateStage, getCandidate],
  );
  return { isPending, mutateAsync };
}

export function useSubmitApplication() {
  const { applyToJob } = useData();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const mutateAsync = useCallback(
    async (input: SubmitApplicationInput) => {
      setIsPending(true);
      setIsSuccess(false);
      try {
        const result = applyToJob(input);
        if (!result) throw new Error('Already applied or job not found.');
        setIsSuccess(true);
        return result;
      } finally {
        setIsPending(false);
      }
    },
    [applyToJob],
  );
  return { isPending, isSuccess, mutateAsync };
}

export function useMyApplications(email: string | undefined) {
  const { candidates } = useData();
  const applications = email ? candidates.filter((c) => c.email === email) : [];
  return { data: applications, isLoading: false, error: NO_ERROR };
}

export function useInterviews() {
  const { getInterviews } = useData();
  return { data: getInterviews(), isLoading: false, error: NO_ERROR };
}

export function useCreateInterview() {
  const { createInterview } = useData();
  const [isPending, setIsPending] = useState(false);
  const mutateAsync = useCallback(
    async (input: CreateInterviewInput) => {
      setIsPending(true);
      try {
        return createInterview(input);
      } finally {
        setIsPending(false);
      }
    },
    [createInterview],
  );
  return { isPending, mutateAsync };
}

export function useUpdateInterview() {
  const { updateInterview } = useData();
  const [isPending, setIsPending] = useState(false);
  const mutateAsync = useCallback(
    async ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof updateInterview>[1];
    }) => {
      setIsPending(true);
      try {
        return updateInterview(id, input);
      } finally {
        setIsPending(false);
      }
    },
    [updateInterview],
  );
  return { isPending, mutateAsync };
}

export function useInterviewers() {
  const { interviewers } = useData();
  return { data: interviewers, isLoading: false, error: NO_ERROR };
}

export function useCalendarInterviews(from?: string, to?: string) {
  const { getCalendarInterviews } = useData();
  return { data: getCalendarInterviews(from, to), isLoading: false, error: NO_ERROR };
}

export function useOnboardingTasks() {
  const { onboardingTasks } = useData();
  return { data: onboardingTasks, isLoading: false, error: NO_ERROR };
}

export function useSchedulerSlots(input: { start?: string; end?: string; enabled?: boolean }) {
  const { getSchedulerSlots } = useData();
  const enabled = input.enabled ?? true;
  return {
    data: enabled ? getSchedulerSlots(input) : undefined,
    isLoading: false,
    error: NO_ERROR,
  };
}

export function useBookSchedulerSlot() {
  const { bookSchedulerSlot } = useData();
  const [isPending, setIsPending] = useState(false);
  const mutateAsync = useCallback(
    async (input: BookSchedulerInput) => {
      setIsPending(true);
      try {
        return bookSchedulerSlot(input);
      } finally {
        setIsPending(false);
      }
    },
    [bookSchedulerSlot],
  );
  return { isPending, mutateAsync };
}
