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
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function getHealth(): Promise<{
  ok: boolean;
  salesforceConfigured: boolean;
  schedulerConfigured: boolean;
}> {
  return request('/api/health');
}

export async function getJobs(): Promise<JobOpening[]> {
  return request('/api/jobs');
}

export async function createJob(input: CreateJobInput): Promise<JobOpening> {
  return request('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getCandidates(): Promise<Candidate[]> {
  return request('/api/candidates');
}

export async function getCandidate(id: string): Promise<Candidate> {
  return request(`/api/candidates/${encodeURIComponent(id)}`);
}

export async function updateCandidateStage(id: string, stage: PipelineStage): Promise<Candidate> {
  return request(`/api/candidates/${encodeURIComponent(id)}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage }),
  });
}

export async function submitApplication(input: {
  jobId: string;
  name: string;
  email: string;
  phone?: string;
  answers?: unknown[];
  resumeFileName?: string;
  resumeFileBase64?: string;
  resumeMimeType?: string;
}): Promise<Candidate> {
  return request('/api/applications', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getMyApplications(email: string): Promise<Candidate[]> {
  return request(`/api/applications/me?email=${encodeURIComponent(email)}`);
}

export async function getInterviews(): Promise<Array<Interview & { candidateName?: string }>> {
  return request('/api/interviews');
}

export async function createInterview(input: CreateInterviewInput): Promise<Interview> {
  return request('/api/interviews', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateInterview(
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
): Promise<Interview> {
  return request(`/api/interviews/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function getInterviewers(): Promise<Interviewer[]> {
  return request('/api/interviewers');
}

export async function getCalendarInterviews(from?: string, to?: string): Promise<Interview[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return request(`/api/calendar/interviews${query ? `?${query}` : ''}`);
}

export async function getSchedulerSlots(input: {
  interviewerId?: string;
  start?: string;
  end?: string;
}): Promise<{ slots: SchedulerSlot[]; schedulerConfigured: boolean }> {
  const params = new URLSearchParams();
  if (input.interviewerId) params.set('interviewerId', input.interviewerId);
  if (input.start) params.set('start', input.start);
  if (input.end) params.set('end', input.end);
  const query = params.toString();
  return request(`/api/scheduler/slots${query ? `?${query}` : ''}`);
}

export async function bookSchedulerSlot(input: BookSchedulerInput): Promise<Interview> {
  return request('/api/scheduler/book', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getOnboardingTasks(): Promise<OnboardingTask[]> {
  return request('/api/onboarding');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || `API request failed: ${response.status}`);
  }
  return body as T;
}
