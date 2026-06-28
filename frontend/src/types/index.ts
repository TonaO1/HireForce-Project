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

export interface Interview {
  id: string;
  candidateId: string;
  scheduledAt: string;
  interviewer: string;
  feedback?: string;
  outcome?: InterviewOutcome;
  type: string;
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

export const STAGE_COLORS: Record<PipelineStage, string> = {
  applied: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  screened: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  interview: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  offer: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  hired: 'bg-green-500/30 text-green-200 border-green-500/40',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
};
