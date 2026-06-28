import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, CalendarPlus, CheckCircle2, FileText, Loader2, Mail, Star } from 'lucide-react';
import { StageBadge } from '../../components/candidate/StageBadge';
import { StageStepper } from '../../components/candidate/StageStepper';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { useCandidate, useCreateInterview, useInterviewers, useUpdateCandidateStage } from '../../hooks/useHireForce';
import type { PipelineStage } from '../../types';

const INTERVIEW_TYPES = ['Phone Screen', 'Technical', 'Panel', 'Final Round'];

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: candidate, isLoading, error } = useCandidate(id);
  const updateStage = useUpdateCandidateStage();
  const createInterview = useCreateInterview();
  const { data: interviewers = [] } = useInterviewers();
  const [showOnboardingToast, setShowOnboardingToast] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');
  const [scheduleForm, setScheduleForm] = useState({ scheduledAt: '', interviewerId: '', type: 'Phone Screen', durationMinutes: 45 });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-white/50"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (error || !candidate) {
    return <EmptyState title="Candidate not found" description={error instanceof Error ? error.message : 'This candidate may have been removed.'} action={{ label: 'Back to dashboard', to: '/hr' }} />;
  }

  const handleStageChange = async (newStage: PipelineStage) => {
    await updateStage.mutateAsync({ id: candidate.id, stage: newStage });
    if (newStage === 'hired') {
      setShowOnboardingToast(true);
      setTimeout(() => setShowOnboardingToast(false), 4000);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError('');
    setScheduleSuccess('');
    try {
      const interview = await createInterview.mutateAsync({
        candidateId: candidate.id,
        scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
        interviewerId: scheduleForm.interviewerId || undefined,
        type: scheduleForm.type,
        durationMinutes: scheduleForm.durationMinutes,
      });
      setScheduleOpen(false);
      setScheduleSuccess(interview.calendarSynced ? 'Interview scheduled and synced to Salesforce calendar.' : 'Interview scheduled.');
      setTimeout(() => setScheduleSuccess(''), 5000);
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : 'Could not schedule interview.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 text-white">
      <Link to="/hr" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"><ArrowLeft className="h-4 w-4" />Back to pipeline</Link>
      {showOnboardingToast && <div className="flex items-center gap-3 rounded-xl border border-white/30 bg-white/5 px-4 py-3"><CheckCircle2 className="h-5 w-5" /><p className="text-sm">Auto-onboarding triggered for {candidate.name}</p></div>}
      {scheduleSuccess && <div className="flex items-center gap-3 rounded-xl border border-white/30 bg-white/5 px-4 py-3"><CalendarPlus className="h-5 w-5" /><p className="text-sm">{scheduleSuccess}</p></div>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/5 text-xl font-bold">{candidate.avatarInitials}</div>
          <div>
            <h1 className="text-2xl font-bold">{candidate.name}</h1>
            <p className="text-white/60">{candidate.roleApplied}</p>
            <div className="mt-1"><StageBadge stage={candidate.stage} /></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setScheduleOpen(true)} className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm"><CalendarPlus className="h-4 w-4" />Schedule Interview</button>
          <Link to="/hr/interviews" className="btn-mono btn-mono-outline !px-4 !py-2 !text-sm">View interviews</Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-4"><Mail className="h-4 w-4 text-white/50" /><p className="mt-2 text-sm text-white/50">Email</p><p className="truncate">{candidate.email}</p></div>
        <div className="panel p-4"><Calendar className="h-4 w-4 text-white/50" /><p className="mt-2 text-sm text-white/50">Applied</p><p>{new Date(candidate.appliedAt).toLocaleDateString()}</p></div>
        {candidate.score != null && <div className="panel p-4"><Star className="h-4 w-4" /><p className="mt-2 text-sm text-white/50">Screen Score</p><p>{candidate.score}/100</p></div>}
      </div>
      <section className="panel p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">Pipeline Stage</h2>
        <StageStepper currentStage={candidate.stage} onStageChange={(stage) => void handleStageChange(stage)} />
      </section>

      {(candidate.applicationAnswers?.length ?? 0) > 0 && (
        <section className="panel p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">Application Responses</h2>
          <ul className="space-y-4">
            {candidate.applicationAnswers!.map((item) => (
              <li key={item.questionId} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <p className="text-sm font-medium text-white/70">{item.questionPrompt}</p>
                <p className="mt-2 text-sm text-white">{item.answer}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {candidate.resumeFileName && (
        <section className="panel p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">Resume</h2>
          {candidate.resumeUrl ? (
            <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-white hover:underline">
              <FileText className="h-4 w-4" />
              {candidate.resumeFileName}
            </a>
          ) : (
            <p className="flex items-center gap-2 text-sm text-white/60">
              <FileText className="h-4 w-4" />
              {candidate.resumeFileName}
            </p>
          )}
        </section>
      )}

      <section className="panel p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">Interview History</h2>
        {candidate.interviews.length === 0 ? <p className="text-sm text-white/40">No interviews logged yet</p> : (
          <ul className="space-y-4">
            {candidate.interviews.map((interview) => (
              <li key={interview.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <p className="font-medium">{interview.type}</p>
                <p className="text-sm text-white/50">with {interview.interviewer} · {new Date(interview.scheduledAt).toLocaleString()}</p>
                {interview.calendarSynced && <p className="mt-1 text-xs text-white/40">Synced to Salesforce calendar</p>}
                {interview.feedback && <p className="mt-2 text-sm text-white/60">{interview.feedback}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Schedule Interview">
        <form onSubmit={handleSchedule} className="space-y-4">
          {scheduleError && <div className="rounded-lg border border-white/30 bg-white/5 px-3 py-2 text-sm">{scheduleError}</div>}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/60">Date & Time</label>
            <input type="datetime-local" required value={scheduleForm.scheduledAt} onChange={(e) => setScheduleForm((f) => ({ ...f, scheduledAt: e.target.value }))} className="input-mono mt-1" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/60">Interviewer</label>
            <select required value={scheduleForm.interviewerId} onChange={(e) => setScheduleForm((f) => ({ ...f, interviewerId: e.target.value }))} className="input-mono mt-1">
              <option value="">Select interviewer</option>
              {interviewers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-white/60">Type</label>
              <select value={scheduleForm.type} onChange={(e) => setScheduleForm((f) => ({ ...f, type: e.target.value }))} className="input-mono mt-1">
                {INTERVIEW_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-white/60">Duration (min)</label>
              <input type="number" min={15} max={180} step={15} value={scheduleForm.durationMinutes} onChange={(e) => setScheduleForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))} className="input-mono mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setScheduleOpen(false)} className="btn-mono btn-mono-outline !px-4 !py-2 !text-sm">Cancel</button>
            <button type="submit" disabled={createInterview.isPending} className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm">{createInterview.isPending ? 'Scheduling...' : 'Schedule & Sync Calendar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
