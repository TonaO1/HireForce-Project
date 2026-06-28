export type UserRole = 'hr' | 'applicant';

export type PipelineStage =
  | 'applied'
  | 'screened'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected';

export type JobStatus = 'open' | 'closed' | 'draft';

export type InterviewOutcome = 'pass' | 'fail' | 'pending';

export type OnboardingStatus = 'pending' | 'in_progress' | 'done';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  status: JobStatus;
  applicantCount: number;
  description: string;
  createdAt?: string;
}

export interface CreateJobInput {
  title: string;
  department?: string;
  location?: string;
  description?: string;
  headcount?: number;
  priority?: 'High' | 'Medium' | 'Low';
  targetStartDate?: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName?: string;
  scheduledAt: string;
  interviewer: string;
  feedback?: string;
  outcome?: InterviewOutcome;
  type: string;
  status?: string;
  score?: number;
  strengths?: string;
  concerns?: string;
  evidence?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  roleApplied: string;
  jobId: string;
  stage: PipelineStage;
  appliedAt: string;
  resumeUrl?: string;
  avatarInitials: string;
  score?: number;
  interviews: Interview[];
  notes?: string;
}

export interface OnboardingTask {
  id: string;
  candidateId: string;
  candidateName: string;
  title: string;
  status: OnboardingStatus;
  triggeredAt: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  'applied',
  'screened',
  'interview',
  'offer',
  'hired',
  'rejected',
];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  applied: 'Applied',
  screened: 'Screened',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
};

// Monochrome emphasis scale (no color accents); consumed by StageBadge.
export const STAGE_COLORS: Record<PipelineStage, string> = {
  applied: 'border-white/25 text-white/60',
  screened: 'border-white/35 text-white/75',
  interview: 'border-white/50 text-white/90',
  offer: 'border-white/70 text-white',
  hired: 'border-white bg-white text-black',
  rejected: 'border-white/20 text-white/40',
};
