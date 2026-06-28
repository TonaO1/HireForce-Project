import type { Candidate, CreateJobInput, Interview, JobOpening, OnboardingTask, PipelineStage } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

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
}): Promise<Candidate> {
  return request('/api/applications', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getInterviews(): Promise<Array<Interview & { candidateName?: string }>> {
  return request('/api/interviews');
}

export async function updateInterview(
  id: string,
  input: Partial<Pick<Interview, 'status' | 'outcome' | 'score' | 'feedback' | 'strengths' | 'concerns' | 'evidence'>>,
): Promise<Interview> {
  return request(`/api/interviews/${encodeURIComponent(id)}`, {
    method: 'PATCH',
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
